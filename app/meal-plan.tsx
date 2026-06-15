import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, ChevronLeft, Plus, Wallet, X } from 'lucide-react-native';
import { RecipePickerModal } from '../components/mealPlan/RecipePickerModal';
import { useAuth } from '../context/AuthContext';
import {
  addMeal,
  deleteMealPlan,
  fetchMealPlans,
  type DayOfWeek,
  type MealPlanRow,
  type MealType,
} from '../services/mealPlansService';
import { fetchRecipes, type RecipeRow } from '../services/recipesService';
import { colors, shadows } from '../theme/colors';
import { layout, radii, spacing } from '../theme/spacing';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const FULL_DAY_LABELS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

const DAILY_BUDGET = 300;

type MealSlotConfig = {
  type: MealType;
  label: string;
  time: string;
  emoji: string;
};

const MEAL_SLOTS: MealSlotConfig[] = [
  { type: 'breakfast', label: 'Breakfast', time: '7:00 – 9:00 AM', emoji: '🌅' },
  { type: 'lunch', label: 'Lunch', time: '12:00 – 1:00 PM', emoji: '☀️' },
  { type: 'snack', label: 'Snack', time: '3:00 – 4:00 PM', emoji: '🫙' },
  { type: 'dinner', label: 'Dinner', time: '6:00 – 8:00 PM', emoji: '🌙' },
];

type WeekPlan = Partial<Record<MealType, MealPlanRow>>;

type MealPlanScreenProps = {
  onClose?: () => void;
};

function getTodayIndex(): DayOfWeek {
  const day = new Date().getDay();
  return (day === 0 ? 6 : day - 1) as DayOfWeek;
}

