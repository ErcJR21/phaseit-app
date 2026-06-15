import { supabase } from '../lib/supabase';
import type { RecipeRow } from './recipesService';

function logMealPlansError(
  operation: string,
  error: { code?: string; message: string; details?: string },
) {
  if (
    error.code === 'PGRST205' ||
    error.message.includes("Could not find the table 'public.meal_plans'")
  ) {
    console.error(
      `[PhaseEat] ${operation}: public.meal_plans does not exist or is not exposed via the Data API. ` +
        'Run supabase/meal_plans.sql in the Supabase SQL Editor, then confirm the table appears under Table Editor.',
    );
    return;
  }

  console.error(`[PhaseEat] ${operation} error:`, error.message, error.details ?? '');
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type MealPlanRow = {
  id: string;
  user_id: string;
  day_of_week: DayOfWeek;
  meal_type: MealType;
  recipe_id: string;
  recipe: RecipeRow;
  created_at: string;
  updated_at: string;
};

export type AddMealInput = {
  userId: string;
  dayOfWeek: DayOfWeek;
  mealType: MealType;
  recipeId: string;
};

const MEAL_PLAN_SELECT = `
  id,
  user_id,
  day_of_week,
  meal_type,
  recipe_id,
  created_at,
  updated_at,
  recipe:recipes (
    id,
    name,
    emoji,
    cost,
    place,
    created_at
  )
`;

export async function fetchMealPlans(userId: string): Promise<MealPlanRow[]> {
  const { data, error } = await supabase
    .from('meal_plans')
    .select(MEAL_PLAN_SELECT)
    .eq('user_id', userId)
    .order('day_of_week', { ascending: true })
    .order('meal_type', { ascending: true });

  if (error) {
    logMealPlansError('fetchMealPlans', error);
    throw error;
  }

  return (data ?? []) as MealPlanRow[];
}

export async function addMeal(input: AddMealInput): Promise<MealPlanRow> {
  const payload = {
    user_id: input.userId,
    day_of_week: input.dayOfWeek,
    meal_type: input.mealType,
    recipe_id: input.recipeId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('meal_plans')
    .upsert(payload, { onConflict: 'user_id,day_of_week,meal_type' })
    .select(MEAL_PLAN_SELECT)
    .single();

  if (error) {
    logMealPlansError('addMeal', error);
    throw error;
  }

  return data as MealPlanRow;
}

export async function deleteMealPlan(
  userId: string,
  dayOfWeek: DayOfWeek,
  mealType: MealType,
): Promise<void> {
  const { error } = await supabase
    .from('meal_plans')
    .delete()
    .eq('user_id', userId)
    .eq('day_of_week', dayOfWeek)
    .eq('meal_type', mealType);

  if (error) {
    logMealPlansError('deleteMealPlan', error);
    throw error;
  }
}
