import { StyleSheet, Text, View } from 'react-native';
import { Flame, Star, UtensilsCrossed } from 'lucide-react-native';
import { colors, shadows } from '../../theme/colors';
import { fontWeights } from '../../theme/typography';
import { radii, spacing } from '../../theme/spacing';

export type SummaryStats = {
  mealsToday: number;
  streakDays: number;
  expTotal: number;
};

type SummaryCardsProps = {
  stats?: SummaryStats;
};

const defaultStats: SummaryStats = {
  mealsToday: 2,
  streakDays: 5,
  expTotal: 340,
};

type CardSpec = {
  id: string;
  label: string;
  value: string;
  icon: typeof UtensilsCrossed;
  iconColor: string;
  iconBg: string;
};

export function SummaryCards({ stats = defaultStats }: SummaryCardsProps) {
  const cards: CardSpec[] = [
    {
      id: 'meals',
      label: 'Meals Today',
      value: String(stats.mealsToday),
      icon: UtensilsCrossed,
      iconColor: colors.coral,
      iconBg: colors.coralTint15,
    },
    {
      id: 'streak',
      label: 'Day Streak',
      value: `${stats.streakDays}d`,
      icon: Flame,
      iconColor: colors.gold,
      iconBg: colors.goldTint15,
    },
    {
      id: 'exp',
      label: 'Total EXP',
      value: String(stats.expTotal),
      icon: Star,
      iconColor: colors.green,
      iconBg: colors.greenTint15,
    },
  ];

  return (
    <View style={styles.row}>
      {cards.map(({ id, label, value, icon: Icon, iconColor, iconBg }) => (
        <View key={id} style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
            <Icon size={18} color={iconColor} strokeWidth={2.2} />
          </View>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    ...shadows.card,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: fontWeights.bold,
    color: colors.navy,
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 10,
    fontWeight: fontWeights.medium,
    color: colors.muted,
    textAlign: 'center',
  },
});
