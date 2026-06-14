import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { EXP_REWARDS } from '../data/exp';
import { useExperience } from './ExpContext';
import { getLocalDateKey, useMacros } from './MacroContext';

export const DEFAULT_DAILY_ALLOWANCE = 250;
export const DEFAULT_EMERGENCY_FUND = 200;
export const QUICK_SET_ALLOWANCES = [150, 200, 250, 300, 350];
export const BUDGET_HERO_STREAK = 3;

const ALLOWANCE_KEY = '@phaseit/daily-allowance';
const EMERGENCY_FUND_KEY = '@phaseit/emergency-fund';
const STREAK_KEY = '@phaseit/budget-streak';
const BUDGET_DATE_KEY = '@phaseit/budget-last-date';
const HERO_REWARD_KEY = '@phaseit/budget-hero-rewarded';

const BudgetContext = createContext(null);

function getLast7DateKeys(now = new Date()) {
  const keys = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    keys.push(getLocalDateKey(date));
  }

  return keys;
}

function getRemainingDaysInWeek(now = new Date()) {
  const dayOfWeek = now.getDay();
  return dayOfWeek === 0 ? 1 : 7 - dayOfWeek;
}

function sumMealsForDate(meals, dateKey) {
  return meals
    .filter((meal) => meal.date === dateKey)
    .reduce((sum, meal) => sum + meal.price, 0);
}

