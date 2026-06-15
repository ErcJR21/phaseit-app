import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AlertTriangle, Archive, ChevronLeft, Shield, Sparkles, Trophy } from 'lucide-react-native';
import { MealThumbnail } from '../components/MealThumbnail';
import { PhaseEatLogo } from '../components/PhaseEatLogo';
import { useBarkada } from '../context/BarkadaContext';
import { BUDGET_HERO_STREAK, useBudget } from '../context/BudgetContext';
import { EXP_REWARDS } from '../data/exp';
import { components } from '../theme/designSystem';
import { colors, shadows } from '../theme/colors';
import { layout, radii, sizes, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

function formatPeso(amount) {
  const prefix = amount < 0 ? '-₱' : '₱';
  return `${prefix}${Math.abs(amount).toLocaleString('en-PH')}`;
}

function JarViewToggle({ activeView, onViewChange }) {
  const views = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
  ];

  return (
    <View style={styles.toggleRow}>
      {views.map((view) => {
        const active = activeView === view.key;

        return (
          <Pressable
            key={view.key}
            style={[styles.togglePill, active ? styles.togglePillActive : styles.togglePillInactive]}
            onPress={() => onViewChange(view.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>{view.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function BudgetHeroBadge({ streak }) {
  return (
    <View style={styles.heroBadge}>
      <View style={styles.heroIconWrap}>
        <Trophy size={18} color={colors.gold} strokeWidth={2.2} />
      </View>
      <View style={styles.heroCopy}>
        <Text style={styles.heroTitle}>Budget Hero</Text>
        <Text style={styles.heroSubtitle}>
          {streak} days under budget · +{EXP_REWARDS.budgetHero} EXP earned
        </Text>
      </View>
    </View>
  );
}

function TripAlertCard({ trips }) {
  const trip = trips[0];

  return (
    <View style={styles.alertCard}>
      <View style={styles.alertIconWrap}>
        <AlertTriangle size={18} color={colors.coral} strokeWidth={2.2} />
      </View>
      <View style={styles.alertCopy}>
        <Text style={styles.alertTitle}>Budget Alert: Upcoming Food Trip</Text>
        <Text style={styles.alertBody}>
          {trip.location} · {trip.date}
        </Text>
        {trips.length > 1 ? (
          <Text style={styles.alertMeta}>+{trips.length - 1} more trip today</Text>
        ) : null}
      </View>
    </View>
  );
}

function BudgetCoachCard({ safeDailySpend, remainingDaysInWeek, weeklyRemaining }) {
  return (
    <View style={styles.coachCard}>
      <View style={styles.coachHeader}>
        <View style={styles.coachIconWrap}>
          <Sparkles size={18} color={colors.navy} strokeWidth={2.2} />
        </View>
        <Text style={styles.coachTitle}>Budget Coach</Text>
      </View>

      <Text style={styles.coachAmount}>{formatPeso(safeDailySpend)}</Text>
      <Text style={styles.coachLabel}>Safe daily spend</Text>
      <Text style={styles.coachHint}>
        Based on {formatPeso(weeklyRemaining)} left across {remainingDaysInWeek}{' '}
        {remainingDaysInWeek === 1 ? 'day' : 'days'} this week.
      </Text>
    </View>
  );
}

function AllowanceCard({
  title,
  availableBalance,
  total,
  spent,
  emergencyFund,
  percentRemaining,
  isOnTrack,
  statusLabel,
  spentCaption,
}) {
  return (
    <View style={styles.allowanceCard}>
      <View style={styles.allowanceHeader}>
        <Text style={styles.allowanceTitle}>{title}</Text>
        <View
          style={[
            styles.statusBadge,
            isOnTrack ? styles.statusBadgeOnTrack : styles.statusBadgeOver,
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              isOnTrack ? styles.statusBadgeTextOnTrack : styles.statusBadgeTextOver,
            ]}
          >
            {statusLabel}
          </Text>
        </View>
      </View>

      <Text style={styles.balanceLabel}>Available Balance</Text>
      <Text style={styles.amountRow}>
        <Text
          style={[styles.amount, availableBalance < 0 && styles.amountNegative]}
        >
          {formatPeso(availableBalance)}
        </Text>
        <Text style={styles.amountSuffix}> of {formatPeso(total)}</Text>
      </Text>

      <View style={styles.balanceBreakdown}>
        <Text style={styles.breakdownLine}>Spent {formatPeso(spent)}</Text>
        <Text style={styles.breakdownLine}>Emergency fund −{formatPeso(emergencyFund)}</Text>
      </View>

      <Text style={styles.spentCaption}>{spentCaption}</Text>

      <View style={styles.track}>
        <View style={[styles.fillWrap, { width: `${percentRemaining}%` }]}>
          <View style={styles.fillGreen} />
          <View style={styles.fillGold} />
        </View>
      </View>
    </View>
  );
}

function EmergencyFundCard({ amount }) {
  return (
    <View style={styles.emergencyCard}>
      <View style={styles.emergencyHeader}>
        <View style={styles.emergencyIconWrap}>
          <Shield size={16} color={colors.navy} strokeWidth={2.2} />
        </View>
        <Text style={styles.emergencyTitle}>Emergency Fund</Text>
      </View>
      <Text style={styles.emergencyAmount}>{formatPeso(amount)}</Text>
      <Text style={styles.emergencyHint}>Reserved from your allowance for unexpected cravings.</Text>
    </View>
  );
}

function QuickSetAllowance({ options, selectedAmount, onSelect }) {
  return (
    <View style={styles.quickSetCard}>
      <Text style={styles.quickSetTitle}>Quick set allowance</Text>
      <View style={styles.quickSetRow}>
        {options.map((amount) => {
          const selected = selectedAmount === amount;

          return (
            <Pressable
              key={amount}
              style={[styles.quickSetPill, selected && styles.quickSetPillSelected]}
              onPress={() => onSelect(amount)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.quickSetPillText, selected && styles.quickSetPillTextSelected]}>
                {amount}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MealRow({ meal }) {
  return (
    <View style={styles.mealRow}>
      <MealThumbnail imageUri={meal.imageUri} />
      <Text style={styles.mealName} numberOfLines={1}>
        {meal.foodName}
      </Text>
      <Text style={styles.mealPrice}>-{formatPeso(meal.price)}</Text>
    </View>
  );
}

function MealsList({ title, meals, emptyMessage }) {
  return (
    <View style={styles.mealsCard}>
      <Text style={styles.mealsTitle}>{title}</Text>

      {meals.length === 0 ? (
        <Text style={styles.mealsEmpty}>{emptyMessage}</Text>
      ) : (
        <View style={styles.mealsList}>
          {meals.map((meal) => (
            <MealRow key={meal.id} meal={meal} />
          ))}
        </View>
      )}
    </View>
  );
}

export function JarScreen({ onClose }) {
  const { todayTrips } = useBarkada();
  const {
    dailyAllowance,
    weeklyAllowance,
    emergencyFund,
    spent,
    weeklySpent,
    availableBalance,
    weeklyAvailableBalance,
    weeklyRemaining,
    safeDailySpend,
    remainingDaysInWeek,
    daysUnderBudget,
    isBudgetHero,
    isOnTrack,
    isWeeklyExceeded,
    availablePercent,
    todayMeals,
    weeklyMeals,
    quickSetOptions,
    setAllowance,
    isReady,
  } = useBudget();

  const [activeView, setActiveView] = useState('daily');
  const isDaily = activeView === 'daily';
  const hasTripToday = todayTrips.length > 0;

  const weeklyTotalBudget = weeklyAllowance ?? 0;
  const weeklyPercentRemaining =
    !isReady || weeklyTotalBudget <= 0
      ? 0
      : Math.min(
          Math.max(((weeklyTotalBudget - weeklySpent) / weeklyTotalBudget) * 100, 0),
          100,
        );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {onClose ? (
            <Pressable
              style={styles.backButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={22} color={colors.navy} strokeWidth={2.2} />
            </Pressable>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <PhaseEatLogo variant="compact" size={sizes.logoMarkSize} />
          <View style={styles.backPlaceholder} />
        </View>

        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <View style={styles.jarIconWrap}>
              <Archive size={22} color={colors.navy} strokeWidth={2.2} />
            </View>
            <View style={styles.titleCopy}>
              <Text style={typography.pageTitle}>Jar</Text>
              <Text style={typography.subtitle}>Your daily food allowance</Text>
            </View>
          </View>
        </View>

        {isBudgetHero ? <BudgetHeroBadge streak={daysUnderBudget} /> : null}

        <JarViewToggle activeView={activeView} onViewChange={setActiveView} />

        {hasTripToday ? <TripAlertCard trips={todayTrips} /> : null}

        {isDaily ? (
          <AllowanceCard
            title="Daily Allowance"
            availableBalance={availableBalance}
            total={dailyAllowance}
            spent={spent}
            emergencyFund={emergencyFund}
            percentRemaining={availablePercent}
            isOnTrack={isOnTrack}
            statusLabel={isOnTrack ? 'On track' : 'Over budget'}
            spentCaption={`${daysUnderBudget} of ${BUDGET_HERO_STREAK} days toward Budget Hero`}
          />
        ) : (
          <AllowanceCard
            title="Weekly Allowance"
            availableBalance={weeklyAvailableBalance}
            total={weeklyAllowance}
            spent={weeklySpent}
            emergencyFund={emergencyFund}
            percentRemaining={weeklyPercentRemaining}
            isOnTrack={!isWeeklyExceeded}
            statusLabel={isWeeklyExceeded ? 'Over budget' : 'On track'}
            spentCaption={`Spent ${formatPeso(weeklySpent)} this week`}
          />
        )}

        <BudgetCoachCard
          safeDailySpend={safeDailySpend}
          remainingDaysInWeek={remainingDaysInWeek}
          weeklyRemaining={weeklyRemaining}
        />

        <EmergencyFundCard amount={emergencyFund} />

        <QuickSetAllowance
          options={quickSetOptions}
          selectedAmount={dailyAllowance}
          onSelect={setAllowance}
        />

        <MealsList
          title={isDaily ? "Today's Meals" : "This Week's Meals"}
          meals={isDaily ? todayMeals : weeklyMeals}
          emptyMessage={
            isDaily
              ? 'No meals logged yet today. Scan a meal to start tracking.'
              : 'No meals logged this week yet.'
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.sm,
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
  backPlaceholder: {
    width: 40,
  },
  titleBlock: {
    paddingHorizontal: layout.screenPaddingX,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  jarIconWrap: {
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
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: layout.screenPaddingX,
    backgroundColor: colors.goldTint15,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: layout.cardPaddingCompact,
    ...shadows.card,
  },
  heroIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    gap: 2,
  },
  heroTitle: {
    ...typography.quickActionLabel,
    color: colors.navy,
  },
  heroSubtitle: {
    ...typography.subtitle,
    color: colors.navy,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: layout.screenPaddingX,
  },
  togglePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radii.pill,
    minHeight: 40,
  },
  togglePillActive: {
    backgroundColor: colors.gold,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  togglePillInactive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.navy,
  },
  toggleLabel: {
    ...typography.tabPill,
    color: colors.navy,
  },
  toggleLabelActive: {
    fontWeight: '700',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginHorizontal: layout.screenPaddingX,
    backgroundColor: colors.coralTint10,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.coral,
    padding: layout.cardPaddingCompact,
    ...shadows.card,
  },
  alertIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  alertTitle: {
    ...typography.quickActionLabel,
    color: colors.coral,
  },
  alertBody: {
    ...typography.feedMessage,
    fontWeight: '600',
  },
  alertMeta: {
    ...typography.timestamp,
    color: colors.coral,
  },
  allowanceCard: {
    ...components.card,
    marginHorizontal: layout.screenPaddingX,
    gap: spacing.md,
  },
  allowanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  allowanceTitle: {
    ...typography.sectionTitle,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  statusBadgeOnTrack: {
    backgroundColor: colors.greenTint15,
  },
  statusBadgeOver: {
    backgroundColor: colors.coralTint10,
  },
  statusBadgeText: {
    ...typography.pill,
    textTransform: 'none',
  },
  statusBadgeTextOnTrack: {
    color: colors.green,
  },
  statusBadgeTextOver: {
    color: colors.coral,
  },
  balanceLabel: {
    ...typography.pill,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  amount: {
    ...typography.budgetAmount,
  },
  amountNegative: {
    color: colors.coral,
  },
  amountSuffix: {
    ...typography.budgetSuffix,
  },
  balanceBreakdown: {
    gap: 2,
    marginTop: -spacing.xs,
  },
  breakdownLine: {
    ...typography.subtitle,
  },
  spentCaption: {
    ...typography.subtitle,
  },
  track: {
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  fillWrap: {
    flexDirection: 'row',
    height: '100%',
    borderRadius: radii.pill,
    overflow: 'hidden',
    minWidth: 4,
  },
  fillGreen: {
    flex: 1,
    backgroundColor: colors.green,
  },
  fillGold: {
    flex: 1,
    backgroundColor: colors.gold,
  },
  coachCard: {
    ...components.card,
    marginHorizontal: layout.screenPaddingX,
    gap: spacing.sm,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  coachIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.navyTint10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachTitle: {
    ...typography.sectionTitle,
  },
  coachAmount: {
    ...typography.budgetAmount,
    fontSize: 28,
  },
  coachLabel: {
    ...typography.quickActionLabel,
    marginTop: -spacing.xs,
  },
  coachHint: {
    ...typography.subtitle,
    lineHeight: 20,
  },
  emergencyCard: {
    ...components.cardCompact,
    marginHorizontal: layout.screenPaddingX,
    gap: spacing.sm,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emergencyIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.navyTint10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTitle: {
    ...typography.sectionTitle,
  },
  emergencyAmount: {
    ...typography.quickActionLabel,
    fontSize: 18,
    color: colors.navy,
  },
  emergencyHint: {
    ...typography.subtitle,
    lineHeight: 20,
  },
  quickSetCard: {
    ...components.cardCompact,
    marginHorizontal: layout.screenPaddingX,
    gap: spacing.md,
  },
  quickSetTitle: {
    ...typography.sectionTitle,
  },
  quickSetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickSetPill: {
    minWidth: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.track,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  quickSetPillSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  quickSetPillText: {
    ...typography.tabPill,
    color: colors.navy,
  },
  quickSetPillTextSelected: {
    color: colors.white,
  },
  mealsCard: {
    ...components.card,
    marginHorizontal: layout.screenPaddingX,
    gap: spacing.md,
  },
  mealsTitle: {
    ...typography.sectionTitle,
  },
  mealsEmpty: {
    ...typography.subtitle,
    lineHeight: 20,
  },
  mealsList: {
    gap: spacing.sm,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  mealName: {
    flex: 1,
    ...typography.feedMessage,
    fontWeight: '600',
    minWidth: 0,
  },
  mealPrice: {
    ...typography.quickActionLabel,
    color: colors.coral,
  },
});
