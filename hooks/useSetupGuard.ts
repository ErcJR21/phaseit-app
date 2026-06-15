import { useEffect, useState } from 'react';
import { router, usePathname } from 'expo-router';
import { isGuestUser, useAuth } from '../context/AuthContext';
import {
  isGuestSetupCompleted,
  isGuestSetupCompletedSync,
  isSetupGuardBypassed,
} from '../services/goalSetupService';

/** Routes that must never trigger a forced setup redirect. */
const SETUP_EXEMPT_ROUTES = new Set(['/goal-setup', '/setup', '/onboarding', '/login']);

/**
 * Redirects users who have not finished goal setup to /goal-setup.
 * Applies to registered users (Supabase profile) and guest users (local flag).
 */
export function useSetupGuard() {
  const { user, isGuest, isLoading, dbProfile, isProfileLoading } = useAuth();
  const pathname = usePathname();
  const guestSession = isGuest || isGuestUser(user);
  const isRegistered = Boolean(user) && !guestSession;

  const [guestSetupDone, setGuestSetupDone] = useState<boolean | null>(() =>
    guestSession && isGuestSetupCompletedSync() ? true : null,
  );

  useEffect(() => {
    if (!guestSession) {
      setGuestSetupDone(null);
      return;
    }

    if (isGuestSetupCompletedSync()) {
      setGuestSetupDone(true);
      return;
    }

    let isMounted = true;

    void isGuestSetupCompleted().then((completed) => {
      if (isMounted) setGuestSetupDone(completed);
    });

    return () => {
      isMounted = false;
    };
  }, [guestSession, user?.id]);

  const profileLoaded = !isRegistered || (dbProfile !== null && !isProfileLoading);
  const guestStateLoaded =
    !guestSession || guestSetupDone !== null || isGuestSetupCompletedSync();
  const guardLoading = isLoading || !profileLoaded || !guestStateLoaded;

  const guestNeedsSetup =
    guestSession && !(isGuestSetupCompletedSync() || guestSetupDone === true);

  const registeredNeedsSetup =
    isRegistered && dbProfile ? !dbProfile.setup_completed : false;

  const needsSetup = guestNeedsSetup || registeredNeedsSetup;

  useEffect(() => {
    if (guardLoading || !user || isSetupGuardBypassed()) return;

    if (needsSetup && pathname !== '/goal-setup' && !SETUP_EXEMPT_ROUTES.has(pathname)) {
      router.push('/goal-setup');
    }
  }, [guardLoading, user, needsSetup, pathname]);

  return {
    guardLoading,
    profileLoaded,
    isRegistered,
    setupCompleted: guestSession
      ? isGuestSetupCompletedSync() || guestSetupDone === true
      : (dbProfile?.setup_completed ?? false),
    onSetupRoute: pathname === '/goal-setup' || pathname === '/setup',
  };
}