function getWeekDates(): Date[] {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

function rowsToWeekPlan(rows: MealPlanRow[]): Record<DayOfWeek, WeekPlan> {
  const plan: Record<DayOfWeek, WeekPlan> = {
    0: {},
    1: {},
    2: {},
    3: {},
    4: {},
    5: {},
    6: {},
  };

  for (const row of rows) {
    plan[row.day_of_week][row.meal_type] = row;
  }

  return plan;
}

export default function MealPlanScreen({ onClose }: MealPlanScreenProps) {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getTodayIndex);
  const [plan, setPlan] = useState<Record<DayOfWeek, WeekPlan>>({
    0: {},
    1: {},
    2: {},
    3: {},
    4: {},
    5: {},
    6: {},
  });
  const [loading, setLoading] = useState(true);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<MealType | null>(null);
  const [loggedSlots, setLoggedSlots] = useState<Set<string>>(new Set());

  const weekDates = useMemo(() => getWeekDates(), []);
  const todayIndex = useMemo(() => getTodayIndex(), []);
  const dayPlan = plan[selectedDay] ?? {};

  const loadRecipes = useCallback(async () => {
    setRecipesLoading(true);

    try {
      const rows = await fetchRecipes();
      setRecipes(rows);
    } catch {
      setError('Could not load recipes. Tap to retry.');
    } finally {
      setRecipesLoading(false);
    }
  }, []);

  const loadPlans = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const rows = await fetchMealPlans(userId);
      setPlan(rowsToWeekPlan(rows));
    } catch {
      setError('Could not load your meal plan. Pull to refresh or try again.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadRecipes();
    loadPlans();
  }, [loadRecipes, loadPlans]);

  const dayTotal = useMemo(
    () =>
      Object.values(dayPlan).reduce(
        (sum, entry) => sum + (entry?.recipe?.cost ?? 0),
        0,
      ),
    [dayPlan],
  );

  const weekSummary = useMemo(
    () =>
      DAY_LABELS.map((_, index) => {
        const entries = plan[index as DayOfWeek] ?? {};
        return Object.values(entries).reduce(
          (sum, entry) => sum + (entry?.recipe?.cost ?? 0),
          0,
        );
      }),
    [plan],
  );

  const handleAddRecipe = async (recipe: RecipeRow) => {
    if (!userId || !activeSlot) return;

    setSaving(true);
    setError(null);

    try {
      const saved = await addMeal({
        userId,
        dayOfWeek: selectedDay,
        mealType: activeSlot,
        recipeId: recipe.id,
      });

      setPlan((current) => ({
        ...current,
        [selectedDay]: {
          ...(current[selectedDay] ?? {}),
          [activeSlot]: saved,
        },
      }));
      setActiveSlot(null);
    } catch {
      setError('Could not save this meal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMeal = async (mealType: MealType) => {
    if (!userId) return;

    setSaving(true);
    setError(null);

    try {
      await deleteMealPlan(userId, selectedDay, mealType);
      setPlan((current) => {
        const nextDay = { ...(current[selectedDay] ?? {}) };
        delete nextDay[mealType];
        return { ...current, [selectedDay]: nextDay };
      });
      setLoggedSlots((current) => {
        const next = new Set(current);
        next.delete(`${selectedDay}-${mealType}`);
        return next;
      });
    } catch {
      setError('Could not remove this meal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleLogged = (mealType: MealType) => {
    const key = `${selectedDay}-${mealType}`;
    setLoggedSlots((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectedDayLabel = `${FULL_DAY_LABELS[selectedDay]}, ${weekDates[selectedDay].toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
  })}`;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={20} color={colors.navy} strokeWidth={2.5} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Meal Plan</Text>
          <Text style={styles.subtitle}>Plan. Track. Stay on budget.</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayStrip}
      >
        {DAY_LABELS.map((label, index) => {
          const dayIndex = index as DayOfWeek;
          const active = dayIndex === selectedDay;
          const isToday = dayIndex === todayIndex;
          const hasMeals = Object.keys(plan[dayIndex] ?? {}).length > 0;

          return (
            <Pressable
              key={label}
              style={[styles.dayPill, active ? styles.dayPillActive : styles.dayPillInactive]}
              onPress={() => setSelectedDay(dayIndex)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.dayPillLabel, active && styles.dayPillLabelActive]}>
                {label}
              </Text>
              <Text style={[styles.dayPillDate, active && styles.dayPillDateActive]}>
                {weekDates[index].getDate()}
              </Text>
              {hasMeals && (
                <View
                  style={[
                    styles.dayDot,
                    active ? styles.dayDotActive : styles.dayDotInactive,
                  ]}
                />
              )}
              {isToday && !active && <Text style={styles.todayTag}>TODAY</Text>}
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.coral} />
          <Text style={styles.loadingText}>Loading your meal plan...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
        >
          {error && (
            <Pressable
              style={styles.errorBanner}
              onPress={() => {
                loadPlans();
                loadRecipes();
              }}
            >
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.errorRetry}>Tap to retry</Text>
            </Pressable>
          )}

          <View
            style={[
              styles.budgetCard,
              dayTotal > DAILY_BUDGET ? styles.budgetCardOver : styles.budgetCardOnTrack,
            ]}
          >
            <View>
              <Text style={styles.budgetDayLabel}>{FULL_DAY_LABELS[selectedDay]}'s plan</Text>
              <Text style={styles.budgetAmount}>₱{dayTotal}</Text>
              <Text
                style={[
                  styles.budgetStatus,
                  dayTotal > DAILY_BUDGET ? styles.budgetStatusOver : styles.budgetStatusOnTrack,
                ]}
              >
                {dayTotal > DAILY_BUDGET
                  ? `₱${dayTotal - DAILY_BUDGET} over budget!`
                  : `₱${DAILY_BUDGET - dayTotal} remaining`}
              </Text>
            </View>
            <View style={styles.budgetMeta}>
              <Wallet
                size={24}
                color={dayTotal > DAILY_BUDGET ? colors.coral : colors.green}
                strokeWidth={2}
              />
              <Text style={styles.budgetLimit}>Budget: ₱{DAILY_BUDGET}</Text>
            </View>
          </View>

          <View style={styles.slotsSection}>
            {MEAL_SLOTS.map((slot) => {
              const entry = dayPlan[slot.type];
              const recipe = entry?.recipe;
              const isLogged = loggedSlots.has(`${selectedDay}-${slot.type}`);

              return (
                <View key={slot.type} style={styles.slotGroup}>
                  <View style={styles.slotHeader}>
                    <Text style={styles.slotEmoji}>{slot.emoji}</Text>
                    <Text style={styles.slotLabel}>{slot.label}</Text>
                    <Text style={styles.slotTime}>{slot.time}</Text>
                  </View>

                  {entry ? (
                    <View style={[styles.mealCard, isLogged && styles.mealCardLogged]}>
                      <View style={styles.mealEmojiWrap}>
                        <Text style={styles.mealEmoji}>{recipe?.emoji ?? '🍽️'}</Text>
                      </View>
                      <View style={styles.mealCopy}>
                        <Text style={styles.mealName}>{recipe?.name ?? 'Recipe'}</Text>
                        <Text style={styles.mealMeta}>
                          {recipe ? (
                            <>
                              <Text style={styles.mealCost}>₱{recipe.cost}</Text>
                              {recipe.place ? (
                                <Text style={styles.mealPlace}> · {recipe.place}</Text>
                              ) : null}
                            </>
                          ) : (
                            <Text style={styles.mealPlace}>Saved recipe</Text>
                          )}
                        </Text>
                      </View>
                      <View style={styles.mealActions}>
                        <Pressable
                          style={[
                            styles.actionButton,
                            isLogged ? styles.actionButtonLogged : styles.actionButtonIdle,
                          ]}
                          onPress={() => toggleLogged(slot.type)}
                          disabled={saving}
                        >
                          <Check
                            size={14}
                            color={isLogged ? colors.green : colors.muted}
                            strokeWidth={2.5}
                          />
                        </Pressable>
                        <Pressable
                          style={[styles.actionButton, styles.actionButtonRemove]}
                          onPress={() => handleRemoveMeal(slot.type)}
                          disabled={saving}
                        >
                          <X size={14} color={colors.coral} strokeWidth={2.5} />
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.addSlotButton}
                      onPress={() => setActiveSlot(slot.type)}
                      disabled={saving || !userId}
                    >
                      <Plus size={16} color={colors.muted} strokeWidth={2} />
                      <Text style={styles.addSlotLabel}>Add {slot.label}</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>

          <Text style={styles.weekTitle}>This Week's Spend</Text>
          <View style={styles.weekCard}>
            <View style={styles.weekBars}>
              {weekSummary.map((total, index) => {
                const pct = Math.min(100, (total / DAILY_BUDGET) * 100);
                const active = index === selectedDay;
                const overBudget = total > DAILY_BUDGET;

                return (
                  <View key={DAY_LABELS[index]} style={styles.weekBarColumn}>
                    <View style={styles.weekBarTrack}>
                      <View
                        style={[
                          styles.weekBarFill,
                          {
                            height: total === 0 ? 4 : Math.max(8, pct * 0.64),
                            backgroundColor: overBudget
                              ? colors.coral
                              : active
                                ? colors.navy
                                : colors.track,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.weekBarLabel,
                        active && styles.weekBarLabelActive,
                      ]}
                    >
                      {DAY_LABELS[index]}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.weekTotalRow}>
              <Text style={styles.weekTotalLabel}>Week Total</Text>
              <Text style={styles.weekTotalAmount}>
                ₱{weekSummary.reduce((sum, value) => sum + value, 0)}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      <RecipePickerModal
        visible={activeSlot !== null}
        mealType={activeSlot ?? 'breakfast'}
        mealLabel={selectedDayLabel}
        recipes={recipes}
        loading={recipesLoading}
        saving={saving}
        onClose={() => setActiveSlot(null)}
        onSelect={handleAddRecipe}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
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
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.muted,
  },
  dayStrip: {
    paddingHorizontal: layout.screenPaddingX,
    gap: 6,
    paddingBottom: spacing.md,
  },
  dayPill: {
    width: 48,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radii.lg,
    ...shadows.card,
  },
  dayPillActive: {
    backgroundColor: colors.navy,
  },
  dayPillInactive: {
    backgroundColor: colors.white,
  },
  dayPillLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.muted,
  },
  dayPillLabelActive: {
    color: 'rgba(255,255,255,0.7)',
  },
  dayPillDate: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
    marginTop: 1,
  },
  dayPillDateActive: {
    color: colors.white,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  dayDotActive: {
    backgroundColor: colors.coral,
  },
  dayDotInactive: {
    backgroundColor: colors.gold,
  },
  todayTag: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.coral,
    marginTop: 2,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.muted,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: layout.screenPaddingX,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  errorBanner: {
    backgroundColor: colors.coralTint10,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 2,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.coral,
  },
  errorRetry: {
    fontSize: 12,
    color: colors.muted,
  },
  budgetCard: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
  },
  budgetCardOnTrack: {
    backgroundColor: 'rgba(67, 176, 106, 0.1)',
    borderColor: 'rgba(67, 176, 106, 0.2)',
  },
  budgetCardOver: {
    backgroundColor: 'rgba(255, 122, 102, 0.1)',
    borderColor: 'rgba(255, 122, 102, 0.2)',
  },
  budgetDayLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.muted,
  },
  budgetAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.navy,
    marginTop: 2,
  },
  budgetStatus: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  budgetStatusOnTrack: {
    color: colors.green,
  },
  budgetStatusOver: {
    color: colors.coral,
  },
  budgetMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  budgetLimit: {
    fontSize: 11,
    color: colors.muted,
  },
  slotsSection: {
    gap: spacing.md,
  },
  slotGroup: {
    gap: spacing.sm,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  slotEmoji: {
    fontSize: 14,
  },
  slotLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  slotTime: {
    fontSize: 11,
    color: colors.muted,
  },
  mealCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.card,
  },
  mealCardLogged: {
    borderWidth: 1.5,
    borderColor: 'rgba(67, 176, 106, 0.3)',
  },
  mealEmojiWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealEmoji: {
    fontSize: 20,
  },
  mealCopy: {
    flex: 1,
    gap: 2,
  },
  mealName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy,
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealCost: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.green,
  },
  mealPlace: {
    fontSize: 10,
    color: colors.muted,
  },
  mealActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonIdle: {
    backgroundColor: colors.track,
  },
  actionButtonLogged: {
    backgroundColor: colors.greenTint15,
  },
  actionButtonRemove: {
    backgroundColor: colors.coralTint10,
  },
  addSlotButton: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.track,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  addSlotLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
  },
  weekTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
  },
  weekCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  weekBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    height: 80,
  },
  weekBarColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  weekBarTrack: {
    width: '100%',
    height: 64,
    justifyContent: 'flex-end',
  },
  weekBarFill: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  weekBarLabel: {
    fontSize: 10,
    color: colors.muted,
  },
  weekBarLabelActive: {
    color: colors.navy,
    fontWeight: '700',
  },
  weekTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.track,
  },
  weekTotalLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  weekTotalAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
  },
});
