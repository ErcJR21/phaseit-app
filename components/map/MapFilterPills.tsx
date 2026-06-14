import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MACRO_TAG_OPTIONS } from '../../data/vendors';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';

type MapFilterPillsProps = {
  activeFilters: string[];
  onToggleFilter: (filter: string) => void;
  resultCount: number;
};

export function MapFilterPills({
  activeFilters,
  onToggleFilter,
  resultCount,
}: MapFilterPillsProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {MACRO_TAG_OPTIONS.map((filter) => {
          const active = activeFilters.includes(filter.key);

          return (
            <Pressable
              key={filter.key}
              style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
              onPress={() => onToggleFilter(filter.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${active ? 'Remove' : 'Apply'} ${filter.label} filter`}
            >
              <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{resultCount} spots</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  row: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.lg,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  pillActive: {
    backgroundColor: colors.coral,
  },
  pillInactive: {
    backgroundColor: colors.track,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.white,
  },
  labelInactive: {
    color: colors.muted,
  },
  countBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.navyTint10,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.navy,
  },
});
