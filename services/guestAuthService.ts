import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { resetGuestSetupForNewSession } from './goalSetupService';

export type GuestSignInResult = {
  session: Session | null;
  error: Error | null;
};

export async function signInAsGuest(): Promise<GuestSignInResult> {
  console.log('[PhaseEat:GuestAuth] Starting anonymous sign-in…');

  await resetGuestSetupForNewSession();

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    console.error('[PhaseEat:GuestAuth] Anonymous sign-in failed:', error.message);
    return { session: null, error };
  }

  console.log('[PhaseEat:GuestAuth] Anonymous session created', {
    userId: data.session?.user?.id,
    isAnonymous: data.session?.user?.is_anonymous,
    expiresAt: data.session?.expires_at,
  });

  return { session: data.session, error: null };
}
