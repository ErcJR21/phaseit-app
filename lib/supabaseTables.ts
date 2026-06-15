/** Canonical PostgREST table names — must match Supabase `public` schema exactly. */
export const SUPABASE_TABLES = {
  profiles: 'profiles',
  macroGoals: 'macro_goals',
  jar: 'jar',
  budgets: 'budgets',
  mealsLog: 'meals_log',
  campusStalls: 'campus_stalls',
  recipes: 'recipes',
  mealPlans: 'meal_plans',
} as const;

export type SupabaseTableName = (typeof SUPABASE_TABLES)[keyof typeof SUPABASE_TABLES];
