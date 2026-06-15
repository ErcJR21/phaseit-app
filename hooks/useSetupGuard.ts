import { useEffect } from 'react';
import { router, usePathname } from 'expo-router';
import { isGuestUser, useAuth } from '../context/AuthContext';

/** Routes that must never trigger a forced setup redirect. */
const SETUP_EXEMPT_ROUTES = new Set(['/setup', '/onboarding', '/login']);

/**
 * Redirects authenticated users who have not finished setup to /setup,
 * and sends completed users away from /setup to /dashboard.
 *
 * Waits until Supabase profile data has fully loaded before evaluating redirects.
 */
export function useSetupGuard() {
  const { user, isGuest, isLoading, dbProfile, isProfileLoading } = useAuth();
  const pathname = usePathname();
  const guestSession = isGuest || isGuestUser(user);
  const isRegistered = Boolean(user) && !guestSession;

  const profileLoaded = !isRegistered || (dbProfile !== null && !isProfileLoading);
  const guardLoading = isLoading || !profileLoaded;

  useEffect(() => {
    if (guardLoading) return;

    if (
      isRegistered &&
      dbProfile &&
      !dbProfile.setup_completed &&
      pathname !== '/setup' &&
      !SETUP_EXEMPT_ROUTES.has(pathname)
    ) {
      router.push('/setup');
      return;
    }

    if (isRegistered && dbProfile?.setup_completed && pathname === '/setup') {
      router.replace('/dashboard');
    }
  }, [guardLoading, isRegistered, dbProfile, pathname]);

  return {
    guardLoading,
    profileLoaded,
    isRegistered,
    setupCompleted: dbProfile?.setup_completed ?? false,
    onSetupRoute: pathname === '/setup',
  };
}
