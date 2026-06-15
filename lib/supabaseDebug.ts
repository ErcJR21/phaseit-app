import type { SupabaseTableName } from './supabaseTables';

export type SupabaseErrorLike = {
  code?: string;
  message: string;
  details?: string | null;
  hint?: string | null;
};

export function logSupabaseRequest(
  operation: string,
  details?: Record<string, unknown>,
): void {
  console.log(`[PhaseEat:Supabase] ${operation}`, details ?? '');
}

export function logSupabaseSuccess(
  operation: string,
  details?: Record<string, unknown>,
): void {
  console.log(`[PhaseEat:Supabase] ${operation} OK`, details ?? '');
}

export function logSupabaseError(
  operation: string,
  error: SupabaseErrorLike,
  table?: SupabaseTableName,
): void {
  console.error(`[PhaseEat:Supabase] ${operation} failed`, {
    table: table ? `public.${table}` : undefined,
    code: error.code,
    message: error.message,
    details: error.details ?? undefined,
    hint: error.hint ?? undefined,
  });

  if (
    error.code === 'PGRST205' ||
    error.message.includes("Could not find the table 'public.")
  ) {
    console.error(
      `[PhaseEat:Supabase] Missing table${table ? `: public.${table}` : ''}. ` +
        'Run supabase/schema.sql in the Supabase SQL Editor, then wait a few seconds for the schema cache to refresh.',
    );
  }
}
