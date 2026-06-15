import { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Camera,
  Flame,
  UtensilsCrossed,
  Wallet,
  TrendingUp,
} from 'lucide-react-native';
import { PhaseEatLogo } from '../components/PhaseEatLogo';
import { MEAL_THUMBNAIL_SIZE } from '../components/MealThumbnail';
import { useMacros } from '../context/MacroContext';
import { components } from '../theme/designSystem';
import { colors, shadows } from '../theme/colors';
import { layout, radii, sizes, spacing } from '../theme/spacing';
import { fontWeights, typography } from '../theme/typography';
import {
  calculateMealSummary,
  formatMealTime,
  getMealCategory,
  groupMealsByDay,
} from '../utils/mealHistoryHelpers';

function formatPeso(amount) {
  return `₱${Math.round(amount).toLocaleString('en-PH')}`;
}

function SummaryStat({ icon: Icon, iconColor, iconBg, label, value }) {
  return (
    <View style={styles.statCell}>
      <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>
        <Icon size={18} color={iconColor} strokeWidth={2.2} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SummaryCard({ summary }) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryRow}>
        <SummaryStat
          icon={Wallet}
          iconColor={colors.coral}
          iconBg={colors.coralTint15}
          label="Total Spent"
          value={formatPeso(summary.totalSpent)}
        />
        <SummaryStat
          icon={TrendingUp}
          iconColor={colors.green}
          iconBg={colors.greenTint15}
          label="Avg / Day"
          value={formatPeso(summary.avgPerDay)}
        />
      </View>
      <View style={styles.summaryRow}>
        <SummaryStat
          icon={UtensilsCrossed}
          iconColor={colors.navy}
          iconBg={colors.navyTint10}
          label="Total Meals"
          value={String(summary.totalMeals)}
        />
        <SummaryStat
          icon={Flame}
          iconColor={colors.gold}
          iconBg={colors.goldTint15}
          label="Streak"
          value={`${summary.streak}d`}
        />
      </View>
    </View>
  );
}

function MealThumbnailOrIcon({ imageUri }) {
  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={styles.mealThumb}
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View style={styles.mealThumbPlaceholder}>
      <UtensilsCrossed size={20} color={colors.muted} strokeWidth={2} />
    </View>
  );
}

function MealHistoryRow({ meal }) {
  const category = getMealCategory(meal.loggedAt);
  const time = formatMealTime(meal.loggedAt);

  return (
    <View style={styles.mealRow}>
      <MealThumbnailOrIcon imageUri={meal.imageUri} />

      <View style={styles.mealCopy}>
        <Text style={styles.mealName} numberOfLines={1}>
          {meal.foodName}
        </Text>
        <View style={styles.mealMetaRow}>
          <Text style={styles.mealCategory}>{category}</Text>
          <Text style={styles.mealDot}>·</Text>
          <Text style={styles.mealTime}>{time}</Text>
        </View>
      </View>

      <View style={styles.mealStats}>
        <Text style={styles.mealCost}>{formatPeso(meal.price)}</Text>
        <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
      </View>
    </View>
  );
}

function MealSection({ section }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionList}>
        {section.meals.map((meal) => (
          <MealHistoryRow key={meal.id} meal={meal} />
        ))}
      </View>
    </View>
  );
}

function EmptyHistory() {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIconWrap}>
        <UtensilsCrossed size={24} color={colors.muted} strokeWidth={2} />
      </View>
      <Text style={styles.emptyTitle}>No meals logged yet</Text>
      <Text style={styles.emptyBody}>
        Scan your first meal to start building your history and streak.
      </Text>
    </View>
  );
}

export function MealHistoryScreen({ onLogMeal }) {
  const { meals, isLoading, isReady } = useMacros();

  const summary = useMemo(() => calculateMealSummary(meals), [meals]);
  const sections = useMemo(() => groupMealsByDay(meals), [meals]);

  if (isLoading || !isReady) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={typography.pageTitle}>Meal History</Text>
          <ActivityIndicator size="small" color={colors.green} />
          <Text style={styles.loadingText}>Loading meal history…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <PhaseEatLogo variant="compact" size={sizes.logoMarkSize} />
          </View>

          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <View style={styles.titleIconWrap}>
                <UtensilsCrossed size={22} color={colors.navy} strokeWidth={2.2} />
              </View>
              <View style={styles.titleCopy}>
                <Text style={typography.pageTitle}>Meal History</Text>
                <Text style={typography.subtitle}>Your logged meals over time</Text>
              </View>
            </View>
          </View>

          <SummaryCard summary={summary} />

          {sections.length === 0 ? (
            <EmptyHistory />
          ) : (
            sections.map((section) => (
              <MealSection key={section.dateKey} section={section} />
            ))
          )}
        </ScrollView>

        <View style={styles.stickyFooter}>
          <Pressable
            style={({ pressed }) => [styles.logButton, pressed && styles.logButtonPressed]}
            onPress={onLogMeal}
            accessibilityRole="button"
            accessibilityLabel="Log a meal"
          >
            <Camera size={20} color={colors.white} strokeWidth={2.2} />
            <Text style={styles.logButtonText}>Log a Meal</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleBlock: {
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  titleIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.navyTint10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  summaryCard: {
    ...components.card,
    gap: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCell: {
    flex: 1,
    gap: spacing.xs,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: fontWeights.bold,
    color: colors.navy,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: fontWeights.medium,
    color: colors.muted,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.sectionTitle,
  },
  sectionList: {
    gap: spacing.sm,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: layout.cardPaddingCompact,
    ...shadows.card,
  },
  mealThumb: {
    width: MEAL_THUMBNAIL_SIZE,
    height: MEAL_THUMBNAIL_SIZE,
    borderRadius: radii.sm,
    backgroundColor: colors.track,
  },
  mealThumbPlaceholder: {
    width: MEAL_THUMBNAIL_SIZE,
    height: MEAL_THUMBNAIL_SIZE,
    borderRadius: radii.sm,
    backgroundColor: colors.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  mealName: {
    ...typography.feedMessage,
    fontWeight: fontWeights.semibold,
  },
  mealMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  mealCategory: {
    fontSize: 12,
    fontWeight: fontWeights.medium,
    color: colors.green,
  },
  mealDot: {
    fontSize: 12,
    color: colors.muted,
  },
  mealTime: {
    ...typography.timestamp,
  },
  mealStats: {
    alignItems: 'flex-end',
    gap: 2,
  },
  mealCost: {
    fontSize: 14,
    fontWeight: fontWeights.semibold,
    color: colors.coral,
  },
  mealCalories: {
    fontSize: 12,
    fontWeight: fontWeights.medium,
    color: colors.muted,
  },
  emptyCard: {
    ...components.card,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: fontWeights.semibold,
    color: colors.navy,
  },
  emptyBody: {
    ...typography.subtitle,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  stickyFooter: {
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.track,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.coral,
    borderRadius: radii.pill,
    paddingVertical: 14,
    ...shadows.card,
  },
  logButtonPressed: {
    opacity: 0.9,
  },
  logButtonText: {
    fontSize: 16,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 13,
    color: colors.muted,
  },
});
