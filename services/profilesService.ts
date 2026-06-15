import { logSupabaseError, logSupabaseRequest, logSupabaseSuccess } from '../lib/supabaseDebug';
import { supabase } from '../lib/supabase';
import { SUPABASE_TABLES } from '../lib/supabaseTables';
import { resolveAuthenticatedUserId } from '../lib/supabaseQueryGuards';

export type DbProfile = {
  id: string;
  setup_completed: boolean;
};

export async function fetchUserProfile(userId: string): Promise<DbProfile> {
  logSupabaseRequest('fetchUserProfile', { table: SUPABASE_TABLES.profiles, userId });

  const { data, error } = await supabase
    .from(SUPABASE_TABLES.profiles)
    .select('id, setup_completed')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    logSupabaseError('fetchUserProfile', error, SUPABASE_TABLES.profiles);
    throw error;
  }

  const profile = {
    id: userId,
    setup_completed: data?.setup_completed ?? false,
  };

  logSupabaseSuccess('fetchUserProfile', profile);
  return profile;
}

export async function completeUserSetup(userId: string): Promise<void> {
  const authenticatedUserId = await resolveAuthenticatedUserId(userId);
  if (!authenticatedUserId) {
    throw new Error('Authentication required to complete setup.');
  }

  logSupabaseRequest('completeUserSetup', {
    table: SUPABASE_TABLES.profiles,
    userId: authenticatedUserId,
  });

  const { data, error } = await supabase
    .from(SUPABASE_TABLES.profiles)
    .update({ setup_completed: true })
    .eq('id', authenticatedUserId)
    .select('id')
    .maybeSingle();

  if (error) {
    logSupabaseError('completeUserSetup', error, SUPABASE_TABLES.profiles);
    throw error;
  }

  if (!data) {
    throw new Error('Profile not found. Sign out and sign in again, then retry setup.');
  }

  logSupabaseSuccess('completeUserSetup', { userId: authenticatedUserId });
}
