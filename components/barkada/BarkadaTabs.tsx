import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, shadows } from '../../theme/colors';
import { layout, radii, spacing } from '../../theme/spacing';
import { fontWeights } from '../../theme/typography';
import type { BarkadaTabKey } from './barkadaData';

type BarkadaTabsProps = {
  activeTab: BarkadaTabKey;
  onTabChange: (tab: BarkadaTabKey) => void;
};

const tabs: { key: BarkadaTabKey; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'groups', label: 'Groups' },
  { key: 'challenges', label: 'Challenges' },
  { key: 'leaderboard', label: 'Leaderboard' },
];

export function BarkadaTabs({ activeTab, onTabChange }: BarkadaTabsProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.key;

          return (
            <Pressable
              key={tab.key}
              style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
              onPress={() => onTabChange(tab.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tab.label}
            >
              <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: layout.screenPaddingX,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: radii.pill,
    minHeight: 32,
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: colors.gold,
  },
  pillInactive: {
    backgroundColor: colors.white,
    ...shadows.card,
    shadowOpacity: 0.06,
  },
  label: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
  },
  labelActive: {
    color: colors.navy,
  },
  labelInactive: {
    color: colors.muted,
  },
});
