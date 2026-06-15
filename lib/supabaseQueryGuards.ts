import { supabase } from './supabase';

export type SupabaseAccessContext = {
  userId: string | null;
  isGuest: boolean;
  isLoading: boolean;
};

/** Public tables readable by anon + authenticated (e.g. recipes, canteens). */
export function canFetchPublicData({
  userId,
  isGuest,
  isLoading,
}: SupabaseAccessContext): boolean {
  if (isLoading) return false;
  return Boolean(userId) || isGuest;
}

/** User-scoped tables require a registered (non-anonymous) signed-in session. */
export function canFetchUserData({
  userId,
  isGuest,
  isLoading,
}: SupabaseAccessContext): boolean {
  if (isLoading) return false;
  return Boolean(userId) && !isGuest;
}

export function buildSupabaseAccessContext(input: {
  userId: string | null | undefined;
  isGuest: boolean;
  isLoading: boolean;
}): SupabaseAccessContext {
  return {
    userId: input.userId ?? null,
    isGuest: input.isGuest,
    isLoading: input.isLoading,
  };
}

/**
 * Resolves the active Supabase auth user id and optionally verifies it matches
 * the caller-supplied id. Returns null when unauthenticated or mismatched.
 */
export async function resolveAuthenticatedUserId(
  expectedUserId?: string,
): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user?.id ?? null;
  if (!userId) return null;
  if (expectedUserId && expectedUserId !== userId) return null;

  return userId;
}
