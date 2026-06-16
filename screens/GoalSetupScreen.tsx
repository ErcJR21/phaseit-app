import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Beef,
  Check,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Flame,
  Wallet,
  Wheat,
  Zap,
} from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { PhaseEatLogo } from '../components/PhaseEatLogo';
import { colors, shadows } from '../theme/colors';
import { layout, radii, spacing } from '../theme/spacing';
import { fontWeights } from '../theme/typography';
import {
  BUDGET_PRESETS,
  DEFAULT_GOAL_SETUP_BODY,
  GOAL_SETUP_ACTIVITY_OPTIONS,
  GOAL_TYPE_OPTIONS,
  buildGoalSetupProfile,
  calcMacroPercentages,
  calcMacrosFromCalories,
  calcRecommendedGoals,
  cmToFeetInches,
  feetInchesToCm,
  parseBodyMetric,
  type GoalSetupActivityLevel,
  type GoalSetupSelections,
  type GoalType,
} from '../utils/goalSetupCalculator';
import type { Gender } from '../utils/macroCalculator';

const TOTAL_STEPS = 5;
const BUDGET_MIN = 50;
const BUDGET_MAX = 800;
const BUDGET_STEP = 10;
const DEFAULT_FEET_INCHES = cmToFeetInches(DEFAULT_GOAL_SETUP_BODY.heightCm);

type GoalSetupScreenProps = {
  onComplete: (selections: GoalSetupSelections) => Promise<void>;
  onSkip: () => Promise<void>;
  isSubmitting?: boolean;
};

type HeightUnit = 'cm' | 'ft';

type ProfileFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  suffix?: string;
  keyboardType?: 'default' | 'numeric';
  flex?: number;
};

function ProfileField({
  label,
  value,
  onChangeText,
  suffix,
  keyboardType = 'numeric',
  flex = 1,
}: ProfileFieldProps) {
  return (
    <View style={[styles.profileField, flex ? { flex } : null]}>
      <Text style={styles.profileFieldLabel}>{label}</Text>
      <View style={styles.profileInputRow}>
        <TextInput
          style={styles.profileInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholderTextColor={colors.muted}
        />
        {suffix ? <Text style={styles.profileInputSuffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

function UnitToggle({
  value,
  onChange,
}: {
  value: HeightUnit;
  onChange: (unit: HeightUnit) => void;
}) {
  return (
    <View style={styles.unitToggle}>
      {(['cm', 'ft'] as HeightUnit[]).map((unit) => {
        const active = value === unit;
        return (
          <Pressable
            key={unit}
            style={[styles.unitTogglePill, active && styles.unitTogglePillActive]}
            onPress={() => onChange(unit)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.unitToggleLabel, active && styles.unitToggleLabelActive]}>
              {unit}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.stepDotsRow}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.stepDot,
            index === current ? styles.stepDotActive : styles.stepDotInactive,
            index <= current ? styles.stepDotFilled : null,
          ]}
        />
      ))}
    </View>
  );
}

type MacroSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  color: string;
  icon: typeof Flame;
  onChange: (value: number) => void;
};

function MacroSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  color,
  icon: Icon,
  onChange,
}: MacroSliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <View style={styles.macroSlider}>
      <View style={styles.macroSliderHeader}>
        <View style={styles.macroSliderLabelRow}>
          <View style={[styles.macroSliderIconWrap, { backgroundColor: `${color}18` }]}>
            <Icon size={14} color={color} strokeWidth={2.5} />
          </View>
          <Text style={styles.macroSliderLabel}>{label}</Text>
        </View>
        <View style={styles.macroSliderControls}>
          <Pressable
            style={styles.macroStepButton}
            onPress={() => onChange(Math.max(min, value - step))}
            accessibilityRole="button"
            accessibilityLabel={`Decrease ${label}`}
          >
            <Text style={styles.macroStepButtonText}>−</Text>
          </Pressable>
          <Text style={styles.macroValue}>
            {value}
            <Text style={styles.macroValueUnit}>{unit}</Text>
          </Text>
          <Pressable
            style={[styles.macroStepButton, { backgroundColor: color }]}
            onPress={() => onChange(Math.min(max, value + step))}
            accessibilityRole="button"
            accessibilityLabel={`Increase ${label}`}
          >
            <Text style={[styles.macroStepButtonText, styles.macroStepButtonTextLight]}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.macroTrack}>
        <View style={[styles.macroTrackFill, { width: `${pct}%`, backgroundColor: color }]} />
        <View
          style={[
            styles.macroTrackThumb,
            { left: `${pct}%`, borderColor: color },
          ]}
        />
      </View>

      <View style={styles.macroTrackBounds}>
        <Text style={styles.macroTrackBound}>{min}{unit}</Text>
        <Text style={styles.macroTrackBound}>{max}{unit}</Text>
      </View>
    </View>
  );
}

function BudgetSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const trackWidth = useRef(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    trackWidth.current = event.nativeEvent.layout.width;
  };

  const setFromRatio = (ratio: number) => {
    const clamped = Math.min(Math.max(ratio, 0), 1);
    const raw = BUDGET_MIN + clamped * (BUDGET_MAX - BUDGET_MIN);
    onChange(Math.round(raw / BUDGET_STEP) * BUDGET_STEP);
  };

  const pct = ((value - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;

  return (
    <View style={styles.budgetSliderWrap}>
      <Pressable
        style={styles.budgetTrack}
        onLayout={handleLayout}
        onPress={(event) => {
          if (trackWidth.current <= 0) return;
          setFromRatio(event.nativeEvent.locationX / trackWidth.current);
        }}
        accessibilityRole="adjustable"
        accessibilityLabel="Daily food budget"
        accessibilityValue={{ text: `₱${value}` }}
      >
        <View style={[styles.budgetTrackFill, { width: `${pct}%` }]} />
        <View style={[styles.budgetTrackThumb, { left: `${pct}%` }]} />
      </Pressable>
      <View style={styles.macroTrackBounds}>
        <Text style={styles.macroTrackBound}>₱{BUDGET_MIN}</Text>
        <Text style={styles.macroTrackBound}>₱{BUDGET_MAX}</Text>
      </View>
    </View>
  );
}

function MacroDonut({
  calories,
  proteinPct,
  carbsPct,
  fatPct,
}: {
  calories: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}) {
  const circumference = 175.9;

  return (
    <View style={styles.donutWrap}>
      <Svg width={72} height={72} viewBox="0 0 72 72">
        <Circle cx="36" cy="36" r="28" fill="none" stroke={colors.track} strokeWidth={10} />
        <Circle
          cx="36"
          cy="36"
          r="28"
          fill="none"
          stroke={colors.coral}
          strokeWidth={10}
          strokeDasharray={`${proteinPct * 1.759} ${circumference}`}
          strokeLinecap="round"
          rotation={-90}
          origin="36, 36"
        />
        <Circle
          cx="36"
          cy="36"
          r="28"
          fill="none"
          stroke={colors.gold}
          strokeWidth={10}
          strokeDasharray={`${carbsPct * 1.759} ${circumference}`}
          strokeLinecap="round"
          strokeDashoffset={-proteinPct * 1.759}
          rotation={-90}
          origin="36, 36"
        />
        <Circle
          cx="36"
          cy="36"
          r="28"
          fill="none"
          stroke={colors.green}
          strokeWidth={10}
          strokeDasharray={`${fatPct * 1.759} ${circumference}`}
          strokeLinecap="round"
          strokeDashoffset={-(proteinPct + carbsPct) * 1.759}
          rotation={-90}
          origin="36, 36"
        />
      </Svg>
      <View style={styles.donutCenter}>
        <Flame size={16} color={colors.coral} strokeWidth={2.2} />
        <Text style={styles.donutCalories}>{calories}</Text>
      </View>
    </View>
  );
}

export function GoalSetupScreen({ onComplete, onSkip, isSubmitting = false }: GoalSetupScreenProps) {
  const [step, setStep] = useState(0);
  const [age, setAge] = useState(String(DEFAULT_GOAL_SETUP_BODY.age));
  const [gender, setGender] = useState<Gender>(DEFAULT_GOAL_SETUP_BODY.gender);
  const [weightKg, setWeightKg] = useState(String(DEFAULT_GOAL_SETUP_BODY.weightKg));
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [heightCm, setHeightCm] = useState(String(DEFAULT_GOAL_SETUP_BODY.heightCm));
  const [heightFeet, setHeightFeet] = useState(String(DEFAULT_FEET_INCHES.feet));
  const [heightInches, setHeightInches] = useState(String(DEFAULT_FEET_INCHES.inches));
  const [activity, setActivity] = useState<GoalSetupActivityLevel>('light');
  const [goalType, setGoalType] = useState<GoalType>('maintain');
  const [budget, setBudget] = useState(300);

  const resolvedBody = useMemo(
    () => ({
      age: parseBodyMetric(age, DEFAULT_GOAL_SETUP_BODY.age, 13, 100),
      gender,
      weightKg: parseBodyMetric(weightKg, DEFAULT_GOAL_SETUP_BODY.weightKg, 30, 200),
      heightCm:
        heightUnit === 'cm'
          ? parseBodyMetric(heightCm, DEFAULT_GOAL_SETUP_BODY.heightCm, 100, 250)
          : feetInchesToCm(
              parseBodyMetric(heightFeet, DEFAULT_FEET_INCHES.feet, 3, 8),
              parseBodyMetric(heightInches, DEFAULT_FEET_INCHES.inches, 0, 11),
            ),
    }),
    [age, gender, weightKg, heightUnit, heightCm, heightFeet, heightInches],
  );

  const setupProfile = useMemo(
    () => buildGoalSetupProfile(resolvedBody, activity),
    [resolvedBody, activity],
  );

  const recommended = useMemo(
    () => calcRecommendedGoals(setupProfile, goalType),
    [setupProfile, goalType],
  );
  const [calories, setCalories] = useState(recommended.calories);
  const [protein, setProtein] = useState(recommended.protein);
  const [carbs, setCarbs] = useState(recommended.carbs);
  const [fat, setFat] = useState(recommended.fat);

  const applyRecommended = (nextActivity: GoalSetupActivityLevel, nextGoalType: GoalType) => {
    const profile = buildGoalSetupProfile(resolvedBody, nextActivity);
    const goals = calcRecommendedGoals(profile, nextGoalType);
    setCalories(goals.calories);
    setProtein(goals.protein);
    setCarbs(goals.carbs);
    setFat(goals.fat);
  };

  const handleActivityChange = (next: GoalSetupActivityLevel) => {
    setActivity(next);
    applyRecommended(next, goalType);
  };

  const handleGoalChange = (next: GoalType) => {
    setGoalType(next);
    applyRecommended(activity, next);
  };

  const { macroKcal, proteinPct, carbsPct, fatPct } = calcMacroPercentages(protein, carbs, fat);

  const activityOption = GOAL_SETUP_ACTIVITY_OPTIONS.find((option) => option.key === activity);
  const goalOption = GOAL_TYPE_OPTIONS.find((option) => option.key === goalType);

  const handleHeightUnitChange = (nextUnit: HeightUnit) => {
    if (nextUnit === heightUnit) return;

    if (nextUnit === 'ft') {
      const cm = parseBodyMetric(heightCm, DEFAULT_GOAL_SETUP_BODY.heightCm, 100, 250);
      const { feet, inches } = cmToFeetInches(cm);
      setHeightFeet(String(feet));
      setHeightInches(String(inches));
    } else {
      const cm = feetInchesToCm(
        parseBodyMetric(heightFeet, DEFAULT_FEET_INCHES.feet, 3, 8),
        parseBodyMetric(heightInches, DEFAULT_FEET_INCHES.inches, 0, 11),
      );
      setHeightCm(String(cm));
    }

    setHeightUnit(nextUnit);
  };

  const validateProfileStep = () => {
    const parsedAge = Number(age);
    const parsedWeight = Number(weightKg);

    if (!Number.isFinite(parsedAge) || parsedAge < 13 || parsedAge > 100) {
      Alert.alert('Check your age', 'Enter an age between 13 and 100.');
      return false;
    }

    if (!Number.isFinite(parsedWeight) || parsedWeight < 30 || parsedWeight > 200) {
      Alert.alert('Check your weight', 'Enter a weight between 30 and 200 kg.');
      return false;
    }

    if (heightUnit === 'cm') {
      const parsedHeight = Number(heightCm);
      if (!Number.isFinite(parsedHeight) || parsedHeight < 100 || parsedHeight > 250) {
        Alert.alert('Check your height', 'Enter a height between 100 and 250 cm.');
        return false;
      }
    } else {
      const parsedFeet = Number(heightFeet);
      const parsedInches = Number(heightInches);
      if (
        !Number.isFinite(parsedFeet) ||
        parsedFeet < 3 ||
        parsedFeet > 8 ||
        !Number.isFinite(parsedInches) ||
        parsedInches < 0 ||
        parsedInches > 11
      ) {
        Alert.alert('Check your height', 'Enter a valid height in feet and inches.');
        return false;
      }
    }

    return true;
  };

  const handleNext = async () => {
    if (step === 0 && !validateProfileStep()) {
      return;
    }

    if (step < TOTAL_STEPS - 1) {
      if (step === 0) {
        applyRecommended(activity, goalType);
      }
      setStep((current) => current + 1);
      return;
    }

    await onComplete({
      ...resolvedBody,
      activity,
      goalType,
      budget,
      calories,
      protein,
      carbs,
      fat,
    });
  };

  const handleBack = () => {
    if (step > 0) setStep((current) => current - 1);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />
      <View style={styles.blobMidRight} />

      <View style={styles.topBar}>
        <PhaseEatLogo variant="icon" size={28} />
        <Pressable
          onPress={() => void onSkip()}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Skip for now"
        >
          <Text style={styles.skipLabel}>Skip for now</Text>
        </Pressable>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressMeta}>
          <StepDots total={TOTAL_STEPS} current={step} />
          <Text style={styles.progressCount}>
            {step + 1} of {TOTAL_STEPS}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 ? (
          <View style={styles.stepBlock}>
            <View>
              <Text style={styles.stepEyebrowCoral}>Step 1 — About you</Text>
              <Text style={styles.stepTitle}>
                {"Tell us about\n"}
                <Text style={styles.stepTitleAccentCoral}>your body</Text>
              </Text>
              <Text style={styles.stepBody}>
                We use this to estimate your daily calorie needs with the Mifflin-St Jeor equation.
              </Text>
            </View>

            <View style={styles.profileCard}>
              <ProfileField label="Age" value={age} onChangeText={setAge} suffix="years" />

              <View style={styles.profileField}>
                <Text style={styles.profileFieldLabel}>Sex</Text>
                <View style={styles.sexRow}>
                  {(['female', 'male'] as Gender[]).map((option) => {
                    const active = gender === option;
                    return (
                      <Pressable
                        key={option}
                        style={[styles.sexPill, active && styles.sexPillActive]}
                        onPress={() => setGender(option)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <Text style={[styles.sexPillLabel, active && styles.sexPillLabelActive]}>
                          {option === 'female' ? 'Female' : 'Male'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <ProfileField
                label="Weight"
                value={weightKg}
                onChangeText={setWeightKg}
                suffix="kg"
              />

              <View style={styles.profileField}>
                <View style={styles.heightHeader}>
                  <Text style={styles.profileFieldLabel}>Height</Text>
                  <UnitToggle value={heightUnit} onChange={handleHeightUnitChange} />
                </View>
                {heightUnit === 'cm' ? (
                  <View style={styles.profileInputRow}>
                    <TextInput
                      style={styles.profileInput}
                      value={heightCm}
                      onChangeText={setHeightCm}
                      keyboardType="numeric"
                      placeholderTextColor={colors.muted}
                    />
                    <Text style={styles.profileInputSuffix}>cm</Text>
                  </View>
                ) : (
                  <View style={styles.heightFeetRow}>
                    <ProfileField
                      label="Feet"
                      value={heightFeet}
                      onChangeText={setHeightFeet}
                      suffix="ft"
                      flex={1}
                    />
                    <ProfileField
                      label="Inches"
                      value={heightInches}
                      onChangeText={setHeightInches}
                      suffix="in"
                      flex={1}
                    />
                  </View>
                )}
              </View>
            </View>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.stepBlock}>
            <View>
              <Text style={styles.stepEyebrowCoral}>Step 2 — Goals</Text>
              <Text style={styles.stepTitle}>
                {"Let's set up your\n"}
                <Text style={styles.stepTitleAccentCoral}>nutrition goals</Text>
              </Text>
              <Text style={styles.stepBody}>
                Help us personalise your daily calorie and macro targets. Takes less than 2 minutes —
                you can always update later.
              </Text>
            </View>

            <View>
              <Text style={styles.sectionLabel}>How active are you on most days?</Text>
              <View style={styles.optionList}>
                {GOAL_SETUP_ACTIVITY_OPTIONS.map((option) => {
                  const active = activity === option.key;
                  return (
                    <Pressable
                      key={option.key}
                      style={[styles.activityOption, active && styles.activityOptionActive]}
                      onPress={() => handleActivityChange(option.key)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={styles.optionEmoji}>{option.emoji}</Text>
                      <View style={styles.optionCopy}>
                        <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>
                          {option.label}
                        </Text>
                        <Text style={styles.optionSub}>{option.sub}</Text>
                      </View>
                      <View style={[styles.radio, active && styles.radioActive]}>
                        {active ? <Check size={12} color={colors.white} strokeWidth={3} /> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View>
              <Text style={styles.sectionLabel}>What&apos;s your main health goal?</Text>
              <View style={styles.goalGrid}>
                {GOAL_TYPE_OPTIONS.map((option) => {
                  const active = goalType === option.key;
                  return (
                    <Pressable
                      key={option.key}
                      style={[styles.goalCard, active && styles.goalCardActive]}
                      onPress={() => handleGoalChange(option.key)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={styles.goalEmoji}>{option.emoji}</Text>
                      <Text style={[styles.goalTitle, active && styles.goalTitleActive]}>
                        {option.label}
                      </Text>
                      <Text style={[styles.goalSub, active && styles.goalSubActive]}>{option.sub}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.previewPill}>
              <View>
                <Text style={styles.previewLabel}>Estimated daily calories</Text>
                <Text style={styles.previewValue}>
                  {recommended.calories}{' '}
                  <Text style={styles.previewUnit}>kcal</Text>
                </Text>
              </View>
              <Flame size={32} color={colors.coral} strokeWidth={2.2} />
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.stepBlock}>
            <View>
              <Text style={styles.stepEyebrowGreen}>Step 3 — Budget</Text>
              <Text style={styles.stepTitle}>
                How much do you{'\n'}
                <Text style={styles.stepTitleAccentGreen}>spend on food daily?</Text>
              </Text>
              <Text style={styles.stepBody}>
                We&apos;ll alert you when you&apos;re nearing your limit and help you find meals that
                fit your budget.
              </Text>
            </View>

            <View style={styles.budgetHero}>
              <Text style={styles.budgetHeroLabel}>Daily Food Budget</Text>
              <View style={styles.budgetHeroAmountRow}>
                <Text style={styles.budgetHeroCurrency}>₱</Text>
                <Text style={styles.budgetHeroAmount}>{budget}</Text>
              </View>
              <Text style={styles.budgetHeroHint}>≈ ₱{Math.round(budget / 3)} per meal × 3 meals</Text>
            </View>

            <BudgetSlider value={budget} onChange={setBudget} />

            <View>
              <Text style={styles.presetLabel}>Quick Presets</Text>
              <View style={styles.presetRow}>
                {BUDGET_PRESETS.map((preset) => {
                  const active = budget === preset.amount;
                  return (
                    <Pressable
                      key={preset.amount}
                      style={[styles.presetChip, active && styles.presetChipActive]}
                      onPress={() => setBudget(preset.amount)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                      <Text style={[styles.presetChipLabel, active && styles.presetChipLabelActive]}>
                        {preset.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.noteCardGold}>
              <Text style={styles.noteEmoji}>👨‍👩‍👧</Text>
              <Text style={styles.noteText}>
                If you link a parent account, they&apos;ll see your budget progress — not your specific
                meal logs.
              </Text>
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.stepBlock}>
            <View>
              <Text style={styles.stepEyebrowGold}>Step 4 — Macros</Text>
              <Text style={styles.stepTitle}>
                Fine-tune your{'\n'}
                <Text style={styles.stepTitleAccentGold}>daily targets</Text>
              </Text>
              <Text style={styles.stepBody}>
                We calculated these based on your profile. Adjust to fit your preference.
              </Text>
            </View>

            <View style={styles.macroSummaryCard}>
              <MacroDonut
                calories={calories}
                proteinPct={proteinPct}
                carbsPct={carbsPct}
                fatPct={fatPct}
              />
              <View style={styles.macroLegend}>
                {[
                  { label: 'Protein', pct: proteinPct, color: colors.coral, grams: protein },
                  { label: 'Carbs', pct: carbsPct, color: colors.gold, grams: carbs },
                  { label: 'Fat', pct: fatPct, color: colors.green, grams: fat },
                ].map((item) => (
                  <View key={item.label} style={styles.macroLegendRow}>
                    <View style={[styles.macroLegendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.macroLegendLabel}>{item.label}</Text>
                    <Text style={styles.macroLegendGrams}>{item.grams}g</Text>
                    <Text style={[styles.macroLegendPct, { color: item.color }]}>{item.pct}%</Text>
                  </View>
                ))}
                <View style={styles.macroLegendTotal}>
                  <Text style={styles.macroLegendTotalLabel}>Total</Text>
                  <Text style={styles.macroLegendTotalValue}>{macroKcal} kcal</Text>
                </View>
              </View>
            </View>

            <MacroSlider
              label="Calories"
              value={calories}
              min={1200}
              max={3500}
              step={50}
              unit=" kcal"
              color={colors.coral}
              icon={Flame}
              onChange={(value) => {
                setCalories(value);
                const macros = calcMacrosFromCalories(value, goalType);
                setProtein(macros.protein);
                setCarbs(macros.carbs);
                setFat(macros.fat);
              }}
            />

            <View style={styles.divider} />

            <MacroSlider
              label="Protein"
              value={protein}
              min={30}
              max={300}
              step={5}
              unit="g"
              color={colors.coral}
              icon={Beef}
              onChange={setProtein}
            />
            <MacroSlider
              label="Carbs"
              value={carbs}
              min={50}
              max={500}
              step={5}
              unit="g"
              color={colors.gold}
              icon={Wheat}
              onChange={setCarbs}
            />
            <MacroSlider
              label="Fat"
              value={fat}
              min={20}
              max={200}
              step={5}
              unit="g"
              color={colors.green}
              icon={Droplets}
              onChange={setFat}
            />

            <Pressable
              style={styles.resetButton}
              onPress={() => applyRecommended(activity, goalType)}
              accessibilityRole="button"
              accessibilityLabel="Reset to recommended values"
            >
              <Zap size={14} color={colors.gold} fill={colors.gold} strokeWidth={0} />
              <Text style={styles.resetButtonText}>Reset to recommended values</Text>
            </Pressable>
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.stepBlock}>
            <View>
              <Text style={styles.stepEyebrowGreen}>All set! 🎉</Text>
              <Text style={styles.stepTitle}>
                Here&apos;s your{'\n'}
                <Text style={styles.stepTitleAccentGreen}>daily plan</Text>
              </Text>
              <Text style={styles.stepBody}>You can always update these in Settings anytime.</Text>
            </View>

            <View style={styles.summaryBudgetCard}>
              <View style={styles.summaryBudgetHeader}>
                <Wallet size={16} color="rgba(255,255,255,0.6)" strokeWidth={2.2} />
                <Text style={styles.summaryBudgetLabel}>Daily Food Budget</Text>
              </View>
              <Text style={styles.summaryBudgetAmount}>₱{budget}</Text>
              <Text style={styles.summaryBudgetHint}>
                ≈ ₱{Math.round(budget / 3)} per meal across 3 meals
              </Text>
            </View>

            <View style={styles.summaryCalorieCard}>
              <View style={styles.summaryCalorieHeader}>
                <Flame size={16} color={colors.coral} strokeWidth={2.2} />
                <Text style={styles.summaryCalorieLabel}>Daily Calorie Goal</Text>
                <View style={styles.summaryGoalBadge}>
                  <Text style={styles.summaryGoalBadgeText}>
                    {goalOption?.emoji} {goalOption?.label}
                  </Text>
                </View>
              </View>
              <Text style={styles.summaryCalorieAmount}>
                {calories} <Text style={styles.summaryCalorieUnit}>kcal</Text>
              </Text>

              <View style={styles.summaryMacroGrid}>
                {[
                  { label: 'Protein', value: protein, unit: 'g', color: colors.coral, icon: Beef },
                  { label: 'Carbs', value: carbs, unit: 'g', color: colors.gold, icon: Wheat },
                  { label: 'Fat', value: fat, unit: 'g', color: colors.green, icon: Droplets },
                ].map((item) => (
                  <View
                    key={item.label}
                    style={[styles.summaryMacroTile, { backgroundColor: `${item.color}12` }]}
                  >
                    <item.icon size={16} color={item.color} strokeWidth={2.5} />
                    <Text style={styles.summaryMacroValue}>{item.value}</Text>
                    <Text style={styles.summaryMacroUnit}>
                      {item.unit} {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.noteCardGold}>
              <Text style={styles.noteEmoji}>{activityOption?.emoji}</Text>
              <View style={styles.noteCopy}>
                <Text style={styles.noteTitle}>{activityOption?.label}</Text>
                <Text style={styles.noteSub}>{activityOption?.sub}</Text>
              </View>
            </View>

            <View style={styles.noteCardGreen}>
              <Zap size={16} color={colors.green} fill={colors.green} strokeWidth={0} />
              <Text style={styles.noteText}>
                Log your first meal today and earn{' '}
                <Text style={styles.noteHighlight}>+15 EXP</Text>! Canteens near your campus show meals
                tagged to your calorie budget automatically.
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 ? (
          <Pressable
            style={styles.backButton}
            onPress={handleBack}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={20} color={colors.navy} strokeWidth={2.5} />
          </Pressable>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            step === TOTAL_STEPS - 1 ? styles.primaryButtonFinish : styles.primaryButtonContinue,
            pressed && styles.buttonPressed,
            isSubmitting && styles.buttonDisabled,
          ]}
          onPress={() => void handleNext()}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel={step === TOTAL_STEPS - 1 ? 'Start Eating Smart' : 'Continue'}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>
                {step === TOTAL_STEPS - 1 ? 'Start Eating Smart 🍚' : 'Continue'}
              </Text>
              {step < TOTAL_STEPS - 1 ? (
                <ChevronRight size={16} color={colors.white} strokeWidth={2.5} />
              ) : null}
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  blobTopRight: {
    position: 'absolute',
    top: -64,
    right: -64,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: colors.coralTint15,
    opacity: 0.7,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: 128,
    left: -48,
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: colors.greenTint15,
    opacity: 0.7,
  },
  blobMidRight: {
    position: 'absolute',
    top: '50%',
    right: 0,
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.goldTint15,
  },
  topBar: {
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipLabel: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: fontWeights.medium,
  },
  progressSection: {
    paddingHorizontal: layout.screenPaddingX,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  progressMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepDot: {
    height: 6,
    borderRadius: 3,
  },
  stepDotInactive: {
    width: 6,
    backgroundColor: colors.track,
  },
  stepDotActive: {
    width: 20,
  },
  stepDotFilled: {
    backgroundColor: colors.coral,
  },
  progressCount: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: fontWeights.medium,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.coral,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingX,
    paddingBottom: spacing.xxl,
  },
  stepBlock: {
    gap: spacing.xl,
  },
  stepEyebrowCoral: {
    fontSize: 12,
    color: colors.coral,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  stepEyebrowGreen: {
    fontSize: 12,
    color: colors.green,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  stepEyebrowGold: {
    fontSize: 12,
    color: colors.gold,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  stepTitle: {
    fontSize: 24,
    color: colors.navy,
    fontWeight: fontWeights.bold,
    lineHeight: 30,
    marginTop: 6,
  },
  stepTitleAccentCoral: {
    color: colors.coral,
  },
  stepTitleAccentGreen: {
    color: colors.green,
  },
  stepTitleAccentGold: {
    color: colors.gold,
  },
  stepBody: {
    fontSize: 13,
    color: colors.muted,
    marginTop: spacing.sm,
    lineHeight: 21,
  },
  profileCard: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.white,
    ...shadows.card,
  },
  profileField: {
    gap: spacing.sm,
  },
  profileFieldLabel: {
    fontSize: 13,
    color: colors.navy,
    fontWeight: fontWeights.semibold,
  },
  profileInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.track,
  },
  profileInput: {
    flex: 1,
    fontSize: 16,
    color: colors.navy,
    fontWeight: fontWeights.semibold,
    paddingVertical: spacing.xs,
  },
  profileInputSuffix: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: fontWeights.medium,
  },
  sexRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sexPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.track,
  },
  sexPillActive: {
    backgroundColor: colors.coralTint10,
    borderColor: colors.coral,
  },
  sexPillLabel: {
    fontSize: 14,
    color: colors.navy,
    fontWeight: fontWeights.semibold,
  },
  sexPillLabelActive: {
    color: colors.coral,
    fontWeight: fontWeights.bold,
  },
  heightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heightFeetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  unitToggle: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.track,
    gap: 2,
  },
  unitTogglePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  unitTogglePillActive: {
    backgroundColor: colors.white,
    ...shadows.card,
  },
  unitToggleLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
  },
  unitToggleLabelActive: {
    color: colors.navy,
  },
  sectionLabel: {
    fontSize: 13,
    color: colors.navy,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.sm,
  },
  optionList: {
    gap: spacing.sm,
  },
  activityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.track,
    ...shadows.card,
  },
  activityOptionActive: {
    backgroundColor: colors.coralTint10,
    borderColor: colors.coral,
  },
  optionEmoji: {
    fontSize: 22,
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 14,
    color: colors.navy,
    fontWeight: fontWeights.semibold,
  },
  optionTitleActive: {
    fontWeight: fontWeights.bold,
  },
  optionSub: {
    fontSize: 12,
    color: colors.muted,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: colors.coral,
    backgroundColor: colors.coral,
  },
  goalGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  goalCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.track,
    ...shadows.card,
  },
  goalCardActive: {
    backgroundColor: colors.coral,
    borderColor: colors.coral,
  },
  goalEmoji: {
    fontSize: 24,
  },
  goalTitle: {
    fontSize: 12,
    color: colors.navy,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    lineHeight: 16,
  },
  goalTitleActive: {
    color: colors.white,
  },
  goalSub: {
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
  },
  goalSubActive: {
    color: 'rgba(255,255,255,0.75)',
  },
  previewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.coralTint10,
  },
  previewLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: fontWeights.medium,
  },
  previewValue: {
    fontSize: 22,
    color: colors.navy,
    fontWeight: fontWeights.bold,
  },
  previewUnit: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: fontWeights.medium,
  },
  budgetHero: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    borderRadius: radii.xl,
    backgroundColor: colors.navy,
    ...shadows.card,
  },
  budgetHeroLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: fontWeights.medium,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  budgetHeroAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginTop: spacing.md,
  },
  budgetHeroCurrency: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: fontWeights.bold,
    marginBottom: 6,
  },
  budgetHeroAmount: {
    fontSize: 64,
    color: colors.white,
    fontWeight: fontWeights.bold,
    lineHeight: 64,
  },
  budgetHeroHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginTop: spacing.sm,
  },
  budgetSliderWrap: {
    gap: spacing.xs,
  },
  budgetTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.track,
    position: 'relative',
    justifyContent: 'center',
  },
  budgetTrackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  budgetTrackThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    marginLeft: -10,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.green,
    ...shadows.card,
  },
  presetLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: fontWeights.semibold,
    marginBottom: spacing.sm,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.track,
    ...shadows.card,
  },
  presetChipActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  presetEmoji: {
    fontSize: 14,
  },
  presetChipLabel: {
    fontSize: 12,
    color: colors.navy,
    fontWeight: fontWeights.semibold,
  },
  presetChipLabelActive: {
    color: colors.white,
  },
  noteCardGold: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.goldTint15,
    borderWidth: 1,
    borderColor: 'rgba(255,200,87,0.3)',
  },
  noteCardGreen: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.greenTint15,
    borderWidth: 1,
    borderColor: 'rgba(67,176,106,0.2)',
  },
  noteEmoji: {
    fontSize: 18,
  },
  noteCopy: {
    flex: 1,
    gap: 2,
  },
  noteTitle: {
    fontSize: 13,
    color: colors.navy,
    fontWeight: fontWeights.bold,
  },
  noteSub: {
    fontSize: 12,
    color: colors.muted,
  },
  noteText: {
    flex: 1,
    fontSize: 12.5,
    color: colors.navy,
    lineHeight: 19,
  },
  noteHighlight: {
    fontWeight: fontWeights.bold,
    color: colors.gold,
  },
  macroSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.white,
    ...shadows.card,
  },
  donutWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  donutCalories: {
    fontSize: 11,
    color: colors.navy,
    fontWeight: fontWeights.bold,
  },
  macroLegend: {
    flex: 1,
    gap: 6,
  },
  macroLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  macroLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  macroLegendLabel: {
    flex: 1,
    fontSize: 12,
    color: colors.navy,
    fontWeight: fontWeights.semibold,
  },
  macroLegendGrams: {
    fontSize: 12,
    color: colors.muted,
  },
  macroLegendPct: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    minWidth: 32,
    textAlign: 'right',
  },
  macroLegendTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.track,
  },
  macroLegendTotalLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  macroLegendTotalValue: {
    fontSize: 12,
    color: colors.navy,
    fontWeight: fontWeights.bold,
  },
  macroSlider: {
    gap: spacing.sm,
  },
  macroSliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  macroSliderLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  macroSliderIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroSliderLabel: {
    fontSize: 13,
    color: colors.navy,
    fontWeight: fontWeights.semibold,
  },
  macroSliderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  macroStepButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroStepButtonText: {
    fontSize: 16,
    lineHeight: 18,
    color: colors.navy,
    fontWeight: fontWeights.bold,
  },
  macroStepButtonTextLight: {
    color: colors.white,
  },
  macroValue: {
    fontSize: 15,
    color: colors.navy,
    fontWeight: fontWeights.bold,
    minWidth: 52,
    textAlign: 'center',
  },
  macroValueUnit: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: fontWeights.medium,
  },
  macroTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.track,
    position: 'relative',
    justifyContent: 'center',
  },
  macroTrackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 5,
  },
  macroTrackThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    marginLeft: -10,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 2,
    ...shadows.card,
  },
  macroTrackBounds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroTrackBound: {
    fontSize: 10,
    color: colors.muted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.track,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.track,
  },
  resetButtonText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: fontWeights.medium,
  },
  summaryBudgetCard: {
    padding: spacing.xl,
    borderRadius: radii.xl,
    backgroundColor: colors.navy,
    ...shadows.card,
  },
  summaryBudgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  summaryBudgetLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: fontWeights.semibold,
  },
  summaryBudgetAmount: {
    fontSize: 40,
    color: colors.white,
    fontWeight: fontWeights.bold,
    lineHeight: 42,
  },
  summaryBudgetHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 6,
  },
  summaryCalorieCard: {
    padding: spacing.xl,
    borderRadius: radii.xl,
    backgroundColor: colors.white,
    gap: spacing.md,
    ...shadows.card,
  },
  summaryCalorieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryCalorieLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: fontWeights.semibold,
  },
  summaryGoalBadge: {
    marginLeft: 'auto',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.coral,
  },
  summaryGoalBadgeText: {
    fontSize: 11,
    color: colors.white,
    fontWeight: fontWeights.bold,
  },
  summaryCalorieAmount: {
    fontSize: 36,
    color: colors.navy,
    fontWeight: fontWeights.bold,
    lineHeight: 38,
  },
  summaryCalorieUnit: {
    fontSize: 16,
    color: colors.muted,
    fontWeight: fontWeights.medium,
  },
  summaryMacroGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryMacroTile: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
  },
  summaryMacroValue: {
    fontSize: 16,
    color: colors.navy,
    fontWeight: fontWeights.bold,
  },
  summaryMacroUnit: {
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.track,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    minHeight: 56,
    ...shadows.card,
  },
  primaryButtonContinue: {
    backgroundColor: colors.coral,
  },
  primaryButtonFinish: {
    backgroundColor: colors.green,
  },
  primaryButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.2,
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
