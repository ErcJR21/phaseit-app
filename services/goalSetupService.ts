import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Href } from 'expo-router';
import type { MacroGoalTargets, UserProfile } from '../utils/macroCalculator';
import {
  defaultGoalSetupSelections,
  profileFromGoalSetup,
  type GoalSetupSelections,
} from '../utils/goalSetupCalculator';
import { persistUserSetup } from './setupService';

export const GUEST_SETUP_COMPLETED_KEY = '@phaseit/guest-setup-completed';
export const DAILY_ALLOWANCE_STORAGE_KEY = '@phaseit/daily-allowance';

const DAILY_ALLOWANCE_KEY = DAILY_ALLOWANCE_STORAGE_KEY;

/** In-memory flag so the setup guard sees completion before AsyncStorage round-trips. */
let guestSetupCompletedMemory = false;

/** Prevents the setup guard from redirecting back to goal-setup right after completion. */
let setupGuardBypassUntil = 0;

export function isGuestSetupCompletedSync(): boolean {
  return guestSetupCompletedMemory;
}

export function bypassSetupGuard(durationMs = 5000): void {
  setupGuardBypassUntil = Date.now() + durationMs;
}

export function isSetupGuardBypassed(): boolean {
  return Date.now() < setupGuardBypassUntil;
}

export async function isGuestSetupCompleted(): Promise<boolean> {
  if (guestSetupCompletedMemory) return true;

  const value = await AsyncStorage.getItem(GUEST_SETUP_COMPLETED_KEY);
  const completed = value === 'true';
  if (completed) {
    guestSetupCompletedMemory = true;
  }
  return completed;
}

export async function markGuestSetupCompleted(): Promise<void> {
  guestSetupCompletedMemory = true;
  bypassSetupGuard();
  await AsyncStorage.setItem(GUEST_SETUP_COMPLETED_KEY, 'true');
}

/** Clears guest setup so goal-setup is shown on the next guest session. */
export async function resetGuestSetupForNewSession(): Promise<void> {
  guestSetupCompletedMemory = false;
  await AsyncStorage.removeItem(GUEST_SETUP_COMPLETED_KEY);
}

/** Home route — skips the in-app splash after goal setup. */
export const HOME_AFTER_SETUP_ROUTE: Href = {
  pathname: '/',
  params: { fromSetup: '1' },
};

async function persistLocalBudget(budget: number): Promise<void> {
  await AsyncStorage.setItem(DAILY_ALLOWANCE_KEY, String(budget));
}

export type CompleteGoalSetupInput = {
  userId: string;
  isGuest: boolean;
  selections: GoalSetupSelections;
  saveGoals: (profile: UserProfile, goals: MacroGoalTargets) => Promise<void>;
  refreshProfile?: () => Promise<void>;
};

export async function completeGoalSetup({
  userId,
  isGuest,
  selections,
  saveGoals,
  refreshProfile,
}: CompleteGoalSetupInput): Promise<void> {
  const profile = profileFromGoalSetup(selections);
  const goals: MacroGoalTargets = {
    calories: selections.calories,
    protein: selections.protein,
    carbs: selections.carbs,
    fat: selections.fat,
  };

  await saveGoals(profile, goals);
  await persistLocalBudget(selections.budget);

  if (isGuest) {
    await markGuestSetupCompleted();
    return;
  }

  await persistUserSetup({
    userId,
    profile,
    goals,
    dailyAllowance: selections.budget,
  });

  await refreshProfile?.();
  bypassSetupGuard();
}

export async function skipGoalSetup({
  userId,
  isGuest,
  saveGoals,
  refreshProfile,
}: Omit<CompleteGoalSetupInput, 'selections'>): Promise<void> {
  const defaults = defaultGoalSetupSelections();

  await completeGoalSetup({
    userId,
    isGuest,
    selections: defaults,
    saveGoals,
    refreshProfile,
  });
}
