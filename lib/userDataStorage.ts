import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/** Persisted keys for user-specific app data (not Supabase auth tokens). */
export const USER_DATA_STORAGE_KEYS = [
  '@phaseit/user-profile',
  '@phaseit/user-macro-goals',
  '@phaseit/guest-setup-completed',
  '@phaseit/macros',
  '@phaseit/macro-history',
  '@phaseit/meal-log',
  '@phaseit/last-macro-date',
  '@phaseit/daily-allowance',
  '@phaseit/emergency-fund',
  '@phaseit/budget-streak',
  '@phaseit/budget-last-date',
  '@phaseit/budget-hero-rewarded',
] as const;

function clearWebSessionStorage(): void {
  if (Platform.OS !== 'web' || typeof sessionStorage === 'undefined') return;

  const keysToRemove: string[] = [];

  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index);
    if (key?.startsWith('@phaseit/')) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => sessionStorage.removeItem(key));
}

/** Removes all cached user data from AsyncStorage and web sessionStorage. */
export async function clearPersistedUserData(): Promise<void> {
  await AsyncStorage.multiRemove([...USER_DATA_STORAGE_KEYS]);
  clearWebSessionStorage();
}
