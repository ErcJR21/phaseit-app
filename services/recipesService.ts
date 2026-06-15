import { supabase } from '../lib/supabase';

function logRecipesError(
  operation: string,
  error: { code?: string; message: string; details?: string },
) {
  if (
    error.code === 'PGRST205' ||
    error.message.includes("Could not find the table 'public.recipes'")
  ) {
    console.error(
      `[PhaseIt] ${operation}: public.recipes does not exist or is not exposed via the Data API. ` +
        'Run supabase/recipes.sql in the Supabase SQL Editor, then confirm the table appears under Table Editor.',
    );
    return;
  }

  console.error(`[PhaseIt] ${operation} error:`, error.message, error.details ?? '');
}

export type RecipeRow = {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  place: string | null;
  created_at: string;
};

export async function fetchRecipes(): Promise<RecipeRow[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, emoji, cost, place, created_at')
    .order('name', { ascending: true });

  if (error) {
    logRecipesError('fetchRecipes', error);
    throw error;
  }

  return (data ?? []) as RecipeRow[];
}
