import { StyleSheet, Text, View } from 'react-native';
import { MacroRing } from '../MacroRing';
import { colors, shadows } from '../../theme/colors';
import { fontWeights } from '../../theme/typography';
import { layout, radii, spacing } from '../../theme/spacing';

export type MacroStats = {
  calories: { current: number; goal: number };
  protein: { current: number; goal: number };
  carbs: { current: number; goal: number };
  fat: { current: number; goal: number };
};

type MacroTrackerProps = {
  stats?: MacroStats;
};

const defaultStats: MacroStats = {
  calories: { current: 820, goal: 2000 },
  protein: { current: 42, goal: 75 },
  carbs: { current: 98, goal: 250 },
  fat: { current: 28, goal: 65 },
};

function pct(current: number, goal: number) {
  return Math.round((current / goal) * 100);
}

export function MacroTracker({ stats = defaultStats }: MacroTrackerProps) {
  const calorieProgress = stats.calories.current / stats.calories.goal;
  const caloriesLeft = Math.max(stats.calories.goal - stats.calories.current, 0);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Today&apos;s Macros</Text>

      <View style={styles.heroRow}>
        <MacroRing
          size={132}
          strokeWidth={10}
          progress={calorieProgress}
          color={colors.green}
          label="Calories"
          value={stats.calories.current}
          unit=" kcal"
          goal={stats.calories.goal}
        />

        <View style={styles.heroMeta}>
          <Text style={styles.heroValue}>{caloriesLeft}</Text>
          <Text style={styles.heroLabel}>kcal left today</Text>
          <View style={styles.heroDivider} />
          <Text style={styles.heroSub}>
            {pct(stats.calories.current, stats.calories.goal)}% of daily goal
          </Text>
        </View>
      </View>

      <View style={styles.macroRow}>
        <MacroRing
          size={88}
          strokeWidth={7}
          progress={stats.protein.current / stats.protein.goal}
          color={colors.coral}
          label="Protein"
          value={stats.protein.current}
          goal={stats.protein.goal}
          percentLabel={`${pct(stats.protein.current, stats.protein.goal)}% DV`}
        />
        <MacroRing
          size={88}
          strokeWidth={7}
          progress={stats.carbs.current / stats.carbs.goal}
          color={colors.gold}
          label="Carbs"
          value={stats.carbs.current}
          goal={stats.carbs.goal}
          percentLabel={`${pct(stats.carbs.current, stats.carbs.goal)}% DV`}
        />
        <MacroRing
          size={88}
          strokeWidth={7}
          progress={stats.fat.current / stats.fat.goal}
          color={colors.navy}
          label="Fat"
          value={stats.fat.current}
          goal={stats.fat.goal}
          percentLabel={`${pct(stats.fat.current, stats.fat.goal)}% DV`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: layout.cardPadding,
    gap: spacing.lg,
    ...shadows.card,
  },
  title: {
    fontSize: 16,
    fontWeight: fontWeights.semibold,
    color: colors.navy,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  heroMeta: {
    flex: 1,
    gap: 4,
  },
  heroValue: {
    fontSize: 28,
    fontWeight: fontWeights.bold,
    color: colors.navy,
    letterSpacing: -0.5,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: fontWeights.medium,
    color: colors.muted,
  },
  heroDivider: {
    height: 1,
    backgroundColor: colors.track,
    marginVertical: spacing.sm,
  },
  heroSub: {
    fontSize: 12,
    fontWeight: fontWeights.medium,
    color: colors.green,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
