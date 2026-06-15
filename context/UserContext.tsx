import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { MACRO_GOALS } from '../data/dailyMacros';
import { isGuestUser, useAuth } from './AuthContext';
import {
  fetchRemoteDailyAllowance,
  fetchRemoteMacroGoals,
} from '../services/macroGoalsService';
import { DAILY_ALLOWANCE_STORAGE_KEY } from '../services/goalSetupService';
import {
  calculateGoalsFromProfile,
  type ActivityLevel,
  type Gender,
  type MacroGoalTargets,
  type UserProfile,
} from '../utils/macroCalculator';

export const USER_PROFILE_KEY = '@phaseit/user-profile';
export const USER_MACRO_GOALS_KEY = '@phaseit/user-macro-goals';

export const DEFAULT_USER_PROFILE: UserProfile = {
  weightKg: 60,
  heightCm: 170,
  age: 20,
  gender: 'female',
  activityLevel: 'moderate',
};

export const DEFAULT_MACRO_GOALS: MacroGoalTargets = {
  calories: MACRO_GOALS.calories,
  protein: MACRO_GOALS.protein,
  carbs: MACRO_GOALS.carbs,
  fat: MACRO_GOALS.fat,
};

type UserContextValue = {
  isReady: boolean;
  profile: UserProfile;
  macroGoals: MacroGoalTargets;
  bmr: number;
  tdee: number;
  saveGoals: (profile: UserProfile, goals: MacroGoalTargets) => Promise<void>;
  reloadFromStorage: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | null>(null);

function parseNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseProfile(raw: string | null): UserProfile | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    const gender: Gender = parsed.gender === 'male' ? 'male' : 'female';
    const activityLevel = parsed.activityLevel ?? DEFAULT_USER_PROFILE.activityLevel;
    const validActivity: ActivityLevel =
      activityLevel === 'sedentary' ||
      activityLevel === 'light' ||
      activityLevel === 'moderate' ||
      activityLevel === 'active' ||
      activityLevel === 'very_active'
        ? activityLevel
        : DEFAULT_USER_PROFILE.activityLevel;

    return {
      weightKg: parseNumber(parsed.weightKg, DEFAULT_USER_PROFILE.weightKg),
      heightCm: parseNumber(parsed.heightCm, DEFAULT_USER_PROFILE.heightCm),
      age: parseNumber(parsed.age, DEFAULT_USER_PROFILE.age),
      gender,
      activityLevel: validActivity,
    };
  } catch {
    return null;
  }
}

function parseMacroGoals(raw: string | null): MacroGoalTargets | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<MacroGoalTargets>;

    return {
      calories: parseNumber(parsed.calories, DEFAULT_MACRO_GOALS.calories),
      protein: parseNumber(parsed.protein, DEFAULT_MACRO_GOALS.protein),
      carbs: parseNumber(parsed.carbs, DEFAULT_MACRO_GOALS.carbs),
      fat: parseNumber(parsed.fat, DEFAULT_MACRO_GOALS.fat),
    };
  } catch {
    return null;
  }
}

async function readStoredGoals(): Promise<{ profile: UserProfile; goals: MacroGoalTargets }> {
  const [storedProfile, storedGoals] = await Promise.all([
    AsyncStorage.getItem(USER_PROFILE_KEY),
    AsyncStorage.getItem(USER_MACRO_GOALS_KEY),
  ]);

  const profile = parseProfile(storedProfile) ?? DEFAULT_USER_PROFILE;
  const goals = parseMacroGoals(storedGoals) ?? calculateGoalsFromProfile(profile).goals;

  return { profile, goals };
}

export function UserProvider({ children }: { children: ReactNode }) {
  const { user, isGuest, dbProfile, isProfileLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [macroGoals, setMacroGoals] = useState<MacroGoalTargets>(DEFAULT_MACRO_GOALS);

  const persistGoals = useCallback(async (nextProfile: UserProfile, nextGoals: MacroGoalTargets) => {
    await Promise.all([
      AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(nextProfile)),
      AsyncStorage.setItem(USER_MACRO_GOALS_KEY, JSON.stringify(nextGoals)),
    ]);
  }, []);

  const reloadFromStorage = useCallback(async () => {
    const guestSession = isGuest || isGuestUser(user);
    const isRegistered = Boolean(user) && !guestSession;

    if (isRegistered && dbProfile?.setup_completed && !isProfileLoading) {
      const remote = await fetchRemoteMacroGoals(user!.id);

      if (remote) {
        await persistGoals(remote.profile, remote.goals);

        const remoteAllowance = await fetchRemoteDailyAllowance(user!.id);
        if (remoteAllowance) {
          await AsyncStorage.setItem(DAILY_ALLOWANCE_STORAGE_KEY, String(remoteAllowance));
        }

        setProfile(remote.profile);
        setMacroGoals(remote.goals);
        return;
      }
    }

    const { profile: nextProfile, goals: nextGoals } = await readStoredGoals();
    setProfile(nextProfile);
    setMacroGoals(nextGoals);
  }, [user, isGuest, dbProfile?.setup_completed, isProfileLoading, persistGoals]);

  useEffect(() => {
    if (isProfileLoading && user && !isGuest && !isGuestUser(user)) {
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        await reloadFromStorage();
      } catch (error) {
        console.warn('[UserContext] Failed to load user goals:', error);
      } finally {
        if (isMounted) setIsReady(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [reloadFromStorage, isProfileLoading, user?.id]);

  const saveGoals = useCallback(
    async (nextProfile: UserProfile, nextGoals: MacroGoalTargets) => {
      setProfile(nextProfile);
      setMacroGoals(nextGoals);
      await persistGoals(nextProfile, nextGoals);
    },
    [persistGoals],
  );

  const { bmr, tdee } = useMemo(() => calculateGoalsFromProfile(profile), [profile]);

  const value = useMemo(
    () => ({
      isReady,
      profile,
      macroGoals,
      bmr,
      tdee,
      saveGoals,
      reloadFromStorage,
    }),
    [isReady, profile, macroGoals, bmr, tdee, saveGoals, reloadFromStorage],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return context;
}
