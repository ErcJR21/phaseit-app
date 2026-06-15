import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { logSupabaseError, logSupabaseRequest, logSupabaseSuccess } from '../lib/supabaseDebug';
import { supabase } from '../lib/supabase';
import { SUPABASE_TABLES } from '../lib/supabaseTables';

export type DbProfile = {
  id: string;
  setup_completed: boolean;
};

type ProfileFetchResult = {
  isGuest: boolean;
  profile: DbProfile | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isGuest: boolean;
  dbProfile: DbProfile | null;
  isProfileLoading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function isGuestUser(user: User | null | undefined): boolean {
  return user?.is_anonymous === true;
}

async function fetchUserProfile(userId: string): Promise<ProfileFetchResult> {
  logSupabaseRequest('fetchUserProfile', { table: SUPABASE_TABLES.profiles, userId });

  const { data, error } = await supabase
    .from(SUPABASE_TABLES.profiles)
    .select('id, setup_completed')
    .eq('id', userId)
    .single();

  if (error?.code === 'PGRST116') {
    console.log('[PhaseEat:AuthContext] fetchUserProfile: no profile row — treating as guest', {
      userId,
    });
    return { isGuest: true, profile: null };
  }

  if (error) {
    logSupabaseError('fetchUserProfile', error, SUPABASE_TABLES.profiles);
    throw error;
  }

  const profile: DbProfile = {
    id: data.id,
    setup_completed: data.setup_completed ?? false,
  };

  logSupabaseSuccess('fetchUserProfile', profile);
  return { isGuest: false, profile };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [dbProfile, setDbProfile] = useState<DbProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const loadProfile = useCallback(async (user: User | null) => {
    if (!user) {
      setIsGuest(false);
      setDbProfile(null);
      setIsProfileLoading(false);
      return;
    }

    if (isGuestUser(user)) {
      console.log('[PhaseEat:AuthContext] Anonymous user detected — skipping profile requirement', {
        userId: user.id,
      });
      setIsGuest(true);
      setDbProfile(null);
      setIsProfileLoading(false);
      return;
    }

    setIsProfileLoading(true);

    try {
      const result = await fetchUserProfile(user.id);
      setIsGuest(result.isGuest);
      setDbProfile(result.profile);
      console.log('[PhaseEat:AuthContext] Profile loaded', {
        userId: user.id,
        isGuest: result.isGuest,
        setupCompleted: result.profile?.setup_completed ?? null,
      });
    } catch (error) {
      console.error('[PhaseEat:AuthContext] Failed to load profile:', error);
      setIsGuest(false);
      setDbProfile(null);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();
    await loadProfile(currentSession?.user ?? null);
  }, [loadProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log('[PhaseEat:AuthContext] Initial session', {
        hasSession: Boolean(initialSession),
        userId: initialSession?.user?.id,
        isAnonymous: initialSession?.user?.is_anonymous,
      });
      setSession(initialSession);
      setIsLoading(false);
      void loadProfile(initialSession?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log('[PhaseEat:AuthContext] Auth state changed', {
        event,
        hasSession: Boolean(nextSession),
        userId: nextSession?.user?.id,
        isAnonymous: nextSession?.user?.is_anonymous,
      });
      setSession(nextSession);
      setIsLoading(false);
      void loadProfile(nextSession?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      isGuest,
      dbProfile,
      isProfileLoading,
      refreshProfile,
    }),
    [session, isLoading, isGuest, dbProfile, isProfileLoading, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
