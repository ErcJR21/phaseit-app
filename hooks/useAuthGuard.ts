import { useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { isGuestUser, useAuth } from '../context/AuthContext';

type AuthGuardOptions = {
  /** When false, blocked guest actions fail silently. Defaults to true. */
  prompt?: boolean;
  message?: string;
};

export function useAuthGuard() {
  const { user, isGuest } = useAuth();
  const guestSession = isGuest || isGuestUser(user);

  const canPerformAction = useCallback(
    (options?: AuthGuardOptions): boolean => {
      if (!guestSession) {
        return true;
      }

      if (options?.prompt !== false) {
        Alert.alert(
          'Sign in required',
          options?.message ??
            'Create an account or log in to save changes and sync across devices.',
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'Sign in', onPress: () => router.replace('/onboarding') },
          ],
        );
      }

      return false;
    },
    [guestSession],
  );

  return { canPerformAction, isGuest: guestSession };
}
