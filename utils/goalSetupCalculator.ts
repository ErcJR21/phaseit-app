import {
  calculateGoalsFromProfile,
  type ActivityLevel,
  type Gender,
  type MacroGoalTargets,
  type UserProfile,
} from './macroCalculator';

export type GoalSetupActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
export type GoalType = 'maintain' | 'lose' | 'gain';

export type GoalSetupSelections = {
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  activity: GoalSetupActivityLevel;
  goalType: GoalType;
  budget: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export const DEFAULT_GOAL_SETUP_BODY = {
  age: 20,
  gender: 'female' as Gender,
  weightKg: 60,
  heightCm: 170,
};

export const GOAL_SETUP_ACTIVITY_OPTIONS: {
  key: GoalSetupActivityLevel;
  label: string;
  sub: string;
  emoji: string;
}[] = [
  { key: 'sedentary', label: 'Mostly Sitting', sub: 'Little to no exercise', emoji: '💺' },
  { key: 'light', label: 'Light Mover', sub: '1–3 days / week', emoji: '🚶' },
  { key: 'moderate', label: 'Active Student', sub: '3–5 days / week', emoji: '🏃' },
  { key: 'active', label: 'Very Active', sub: '6–7 days / week', emoji: '💪' },
];

export const GOAL_TYPE_OPTIONS: {
  key: GoalType;
  label: string;
  sub: string;
  emoji: string;
  calAdj: number;
}[] = [
  { key: 'lose', label: 'Lose Weight', sub: 'Calorie deficit', emoji: '📉', calAdj: -300 },
  { key: 'maintain', label: 'Stay Healthy', sub: 'Balanced nutrition', emoji: '⚖️', calAdj: 0 },
  { key: 'gain', label: 'Build Muscle', sub: 'Calorie surplus', emoji: '💪', calAdj: 300 },
];

export const BUDGET_PRESETS = [
  { label: 'Tipid Mode', amount: 100, emoji: '🪙' },
  { label: 'Standard', amount: 200, emoji: '🍽️' },
  { label: 'Comfortable', amount: 300, emoji: '✨' },
  { label: 'Big Spender', amount: 500, emoji: '💸' },
] as const;

const MACRO_SPLITS: Record<GoalType, { protein: number; carbs: number; fat: number }> = {
  lose: { protein: 0.35, carbs: 0.4, fat: 0.25 },
  maintain: { protein: 0.25, carbs: 0.5, fat: 0.25 },
  gain: { protein: 0.3, carbs: 0.45, fat: 0.25 },
};

function mapActivityLevel(activity: GoalSetupActivityLevel): ActivityLevel {
  if (activity === 'active') return 'active';
  return activity;
}

export function parseBodyMetric(
  value: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches - feet * 12);

  if (inches === 12) {
    feet += 1;
    inches = 0;
  }

  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return Math.round((feet * 12 + inches) * 2.54);
}

export function buildGoalSetupProfile(
  body: Pick<UserProfile, 'weightKg' | 'heightCm' | 'age' | 'gender'>,
  activity: GoalSetupActivityLevel,
): UserProfile {
  return {
    ...body,
    activityLevel: mapActivityLevel(activity),
  };
}

export function calcMacrosFromCalories(
  calories: number,
  goalType: GoalType,
): Pick<MacroGoalTargets, 'protein' | 'carbs' | 'fat'> {
  const split = MACRO_SPLITS[goalType];
  return {
    protein: Math.round((calories * split.protein) / 4),
    carbs: Math.round((calories * split.carbs) / 4),
    fat: Math.round((calories * split.fat) / 9),
  };
}

export function calcRecommendedGoals(
  profile: UserProfile,
  goalType: GoalType,
): MacroGoalTargets {
  const { tdee } = calculateGoalsFromProfile(profile);
  const calAdj = GOAL_TYPE_OPTIONS.find((option) => option.key === goalType)?.calAdj ?? 0;
  const calories = Math.max(1200, tdee + calAdj);
  const macros = calcMacrosFromCalories(calories, goalType);

  return {
    calories,
    ...macros,
  };
}

export function calcMacroPercentages(protein: number, carbs: number, fat: number) {
  const macroKcal = protein * 4 + carbs * 4 + fat * 9;
  if (macroKcal <= 0) {
    return { macroKcal: 0, proteinPct: 0, carbsPct: 0, fatPct: 0 };
  }

  return {
    macroKcal,
    proteinPct: Math.round(((protein * 4) / macroKcal) * 100),
    carbsPct: Math.round(((carbs * 4) / macroKcal) * 100),
    fatPct: Math.round(((fat * 9) / macroKcal) * 100),
  };
}

export function profileFromGoalSetup(selections: GoalSetupSelections): UserProfile {
  return buildGoalSetupProfile(
    {
      weightKg: selections.weightKg,
      heightCm: selections.heightCm,
      age: selections.age,
      gender: selections.gender,
    },
    selections.activity,
  );
}

export function defaultGoalSetupSelections(): GoalSetupSelections {
  const activity: GoalSetupActivityLevel = 'light';
  const goalType: GoalType = 'maintain';
  const profile = buildGoalSetupProfile(DEFAULT_GOAL_SETUP_BODY, activity);
  const goals = calcRecommendedGoals(profile, goalType);

  return {
    ...DEFAULT_GOAL_SETUP_BODY,
    activity,
    goalType,
    budget: 300,
    ...goals,
  };
}