export function BudgetProvider({ children }) {
  const { meals, isReady: macrosReady } = useMacros();
  const { addExperience } = useExperience();

  const [dailyAllowance, setDailyAllowance] = useState(DEFAULT_DAILY_ALLOWANCE);
  const [emergencyFund, setEmergencyFund] = useState(DEFAULT_EMERGENCY_FUND);
  const [daysUnderBudget, setDaysUnderBudget] = useState(0);
  const [lastBudgetDateKey, setLastBudgetDateKey] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const heroRewardedRef = useRef(false);
  const streakRef = useRef(0);
  const rolloverProcessedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const [storedAllowance, storedEmergencyFund, storedStreak, storedDateKey, storedHeroRewarded] =
          await Promise.all([
            AsyncStorage.getItem(ALLOWANCE_KEY),
            AsyncStorage.getItem(EMERGENCY_FUND_KEY),
            AsyncStorage.getItem(STREAK_KEY),
            AsyncStorage.getItem(BUDGET_DATE_KEY),
            AsyncStorage.getItem(HERO_REWARD_KEY),
          ]);

        if (!isMounted) return;

        const parsedAllowance = Number(storedAllowance);
        const parsedEmergencyFund = Number(storedEmergencyFund);
        const parsedStreak = Number(storedStreak);

        if (Number.isFinite(parsedAllowance) && parsedAllowance > 0) {
          setDailyAllowance(parsedAllowance);
        }

        if (Number.isFinite(parsedEmergencyFund) && parsedEmergencyFund >= 0) {
          setEmergencyFund(parsedEmergencyFund);
        }

        if (Number.isFinite(parsedStreak) && parsedStreak >= 0) {
          setDaysUnderBudget(parsedStreak);
          streakRef.current = parsedStreak;
        }

        setLastBudgetDateKey(storedDateKey);

        try {
          heroRewardedRef.current = storedHeroRewarded
            ? JSON.parse(storedHeroRewarded) === true
            : false;
        } catch {
          heroRewardedRef.current = false;
        }
      } catch (error) {
        console.warn('[BudgetContext] Failed to load budget state:', error);
      } finally {
        if (isMounted) setIsReady(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const evaluateDayRollover = useCallback(async () => {
    const todayKey = getLocalDateKey();

    if (!lastBudgetDateKey) {
      setLastBudgetDateKey(todayKey);
      await AsyncStorage.setItem(BUDGET_DATE_KEY, todayKey);
      rolloverProcessedRef.current = true;
      return;
    }

    if (lastBudgetDateKey === todayKey) {
      rolloverProcessedRef.current = true;
      return;
    }

    const previousDaySpent = sumMealsForDate(meals, lastBudgetDateKey);
    const underBudget = previousDaySpent <= dailyAllowance;

    let nextStreak = underBudget ? streakRef.current + 1 : 0;
    let nextHeroRewarded = heroRewardedRef.current;

    if (nextStreak >= BUDGET_HERO_STREAK && !heroRewardedRef.current) {
      addExperience(EXP_REWARDS.budgetHero);
      nextHeroRewarded = true;
    }

    if (nextStreak < BUDGET_HERO_STREAK) {
      nextHeroRewarded = false;
    }

    heroRewardedRef.current = nextHeroRewarded;
    streakRef.current = nextStreak;
    setDaysUnderBudget(nextStreak);
    setLastBudgetDateKey(todayKey);
    rolloverProcessedRef.current = true;

    await Promise.all([
      AsyncStorage.setItem(STREAK_KEY, String(nextStreak)),
      AsyncStorage.setItem(BUDGET_DATE_KEY, todayKey),
      AsyncStorage.setItem(HERO_REWARD_KEY, JSON.stringify(nextHeroRewarded)),
    ]);
  }, [lastBudgetDateKey, meals, dailyAllowance, addExperience]);

  useEffect(() => {
    if (!isReady || !macrosReady || rolloverProcessedRef.current) return;
    void evaluateDayRollover();
  }, [isReady, macrosReady, evaluateDayRollover]);

  useEffect(() => {
    if (!isReady) return;

    AsyncStorage.setItem(ALLOWANCE_KEY, String(dailyAllowance)).catch((error) => {
      console.warn('[BudgetContext] Failed to save allowance:', error);
    });
  }, [dailyAllowance, isReady]);

  useEffect(() => {
    if (!isReady) return;

    AsyncStorage.setItem(EMERGENCY_FUND_KEY, String(emergencyFund)).catch((error) => {
      console.warn('[BudgetContext] Failed to save emergency fund:', error);
    });
  }, [emergencyFund, isReady]);

  const todayKey = getLocalDateKey();
  const weekDateKeys = useMemo(() => getLast7DateKeys(), [todayKey]);
  const remainingDaysInWeek = useMemo(() => getRemainingDaysInWeek(), [todayKey]);

  const todayMeals = useMemo(
    () =>
      meals
        .filter((meal) => meal.date === todayKey)
        .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt)),
    [meals, todayKey],
  );

  const weeklyMeals = useMemo(
    () =>
      meals
        .filter((meal) => weekDateKeys.includes(meal.date))
        .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt)),
    [meals, weekDateKeys],
  );

  const spent = useMemo(
    () => todayMeals.reduce((sum, meal) => sum + meal.price, 0),
    [todayMeals],
  );

  const weeklySpent = useMemo(
    () => weeklyMeals.reduce((sum, meal) => sum + meal.price, 0),
    [weeklyMeals],
  );

  const weeklyAllowance = dailyAllowance * 7;

  const remaining = Math.max(dailyAllowance - spent, 0);
  const weeklyRemaining = Math.max(weeklyAllowance - weeklySpent, 0);

  const availableBalance = dailyAllowance - spent - emergencyFund;
  const weeklyAvailableBalance = weeklyAllowance - weeklySpent - emergencyFund;

  const safeDailySpend = useMemo(() => {
    if (remainingDaysInWeek <= 0) return 0;
    return Math.max(0, Math.round(weeklyRemaining / remainingDaysInWeek));
  }, [weeklyRemaining, remainingDaysInWeek]);

  const isExceeded = spent > dailyAllowance;
  const isWeeklyExceeded = weeklySpent > weeklyAllowance;
  const isOnTrack = !isExceeded;
  const isBudgetHero = daysUnderBudget >= BUDGET_HERO_STREAK;

  const percentRemaining = useMemo(() => {
    if (dailyAllowance <= 0) return 0;
    return Math.min(Math.max(remaining / dailyAllowance, 0), 1) * 100;
  }, [remaining, dailyAllowance]);

  const weeklyPercentRemaining = useMemo(() => {
    if (weeklyAllowance <= 0) return 0;
    return Math.min(Math.max(weeklyRemaining / weeklyAllowance, 0), 1) * 100;
  }, [weeklyRemaining, weeklyAllowance]);

  const availablePercent = useMemo(() => {
    if (dailyAllowance <= 0) return 0;
    return Math.min(Math.max(availableBalance / dailyAllowance, 0), 1) * 100;
  }, [availableBalance, dailyAllowance]);

  const setAllowance = useCallback((amount) => {
    const parsed = Number(amount);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return false;
    }

    setDailyAllowance(parsed);
    return true;
  }, []);

  const value = useMemo(
    () => ({
      dailyAllowance,
      weeklyAllowance,
      emergencyFund,
      spent,
      weeklySpent,
      remaining,
      weeklyRemaining,
      availableBalance,
      weeklyAvailableBalance,
      safeDailySpend,
      remainingDaysInWeek,
      daysUnderBudget,
      isBudgetHero,
      isExceeded,
      isWeeklyExceeded,
      isOnTrack,
      percentRemaining,
      weeklyPercentRemaining,
      availablePercent,
      todayMeals,
      weeklyMeals,
      quickSetOptions: QUICK_SET_ALLOWANCES,
      setAllowance,
      isReady,
    }),
    [
      dailyAllowance,
      weeklyAllowance,
      emergencyFund,
      spent,
      weeklySpent,
      remaining,
      weeklyRemaining,
      availableBalance,
      weeklyAvailableBalance,
      safeDailySpend,
      remainingDaysInWeek,
      daysUnderBudget,
      isBudgetHero,
      isExceeded,
      isWeeklyExceeded,
      isOnTrack,
      percentRemaining,
      weeklyPercentRemaining,
      availablePercent,
      todayMeals,
      weeklyMeals,
      setAllowance,
      isReady,
    ],
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const context = useContext(BudgetContext);

  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }

  return context;
}
