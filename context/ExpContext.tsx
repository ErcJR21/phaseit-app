import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getLevelProgress, type LevelProgress } from '../data/exp';

type ExpContextValue = {
  exp: number;
  levelProgress: LevelProgress;
  addExperience: (points: number) => void;
};

const ExpContext = createContext<ExpContextValue | null>(null);

export function ExpProvider({ children }: { children: ReactNode }) {
  const [exp, setExp] = useState(0);

  const addExperience = useCallback((points: number) => {
    if (points <= 0) return;

    setExp((current) => current + points);
  }, []);

  const levelProgress = useMemo(() => getLevelProgress(exp), [exp]);

  const value = useMemo(
    () => ({
      exp,
      levelProgress,
      addExperience,
    }),
    [exp, levelProgress, addExperience],
  );

  return <ExpContext.Provider value={value}>{children}</ExpContext.Provider>;
}

export function useExperience(): ExpContextValue {
  const context = useContext(ExpContext);

  if (!context) {
    throw new Error('useExperience must be used within an ExpProvider');
  }

  return context;
}
