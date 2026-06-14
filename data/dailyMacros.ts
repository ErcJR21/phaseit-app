import type { MacroStats } from '../components/dashboard/MacroTracker';
import type { SummaryStats } from '../components/dashboard/SummaryCards';
import type { MealNutrition } from '../services/nutritionVisionService';

export const MACRO_GOALS = {
  calories: 2000,
  protein: 75,
  carbs: 250,
  fat: 65,
} as const;

export const INITIAL_MACRO_STATS: MacroStats = {
  calories: { current: 820, goal: MACRO_GOALS.calories },
  protein: { current: 42, goal: MACRO_GOALS.protein },
  carbs: { current: 98, goal: MACRO_GOALS.carbs },
  fat: { current: 28, goal: MACRO_GOALS.fat },
};

export const INITIAL_SUMMARY_STATS: SummaryStats = {
  mealsToday: 2,
  streakDays: 5,
  expTotal: 340,
};

export const MEAL_LOG_EXP = 15;

export function applyMealToMacroStats(stats: MacroStats, meal: MealNutrition): MacroStats {
  return {
    calories: {
      current: stats.calories.current + meal.calories,
      goal: stats.calories.goal,
    },
    protein: {
      current: stats.protein.current + meal.protein,
      goal: stats.protein.goal,
    },
    carbs: {
      current: stats.carbs.current + meal.carbs,
      goal: stats.carbs.goal,
    },
    fat: {
      current: stats.fat.current + meal.fats,
      goal: stats.fat.goal,
    },
  };
}

export function applyMealToSummaryStats(stats: SummaryStats): SummaryStats {
  return {
    mealsToday: stats.mealsToday + 1,
    streakDays: stats.streakDays,
    expTotal: stats.expTotal + MEAL_LOG_EXP,
  };
}
