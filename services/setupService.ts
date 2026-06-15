import { logSupabaseError, logSupabaseRequest, logSupabaseSuccess } from '../lib/supabaseDebug';
import { resolveAuthenticatedUserId } from '../lib/supabaseQueryGuards';
import { supabase } from '../lib/supabase';
import { SUPABASE_TABLES } from '../lib/supabaseTables';
import type { MacroGoalTargets, UserProfile } from '../utils/macroCalculator';

const DEFAULT_DAILY_ALLOWANCE = 250;
const DEFAULT_EMERGENCY_FUND = 200;

function throwSetupError(
  operation: string,
  error: { code?: string; message: string; details?: string | null; hint?: string | null },
  table?: (typeof SUPABASE_TABLES)[keyof typeof SUPABASE_TABLES],
): never {
  logSupabaseError(operation, error, table);

  if (
    error.code === 'PGRST205' ||
    error.message.includes("Could not find the table 'public.")
  ) {
    throw new Error(
      'Setup tables are missing in Supabase. Run supabase/schema.sql in the SQL Editor, then try again.',
    );
  }

  throw error;
}

export type PersistUserSetupInput = {
  userId: string;
  profile: UserProfile;
  goals: MacroGoalTargets;
  dailyAllowance?: number;
};

export async function persistUserSetup({
  userId,
  profile,
  goals,
  dailyAllowance = DEFAULT_DAILY_ALLOWANCE,
}: PersistUserSetupInput): Promise<void> {
  const authenticatedUserId = await resolveAuthenticatedUserId(userId);
  if (!authenticatedUserId) {
    throw new Error('Authentication required to complete setup.');
  }

  logSupabaseRequest('persistUserSetup', { userId: authenticatedUserId });

  const timestamp = new Date().toISOString();

  const macroPayload = {
    user_id: authenticatedUserId,
    weight_kg: profile.weightKg,
    height_cm: profile.heightCm,
    age: profile.age,
    gender: profile.gender,
    activity_level: profile.activityLevel,
    calories: goals.calories,
    protein: goals.protein,
    carbs: goals.carbs,
    fat: goals.fat,
    updated_at: timestamp,
  };

  logSupabaseRequest('persistUserSetup.macro_goals.upsert', {
    table: SUPABASE_TABLES.macroGoals,
    userId: authenticatedUserId,
  });

  const { error: macroError } = await supabase
    .from(SUPABASE_TABLES.macroGoals)
    .upsert(macroPayload, { onConflict: 'user_id' });

  if (macroError) {
    throwSetupError('persistUserSetup.macro_goals', macroError, SUPABASE_TABLES.macroGoals);
  }

  logSupabaseRequest('persistUserSetup.jar.lookup', {
    table: SUPABASE_TABLES.jar,
    userId: authenticatedUserId,
  });

  const { data: existingJar, error: jarLookupError } = await supabase
    .from(SUPABASE_TABLES.jar)
    .select('user_id')
    .eq('user_id', authenticatedUserId)
    .maybeSingle();

  if (jarLookupError) {
    throwSetupError('persistUserSetup.jar.lookup', jarLookupError, SUPABASE_TABLES.jar);
  }

  if (!existingJar) {
    logSupabaseRequest('persistUserSetup.jar.insert', {
      table: SUPABASE_TABLES.jar,
      userId: authenticatedUserId,
    });

    const { error: jarInsertError } = await supabase.from(SUPABASE_TABLES.jar).insert({
      user_id: authenticatedUserId,
      daily_allowance: dailyAllowance,
      emergency_fund: DEFAULT_EMERGENCY_FUND,
      updated_at: timestamp,
    });

    if (jarInsertError) {
      throwSetupError('persistUserSetup.jar.insert', jarInsertError, SUPABASE_TABLES.jar);
    }
  } else {
    logSupabaseRequest('persistUserSetup.jar.update', {
      table: SUPABASE_TABLES.jar,
      userId: authenticatedUserId,
    });

    const { error: jarUpdateError } = await supabase
      .from(SUPABASE_TABLES.jar)
      .update({ daily_allowance: dailyAllowance, updated_at: timestamp })
      .eq('user_id', authenticatedUserId);

    if (jarUpdateError) {
      throwSetupError('persistUserSetup.jar.update', jarUpdateError, SUPABASE_TABLES.jar);
    }
  }

  logSupabaseRequest('persistUserSetup.profiles.update', {
    table: SUPABASE_TABLES.profiles,
    userId: authenticatedUserId,
  });

  const { data: updatedProfile, error: profileError } = await supabase
    .from(SUPABASE_TABLES.profiles)
    .update({ setup_completed: true })
    .eq('id', authenticatedUserId)
    .select('id')
    .maybeSingle();

  if (profileError) {
    throwSetupError('persistUserSetup.profiles', profileError, SUPABASE_TABLES.profiles);
  }

  if (!updatedProfile) {
    throw new Error('Profile not found. Sign out and sign in again, then retry setup.');
  }

  logSupabaseSuccess('persistUserSetup', { userId: authenticatedUserId });
}
