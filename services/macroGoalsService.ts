import { logSupabaseError, logSupabaseRequest, logSupabaseSuccess } from '../lib/supabaseDebug';
import { supabase } from '../lib/supabase';
import { SUPABASE_TABLES } from '../lib/supabaseTables';
import type { ActivityLevel, Gender, MacroGoalTargets, UserProfile } from '../utils/macroCalculator';

type MacroGoalsRow = {
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: Gender;
  activity_level: ActivityLevel;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

function parseActivityLevel(value: string | null | undefined): ActivityLevel {
  const valid: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
  return valid.includes(value as ActivityLevel) ? (value as ActivityLevel) : 'moderate';
}

export async function fetchRemoteMacroGoals(
  userId: string,
): Promise<{ profile: UserProfile; goals: MacroGoalTargets } | null> {
  logSupabaseRequest('fetchRemoteMacroGoals', {
    table: SUPABASE_TABLES.macroGoals,
    userId,
  });

  const { data, error } = await supabase
    .from(SUPABASE_TABLES.macroGoals)
    .select(
      'weight_kg, height_cm, age, gender, activity_level, calories, protein, carbs, fat',
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logSupabaseError('fetchRemoteMacroGoals', error, SUPABASE_TABLES.macroGoals);
    return null;
  }

  if (!data) {
    return null;
  }

  const row = data as MacroGoalsRow;
  const profile: UserProfile = {
    weightKg: Number(row.weight_kg) || 60,
    heightCm: Number(row.height_cm) || 170,
    age: Number(row.age) || 20,
    gender: row.gender === 'male' ? 'male' : 'female',
    activityLevel: parseActivityLevel(row.activity_level),
  };

  const goals: MacroGoalTargets = {
    calories: Number(row.calories) || 2000,
    protein: Number(row.protein) || 75,
    carbs: Number(row.carbs) || 250,
    fat: Number(row.fat) || 65,
  };

  logSupabaseSuccess('fetchRemoteMacroGoals', { userId });
  return { profile, goals };
}

export async function fetchRemoteDailyAllowance(userId: string): Promise<number | null> {
  logSupabaseRequest('fetchRemoteDailyAllowance', {
    table: SUPABASE_TABLES.jar,
    userId,
  });

  const { data, error } = await supabase
    .from(SUPABASE_TABLES.jar)
    .select('daily_allowance')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logSupabaseError('fetchRemoteDailyAllowance', error, SUPABASE_TABLES.jar);
    return null;
  }

  const allowance = Number(data?.daily_allowance);
  if (!Number.isFinite(allowance) || allowance <= 0) {
    return null;
  }

  logSupabaseSuccess('fetchRemoteDailyAllowance', { userId, dailyAllowance: allowance });
  return allowance;
}
