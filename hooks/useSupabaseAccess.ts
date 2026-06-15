import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  buildSupabaseAccessContext,
  canFetchPublicData,
  canFetchUserData,
  type SupabaseAccessContext,
} from '../lib/supabaseQueryGuards';

export function useSupabaseAccess() {
  const { user, isGuest, isLoading } = useAuth();

  const access = useMemo<SupabaseAccessContext>(
    () =>
      buildSupabaseAccessContext({
        userId: user?.id,
        isGuest,
        isLoading,
      }),
    [user?.id, isGuest, isLoading],
  );

  return {
    access,
    userId: access.userId,
    isGuest: access.isGuest,
    isLoading: access.isLoading,
    canFetchPublicData: canFetchPublicData(access),
    canFetchUserData: canFetchUserData(access),
  };
}
