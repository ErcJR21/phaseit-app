import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useBudget } from '../context/BudgetContext';
import { colors, shadows } from '../theme/colors';
import { radii } from '../theme/spacing';
import { typography } from '../theme/typography';

type BudgetTrackerProps = {
  title?: string;
  onPress?: () => void;
};

function formatPeso(amount: number) {
  return `₱${amount.toLocaleString('en-PH')}`;
}

export function BudgetTracker({ title = "Today's Budget", onPress }: BudgetTrackerProps) {
  const { dailyAllowance, spent, remaining, percentRemaining } = useBudget();

  const progressWidth = dailyAllowance > 0 ? percentRemaining : 0;

  const card = (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <Text style={styles.amountRow}>
        <Text style={styles.amount}>{formatPeso(remaining)}</Text>
        <Text style={styles.amountSuffix}> left of {formatPeso(dailyAllowance)}</Text>
      </Text>

      <Text style={styles.spentCaption}>Spent {formatPeso(spent)} today</Text>

      <View style={styles.track}>
        <View style={[styles.fillWrap, { width: `${progressWidth}%` }]}>
          <View style={styles.fillGreen} />
          <View style={styles.fillGold} />
        </View>
      </View>
    </View>
  );

  if (!onPress) {
    return card;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open Jar budget screen"
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {card}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 20,
    gap: 12,
    ...shadows.card,
  },
  pressed: {
    opacity: 0.92,
  },
  title: {
    ...typography.sectionTitle,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  amount: {
    ...typography.budgetAmount,
  },
  amountSuffix: {
    ...typography.budgetSuffix,
  },
  spentCaption: {
    ...typography.subtitle,
    marginTop: -4,
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
});
