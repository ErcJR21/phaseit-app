export type Gender = 'male' | 'female';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type UserProfile = {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
};

export type MacroGoalTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export const ACTIVITY_LEVEL_OPTIONS: {
  key: ActivityLevel;
  label: string;
  multiplier: number;
}[] = [
  { key: 'sedentary', label: 'Sedentary', multiplier: 1.2 },
  { key: 'light', label: 'Lightly active', multiplier: 1.375 },
  { key: 'moderate', label: 'Moderately active', multiplier: 1.55 },
  { key: 'active', label: 'Very active', multiplier: 1.725 },
  { key: 'very_active', label: 'Extra active', multiplier: 1.9 },
];

export function getActivityMultiplier(level: ActivityLevel): number {
  return ACTIVITY_LEVEL_OPTIONS.find((option) => option.key === level)?.multiplier ?? 1.2;
}

/** Mifflin-St Jeor equation (kcal/day). */
export function calculateBmr(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}

export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * getActivityMultiplier(activityLevel));
}

/** Suggested macro targets from daily calories (25% protein, 45% carbs, 30% fat). */
export function calculateMacroTargets(calories: number): MacroGoalTargets {
  return {
    calories: Math.round(calories),
    protein: Math.round((calories * 0.25) / 4),
    carbs: Math.round((calories * 0.45) / 4),
    fat: Math.round((calories * 0.3) / 9),
  };
}

export function calculateGoalsFromProfile(profile: UserProfile): {
  bmr: number;
  tdee: number;
  goals: MacroGoalTargets;
} {
  const bmr = calculateBmr(profile.weightKg, profile.heightCm, profile.age, profile.gender);
  const tdee = calculateTdee(bmr, profile.activityLevel);

  return {
    bmr,
    tdee,
    goals: calculateMacroTargets(tdee),
  };
}
