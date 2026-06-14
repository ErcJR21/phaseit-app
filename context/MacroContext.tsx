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
import type { MacroStats } from '../components/dashboard/MacroTracker';
import { INITIAL_MACRO_STATS, MACRO_GOALS } from '../data/dailyMacros';
import { useUser } from './UserContext';
import type { MacroGoalTargets } from '../utils/macroCalculator';

export type MealData = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  foodName?: string;
  price?: number;
  imageUri?: string;
};

export type LoggedMeal = {
  id: string;
  foodName: string;
  price: number;
  calories: number;
  date: string;
  loggedAt: string;
  imageUri?: string;
};

type MacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type MacroHistoryEntry = {
  timestamp: string;
  date: string;
  macros: MacroTotals;
};

type DailyGoals = MacroGoalTargets;

export type MacroStatus = 'loading' | 'ready';

type MacroContextValue = {
  status: MacroStatus;
  isLoading: boolean;
  isReady: boolean;
  macros: MacroTotals;
  dailyGoals: DailyGoals;
  macroStats: MacroStats;
  history: MacroHistoryEntry[];
  meals: LoggedMeal[];
  addMeal: (mealData: MealData) => void;
  resetDailyMacros: () => Promise<void>;
  deleteHistoryEntry: (timestamp: string) => Promise<void>;
};

const STORAGE_KEY = '@phaseit/macros';
const HISTORY_KEY = '@phaseit/macro-history';
const MEALS_KEY = '@phaseit/meal-log';
const LAST_DATE_KEY = '@phaseit/last-macro-date';

export const DEFAULT_MEAL_PRICE = 65;

const ZERO_MACROS: MacroTotals = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
};

const MacroContext = createContext<MacroContextValue | null>(null);

/** Local calendar day as YYYY-MM-DD — used to detect day changes. */
export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** True when the stored day key differs from today's local date. */
export function isNewDay(lastDateKey: string | null, now = new Date()): boolean {
  if (!lastDateKey) return false;
  return lastDateKey !== getLocalDateKey(now);
}

function getInitialMacros(): MacroTotals {
  return {
    calories: INITIAL_MACRO_STATS.calories.current,
    protein: INITIAL_MACRO_STATS.protein.current,
    carbs: INITIAL_MACRO_STATS.carbs.current,
    fats: INITIAL_MACRO_STATS.fat.current,
  };
}

function parseMeals(raw: string | null): LoggedMeal[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (entry) =>
          entry &&
          typeof entry.id === 'string' &&
          typeof entry.foodName === 'string' &&
          typeof entry.price === 'number' &&
          typeof entry.date === 'string' &&
          typeof entry.loggedAt === 'string',
      )
      .map((entry) => ({
        ...entry,
        calories: typeof entry.calories === 'number' ? entry.calories : 0,
      }));
  } catch {
    return [];
  }
}

