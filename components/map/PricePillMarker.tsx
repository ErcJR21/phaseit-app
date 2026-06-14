import { StyleSheet, Text, View } from 'react-native';
import { colors, shadows } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import type { Vendor } from '../../data/vendors';

type PricePillMarkerProps = {
  vendor: Vendor;
  selected: boolean;
};

const typeColors: Record<Vendor['type'], string> = {
  carinderia: colors.coral,
  canteen: colors.navy,
  vendor: colors.gold,
  fastfood: colors.green,
};

export function PricePillMarker({ vendor, selected }: PricePillMarkerProps) {
  const accent = selected ? colors.coral : typeColors[vendor.type];

  return (
    <View style={[styles.wrap, selected && styles.wrapSelected]}>
      <View style={[styles.pill, { backgroundColor: accent }, selected && styles.pillSelected]}>
        <Text style={styles.emoji}>{vendor.emoji}</Text>
        <Text style={styles.price}>₱{vendor.startingPrice}</Text>
      </View>
      {selected && <View style={styles.pointer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  wrapSelected: {
    transform: [{ scale: 1.12 }],
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.white,
    ...shadows.card,
  },
  pillSelected: {
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  emoji: {
    fontSize: 12,
  },
  price: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  pointer: {
    width: 8,
    height: 8,
    backgroundColor: colors.coral,
    transform: [{ rotate: '45deg' }],
    marginTop: -4,
    borderRadius: 1,
  },
});
