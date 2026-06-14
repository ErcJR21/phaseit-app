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
import {
  calculateGoalsFromProfile,
  type ActivityLevel,
  type Gender,
  type MacroGoalTargets,
  type UserProfile,
} from '../utils/macroCalculator';

const USER_PROFILE_KEY = '@phaseit/user-profile';
const USER_MACRO_GOALS_KEY = '@phaseit/user-macro-goals';

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

export function UserProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [macroGoals, setMacroGoals] = useState<MacroGoalTargets>(DEFAULT_MACRO_GOALS);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const [storedProfile, storedGoals] = await Promise.all([
          AsyncStorage.getItem(USER_PROFILE_KEY),
          AsyncStorage.getItem(USER_MACRO_GOALS_KEY),
        ]);

        if (!isMounted) return;

        const nextProfile = parseProfile(storedProfile) ?? DEFAULT_USER_PROFILE;
        const nextGoals = parseMacroGoals(storedGoals) ?? calculateGoalsFromProfile(nextProfile).goals;

        setProfile(nextProfile);
        setMacroGoals(nextGoals);
      } catch (error) {
        console.warn('[UserContext] Failed to load user goals:', error);
      } finally {
        if (isMounted) setIsReady(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const saveGoals = useCallback(async (nextProfile: UserProfile, nextGoals: MacroGoalTargets) => {
    setProfile(nextProfile);
    setMacroGoals(nextGoals);

    await Promise.all([
      AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(nextProfile)),
      AsyncStorage.setItem(USER_MACRO_GOALS_KEY, JSON.stringify(nextGoals)),
    ]);
  }, []);

  const { bmr, tdee } = useMemo(() => calculateGoalsFromProfile(profile), [profile]);

  const value = useMemo(
    () => ({
      isReady,
      profile,
      macroGoals,
      bmr,
      tdee,
      saveGoals,
    }),
    [isReady, profile, macroGoals, bmr, tdee, saveGoals],
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