function createMealEntry(mealData: MealData): LoggedMeal {
  return {
    id: `meal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    foodName: mealData.foodName?.trim() || 'Logged meal',
    price: mealData.price ?? DEFAULT_MEAL_PRICE,
    calories: mealData.calories ?? 0,
    date: getLocalDateKey(),
    loggedAt: new Date().toISOString(),
    imageUri: mealData.imageUri,
  };
}

async function saveMeals(meals: LoggedMeal[]): Promise<LoggedMeal[]> {
  await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(meals));
  return meals;
}

function sortMealsDesc(entries: LoggedMeal[]): LoggedMeal[] {
  return [...entries].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
}

function parseStoredMacros(raw: string | null): MacroTotals | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<MacroTotals>;

    if (
      typeof parsed.calories === 'number' &&
      typeof parsed.protein === 'number' &&
      typeof parsed.carbs === 'number' &&
      typeof parsed.fats === 'number'
    ) {
      return {
        calories: parsed.calories,
        protein: parsed.protein,
        carbs: parsed.carbs,
        fats: parsed.fats,
      };
    }
  } catch {
    // Ignore invalid stored data and fall back to defaults.
  }

  return null;
}

function parseHistory(raw: string | null): MacroHistoryEntry[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (entry): entry is MacroHistoryEntry =>
        entry &&
        typeof entry.timestamp === 'string' &&
        typeof entry.date === 'string' &&
        entry.macros &&
        typeof entry.macros.calories === 'number' &&
        typeof entry.macros.protein === 'number' &&
        typeof entry.macros.carbs === 'number' &&
        typeof entry.macros.fats === 'number',
    );
  } catch {
    return [];
  }
}

function buildMacroStats(macros: MacroTotals, dailyGoals: DailyGoals): MacroStats {
  return {
    calories: { current: macros.calories, goal: dailyGoals.calories },
    protein: { current: macros.protein, goal: dailyGoals.protein },
    carbs: { current: macros.carbs, goal: dailyGoals.carbs },
    fat: { current: macros.fats, goal: dailyGoals.fat },
  };
}

function createHistoryEntry(macros: MacroTotals, dateKey: string): MacroHistoryEntry {
  return {
    timestamp: new Date().toISOString(),
    date: dateKey,
    macros: { ...macros },
  };
}

async function saveMacroHistory(history: MacroHistoryEntry[]): Promise<MacroHistoryEntry[]> {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return history;
}

function sortHistoryDesc(entries: MacroHistoryEntry[]): MacroHistoryEntry[] {
  return [...entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

async function appendMacroHistory(
  macros: MacroTotals,
  dateKey: string,
): Promise<MacroHistoryEntry[]> {
  const rawHistory = await AsyncStorage.getItem(HISTORY_KEY);
  const history = parseHistory(rawHistory);
  history.push(createHistoryEntry(macros, dateKey));
  return saveMacroHistory(history);
}

export type DayMacroSnapshot = {
  date: string;
  label: string;
  protein: number;
  carbs: number;
  fats: number;
};

export async function loadMacroHistory(): Promise<MacroHistoryEntry[]> {
  const rawHistory = await AsyncStorage.getItem(HISTORY_KEY);
  return parseHistory(rawHistory);
}

function getLast7DateKeys(now = new Date()): string[] {
  const keys: string[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    keys.push(getLocalDateKey(date));
  }

  return keys;
}

function formatDayLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getLatestEntryForDate(
  history: MacroHistoryEntry[],
  dateKey: string,
): MacroHistoryEntry | null {
  const entries = history.filter((entry) => entry.date === dateKey);

  if (entries.length === 0) return null;

  return entries.reduce((latest, entry) =>
    entry.timestamp.localeCompare(latest.timestamp) > 0 ? entry : latest,
  );
}

export function buildLast7DaySnapshots(
  history: MacroHistoryEntry[],
  todayMacros?: MacroTotals,
): DayMacroSnapshot[] {
  const today = getLocalDateKey();

  return getLast7DateKeys().map((dateKey) => {
    if (dateKey === today && todayMacros) {
      return {
        date: dateKey,
        label: formatDayLabel(dateKey),
        protein: todayMacros.protein,
        carbs: todayMacros.carbs,
        fats: todayMacros.fats,
      };
    }

    const entry = getLatestEntryForDate(history, dateKey);

    return {
      date: dateKey,
      label: formatDayLabel(dateKey),
      protein: entry?.macros.protein ?? 0,
      carbs: entry?.macros.carbs ?? 0,
      fats: entry?.macros.fats ?? 0,
    };
  });
}

export function MacroProvider({ children }: { children: ReactNode }) {
  const { macroGoals, isReady: userReady } = useUser();
  const [status, setStatus] = useState<MacroStatus>('loading');
  const [macros, setMacros] = useState<MacroTotals | null>(null);
  const [history, setHistory] = useState<MacroHistoryEntry[]>([]);
  const [meals, setMeals] = useState<LoggedMeal[]>([]);

  const dailyGoals = userReady ? macroGoals : { ...MACRO_GOALS };

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const [storedMacros, lastDateKey, storedHistory, storedMeals] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(LAST_DATE_KEY),
          AsyncStorage.getItem(HISTORY_KEY),
          AsyncStorage.getItem(MEALS_KEY),
        ]);

        const parsed = parseStoredMacros(storedMacros);
        const today = getLocalDateKey();
        let nextMacros = parsed ?? getInitialMacros();
        let nextHistory = sortHistoryDesc(parseHistory(storedHistory));
        let nextMeals = sortMealsDesc(parseMeals(storedMeals));

        if (isNewDay(lastDateKey) && parsed) {
          nextHistory = sortHistoryDesc(
            await appendMacroHistory(parsed, lastDateKey!),
          );
          nextMacros = ZERO_MACROS;
          await AsyncStorage.setItem(LAST_DATE_KEY, today);
        } else if (!lastDateKey) {
          await AsyncStorage.setItem(LAST_DATE_KEY, today);
        }

        if (!isMounted) return;

        setMacros(nextMacros);
        setHistory(nextHistory);
        setMeals(nextMeals);
        setStatus('ready');
      } catch (error) {
        console.warn('[MacroContext] Failed to load macros:', error);

        if (isMounted) {
          setMacros(getInitialMacros());
          setHistory([]);
          setMeals([]);
          setStatus('ready');
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (status !== 'ready' || !macros) return;

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(macros)).catch((error) => {
      console.warn('[MacroContext] Failed to save macros:', error);
    });
  }, [macros, status]);

  useEffect(() => {
    if (status !== 'ready') return;

    saveMeals(meals).catch((error) => {
      console.warn('[MacroContext] Failed to save meals:', error);
    });
  }, [meals, status]);

  const addMeal = useCallback((mealData: MealData) => {
    setMacros((prev) => {
      const current = prev ?? ZERO_MACROS;

      return {
        calories: current.calories + mealData.calories,
        protein: current.protein + mealData.protein,
        carbs: current.carbs + mealData.carbs,
        fats: current.fats + mealData.fats,
      };
    });

    setMeals((prev) => [createMealEntry(mealData), ...prev]);
  }, []);

  const resetDailyMacros = useCallback(async () => {
    const current = macros ?? ZERO_MACROS;
    const today = getLocalDateKey();

    try {
      const lastDateKey = await AsyncStorage.getItem(LAST_DATE_KEY);
      const archiveDate = lastDateKey ?? today;

      const updatedHistory = sortHistoryDesc(
        await appendMacroHistory(current, archiveDate),
      );
      await AsyncStorage.setItem(LAST_DATE_KEY, today);
      setHistory(updatedHistory);
      setMacros(ZERO_MACROS);
      setMeals((prev) => prev.filter((meal) => meal.date !== today));
    } catch (error) {
      console.warn('[MacroContext] Failed to reset daily macros:', error);
    }
  }, [macros]);

  const deleteHistoryEntry = useCallback(async (timestamp: string) => {
    try {
      const nextHistory = sortHistoryDesc(history.filter((entry) => entry.timestamp !== timestamp));
      await saveMacroHistory(nextHistory);
      setHistory(nextHistory);
    } catch (error) {
      console.warn('[MacroContext] Failed to delete history entry:', error);
    }
  }, [history]);

  const resolvedMacros = macros ?? ZERO_MACROS;
  const isLoading = status === 'loading';
  const isReady = status === 'ready';

  const macroStats = useMemo(
    () => buildMacroStats(resolvedMacros, dailyGoals),
    [resolvedMacros, dailyGoals],
  );

  const value = useMemo(
    () => ({
      status,
      isLoading,
      isReady,
      macros: resolvedMacros,
      dailyGoals,
      macroStats,
      history,
      meals,
      addMeal,
      resetDailyMacros,
      deleteHistoryEntry,
    }),
    [
      status,
      isLoading,
      isReady,
      resolvedMacros,
      dailyGoals,
      macroStats,
      history,
      meals,
      addMeal,
      resetDailyMacros,
      deleteHistoryEntry,
    ],
  );

  return <MacroContext.Provider value={value}>{children}</MacroContext.Provider>;
}

export function useMacros(): MacroContextValue {
  const context = useContext(MacroContext);

  if (!context) {
    throw new Error('useMacros must be used within a MacroProvider');
  }

  return context;
}
