export const EXP_REWARDS = {
  vote: 5,
  addFavorite: 10,
  budgetHero: 50,
} as const;

export type ExpLevel = {
  level: number;
  title: string;
  threshold: number;
};

export const EXP_LEVELS: ExpLevel[] = [
  { level: 1, title: 'Foodie Scout', threshold: 0 },
  { level: 2, title: 'Campus Explorer', threshold: 100 },
  { level: 3, title: 'Barkada Captain', threshold: 250 },
  { level: 4, title: 'Lutong Legend', threshold: 500 },
  { level: 5, title: 'Master Foodie', threshold: 1000 },
];

export type LevelProgress = {
  level: number;
  title: string;
  progress: number;
  expTotal: number;
  expInLevel: number;
  expToNext: number;
  isMaxLevel: boolean;
};

export function getLevelProgress(expTotal: number): LevelProgress {
  let currentLevel = EXP_LEVELS[0];
  let nextLevel: ExpLevel | undefined = EXP_LEVELS[1];

  for (let index = EXP_LEVELS.length - 1; index >= 0; index -= 1) {
    if (expTotal >= EXP_LEVELS[index].threshold) {
      currentLevel = EXP_LEVELS[index];
      nextLevel = EXP_LEVELS[index + 1];
      break;
    }
  }

  if (!nextLevel) {
    return {
      level: currentLevel.level,
      title: currentLevel.title,
      progress: 1,
      expTotal,
      expInLevel: expTotal - currentLevel.threshold,
      expToNext: 0,
      isMaxLevel: true,
    };
  }

  const expInLevel = expTotal - currentLevel.threshold;
  const expNeeded = nextLevel.threshold - currentLevel.threshold;

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    progress: Math.min(expInLevel / expNeeded, 1),
    expTotal,
    expInLevel,
    expToNext: expNeeded - expInLevel,
    isMaxLevel: false,
  };
}
