import { StyleSheet, Text, View } from 'react-native';
import { Zap } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { fontWeights } from '../../theme/typography';

type BarkadaExpToastProps = {
  amount: number;
  visible: boolean;
};

export function BarkadaExpToast({ amount, visible }: BarkadaExpToastProps) {
  if (!visible) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.toast}>
        <Zap size={16} color={colors.white} fill={colors.white} strokeWidth={0} />
        <Text style={styles.label}>+{amount} EXP</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.gold,
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: fontWeights.extrabold,
    color: colors.white,
  },
});
