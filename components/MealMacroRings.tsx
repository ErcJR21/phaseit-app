import { StyleSheet, Text, View } from 'react-native';
import { MacroRing } from './MacroRing';
import { useUser } from '../context/UserContext';
import { colors } from '../theme/colors';
import { fontWeights } from '../theme/typography';
import { spacing } from '../theme/spacing';
import type { MacroGoalTargets } from '../utils/macroCalculator';

type MealMacroRingsProps = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  goals?: MacroGoalTargets;
};

function pct(current: number, goal: number) {
  if (goal <= 0) return 0;
  return Math.round((current / goal) * 100);
}

export function MealMacroRings({ calories, protein, carbs, fat, goals }: MealMacroRingsProps) {
  const { macroGoals } = useUser();
  const targets = goals ?? macroGoals;
  const caloriePct = pct(calories, targets.calories);

  return (
    <View style={styles.wrap}>
      <View style={styles.calorieHeader}>
        <Text style={styles.calorieValue}>{calories}</Text>
        <Text style={styles.calorieUnit}>kcal total</Text>
        <Text style={styles.caloriePct}>
          {caloriePct}% of your {targets.calories} kcal daily goal
        </Text>
      </View>

      <View style={styles.macroRow}>
        <MacroRing
          size={88}
          strokeWidth={7}
          progress={protein / targets.protein}
          color={colors.coral}
          label="Protein"
          value={protein}
          goal={targets.protein}
          percentLabel={`${pct(protein, targets.protein)}% goal`}
        />
        <MacroRing
          size={88}
          strokeWidth={7}
          progress={carbs / targets.carbs}
          color={colors.gold}
          label="Carbs"
          value={carbs}
          goal={targets.carbs}
          percentLabel={`${pct(carbs, targets.carbs)}% goal`}
        />
        <MacroRing
          size={88}
          strokeWidth={7}
          progress={fat / targets.fat}
          color={colors.navy}
          label="Fat"
          value={fat}
          goal={targets.fat}
          percentLabel={`${pct(fat, targets.fat)}% goal`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  calorieHeader: {
    alignItems: 'center',
    gap: 2,
  },
  calorieValue: {
    fontSize: 36,
    fontWeight: fontWeights.bold,
    color: colors.navy,
    letterSpacing: -0.5,
  },
  calorieUnit: {
    fontSize: 13,
    fontWeight: fontWeights.medium,
    color: colors.muted,
  },
  caloriePct: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    color: colors.green,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
