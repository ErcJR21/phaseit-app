import { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ChevronDown, ChevronLeft } from 'lucide-react-native';
import { useUser } from '../context/UserContext';
import { components } from '../theme/designSystem';
import { colors, shadows } from '../theme/colors';
import { layout, radii, spacing } from '../theme/spacing';
import { fontWeights, typography } from '../theme/typography';
import {
  ACTIVITY_LEVEL_OPTIONS,
  calculateGoalsFromProfile,
  type ActivityLevel,
  type Gender,
  type MacroGoalTargets,
  type UserProfile,
} from '../utils/macroCalculator';

type SetMacroGoalsScreenProps = {
  onClose: () => void;
};

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'numeric';
  suffix?: string;
};

function FormField({ label, value, onChangeText, keyboardType = 'numeric', suffix }: FormFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholderTextColor={colors.muted}
        />
        {suffix ? <Text style={styles.inputSuffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

function parseDraftNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function profileFromDraft(draft: {
  weightKg: string;
  heightCm: string;
  age: string;
  gender: Gender;
  activityLevel: ActivityLevel;
}): UserProfile {
  return {
    weightKg: parseDraftNumber(draft.weightKg, 60),
    heightCm: parseDraftNumber(draft.heightCm, 170),
    age: parseDraftNumber(draft.age, 20),
    gender: draft.gender,
    activityLevel: draft.activityLevel,
  };
}

function goalsFromDraft(draft: {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}): MacroGoalTargets {
  return {
    calories: parseDraftNumber(draft.calories, 2000),
    protein: parseDraftNumber(draft.protein, 75),
    carbs: parseDraftNumber(draft.carbs, 250),
    fat: parseDraftNumber(draft.fat, 65),
  };
}

export function SetMacroGoalsScreen({ onClose }: SetMacroGoalsScreenProps) {
  const { profile, macroGoals, saveGoals } = useUser();

  const [weightKg, setWeightKg] = useState(String(profile.weightKg));
  const [heightCm, setHeightCm] = useState(String(profile.heightCm));
  const [age, setAge] = useState(String(profile.age));
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel);
  const [showActivityMenu, setShowActivityMenu] = useState(false);
  const [dropdownMenuTop, setDropdownMenuTop] = useState(0);

  const [calories, setCalories] = useState(String(macroGoals.calories));
  const [protein, setProtein] = useState(String(macroGoals.protein));
  const [carbs, setCarbs] = useState(String(macroGoals.carbs));
  const [fat, setFat] = useState(String(macroGoals.fat));
  const [targetsEdited, setTargetsEdited] = useState(false);

  useEffect(() => {
    setWeightKg(String(profile.weightKg));
    setHeightCm(String(profile.heightCm));
    setAge(String(profile.age));
    setGender(profile.gender);
    setActivityLevel(profile.activityLevel);
    setCalories(String(macroGoals.calories));
    setProtein(String(macroGoals.protein));
    setCarbs(String(macroGoals.carbs));
    setFat(String(macroGoals.fat));
  }, [profile, macroGoals]);

  const draftProfile = useMemo(
    () => profileFromDraft({ weightKg, heightCm, age, gender, activityLevel }),
    [weightKg, heightCm, age, gender, activityLevel],
  );

  const calculation = useMemo(() => calculateGoalsFromProfile(draftProfile), [draftProfile]);

  useEffect(() => {
    if (targetsEdited) return;

    setCalories(String(calculation.goals.calories));
    setProtein(String(calculation.goals.protein));
    setCarbs(String(calculation.goals.carbs));
    setFat(String(calculation.goals.fat));
  }, [calculation, targetsEdited]);

  const activityLabel =
    ACTIVITY_LEVEL_OPTIONS.find((option) => option.key === activityLevel)?.label ?? 'Select level';

  const handleRecalculate = () => {
    setTargetsEdited(false);
    setCalories(String(calculation.goals.calories));
    setProtein(String(calculation.goals.protein));
    setCarbs(String(calculation.goals.carbs));
    setFat(String(calculation.goals.fat));
  };

  const handleSave = async () => {
    await saveGoals(draftProfile, goalsFromDraft({ calories, protein, carbs, fat }));
    onClose();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={22} color={colors.navy} strokeWidth={2.2} />
            </Pressable>
            <Text style={styles.headerTitle}>Set Macro Goals</Text>
            <View style={styles.headerSpacer} />
          </View>

          <Text style={styles.subtitle}>
            Tell us about yourself and we&apos;ll estimate your daily needs. You can fine-tune
            targets manually.
          </Text>

          <View style={[styles.card, showActivityMenu && styles.cardWithOpenDropdown]}>
            <Text style={styles.cardTitle}>Your Profile</Text>

            <View style={styles.fieldGrid}>
              <FormField label="Weight" value={weightKg} onChangeText={setWeightKg} suffix="kg" />
              <FormField label="Height" value={heightCm} onChangeText={setHeightCm} suffix="cm" />
            </View>

            <FormField label="Age" value={age} onChangeText={setAge} suffix="years" />

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.optionRow}>
                {(['female', 'male'] as Gender[]).map((option) => {
                  const selected = gender === option;

                  return (
                    <Pressable
                      key={option}
                      style={[styles.optionPill, selected && styles.optionPillSelected]}
                      onPress={() => setGender(option)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                    >
                      <Text style={[styles.optionPillText, selected && styles.optionPillTextSelected]}>
                        {option === 'female' ? 'Female' : 'Male'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View
              style={[styles.dropdownField, showActivityMenu && styles.dropdownFieldOpen]}
            >
              <Text style={styles.fieldLabel}>Activity Level</Text>
              <View
                onLayout={(event) => {
                  const { y, height } = event.nativeEvent.layout;
                  setDropdownMenuTop(y + height + spacing.xs);
                }}
              >
                <Pressable
                  style={styles.dropdownTrigger}
                  onPress={() => setShowActivityMenu((prev) => !prev)}
                  accessibilityRole="button"
                  accessibilityLabel="Select activity level"
                >
                  <Text style={styles.dropdownValue}>{activityLabel}</Text>
                  <ChevronDown size={18} color={colors.navy} strokeWidth={2.2} />
                </Pressable>
              </View>

              {showActivityMenu ? (
                <View style={[styles.dropdownMenu, { top: dropdownMenuTop }]}>
                  {ACTIVITY_LEVEL_OPTIONS.map((option) => {
                    const selected = activityLevel === option.key;

                    return (
                      <Pressable
                        key={option.key}
                        style={[styles.dropdownItem, selected && styles.dropdownItemSelected]}
                        onPress={() => {
                          setActivityLevel(option.key);
                          setShowActivityMenu(false);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            selected && styles.dropdownItemTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </View>

          <View style={[styles.summaryCard, showActivityMenu && styles.summaryCardBehindDropdown]}>
            <Text style={styles.summaryTitle}>Estimated Needs</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{calculation.bmr}</Text>
                <Text style={styles.summaryLabel}>BMR (kcal)</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{calculation.tdee}</Text>
                <Text style={styles.summaryLabel}>Daily calories</Text>
              </View>
            </View>
            <Pressable
              style={styles.recalculateButton}
              onPress={handleRecalculate}
              accessibilityRole="button"
              accessibilityLabel="Recalculate macro targets from profile"
            >
              <Text style={styles.recalculateButtonText}>Recalculate targets</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Daily Targets</Text>
            <Text style={styles.cardHint}>Override any value to set your personal daily goal.</Text>

            <FormField
              label="Calories"
              value={calories}
              onChangeText={(value) => {
                setTargetsEdited(true);
                setCalories(value);
              }}
              suffix="kcal"
            />
            <FormField
              label="Protein"
              value={protein}
              onChangeText={(value) => {
                setTargetsEdited(true);
                setProtein(value);
              }}
              suffix="g"
            />
            <FormField
              label="Carbs"
              value={carbs}
              onChangeText={(value) => {
                setTargetsEdited(true);
                setCarbs(value);
              }}
              suffix="g"
            />
            <FormField
              label="Fat"
              value={fat}
              onChangeText={(value) => {
                setTargetsEdited(true);
                setFat(value);
              }}
              suffix="g"
            />
          </View>
        </ScrollView>

        <View style={styles.stickyFooter}>
          <Pressable
            style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
            onPress={() => {
              void handleSave();
            }}
            accessibilityRole="button"
            accessibilityLabel="Save macro goals"
          >
            <Text style={styles.saveButtonText}>Save Goals</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
    ...(Platform.OS === 'web' ? { overflow: 'visible' as const } : null),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  headerTitle: {
    ...typography.pageTitle,
    fontSize: 18,
  },
  headerSpacer: {
    width: 40,
  },
  subtitle: {
    ...typography.subtitle,
    lineHeight: 20,
  },
  card: {
    ...components.card,
    gap: spacing.md,
    overflow: 'visible',
  },
  cardWithOpenDropdown: {
    zIndex: 20,
    elevation: 20,
  },
  cardTitle: {
    ...typography.sectionTitle,
  },
  cardHint: {
    ...typography.subtitle,
    marginTop: -spacing.xs,
  },
  fieldGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  field: {
    flex: 1,
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.track,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 15,
    fontWeight: fontWeights.medium,
    color: colors.navy,
  },
  inputSuffix: {
    fontSize: 13,
    fontWeight: fontWeights.medium,
    color: colors.muted,
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.track,
    backgroundColor: colors.white,
  },
  optionPillSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  optionPillText: {
    fontSize: 14,
    fontWeight: fontWeights.semibold,
    color: colors.navy,
  },
  optionPillTextSelected: {
    color: colors.white,
  },
  dropdownField: {
    gap: spacing.xs,
    position: 'relative',
    overflow: 'visible',
    zIndex: 1,
  },
  dropdownFieldOpen: {
    zIndex: 30,
    elevation: 30,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.track,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  dropdownValue: {
    fontSize: 15,
    fontWeight: fontWeights.medium,
    color: colors.navy,
  },
  dropdownMenu: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.track,
    backgroundColor: colors.white,
    zIndex: 40,
    elevation: 40,
    ...shadows.card,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.track,
  },
  dropdownItemSelected: {
    backgroundColor: colors.navyTint10,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: fontWeights.medium,
    color: colors.navy,
  },
  dropdownItemTextSelected: {
    fontWeight: fontWeights.semibold,
  },
  summaryCard: {
    ...components.card,
    gap: spacing.md,
    backgroundColor: colors.greenTint15,
    borderWidth: 1,
    borderColor: colors.green,
    zIndex: 0,
  },
  summaryCardBehindDropdown: {
    zIndex: 0,
    elevation: 0,
  },
  summaryTitle: {
    ...typography.sectionTitle,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: fontWeights.bold,
    color: colors.navy,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: fontWeights.medium,
    color: colors.muted,
  },
  summaryDivider: {
    width: 1,
    height: 48,
    backgroundColor: colors.track,
  },
  recalculateButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.green,
  },
  recalculateButtonText: {
    fontSize: 13,
    fontWeight: fontWeights.semibold,
    color: colors.green,
  },
  stickyFooter: {
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.track,
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
    borderRadius: radii.pill,
    paddingVertical: 16,
    ...shadows.card,
  },
  saveButtonPressed: {
    opacity: 0.9,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
});
