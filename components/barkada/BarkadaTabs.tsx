import { Pressable, StyleSheet, Text, View } from 'react-native';
import { layout, radii, spacing } from '../../theme/spacing';

export type BarkadaTab = 'feed' | 'groups' | 'challenges' | 'leaderboard';

type BarkadaTabsProps = {
  activeTab: BarkadaTab;
  onTabChange: (tab: BarkadaTab) => void;
};

const TAB_ACTIVE_BG = '#F4B400';
const TAB_TEXT = '#000000';
const TAB_BORDER = '#000000';

const tabs: { key: BarkadaTab; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'groups', label: 'Groups' },
  { key: 'challenges', label: 'Challenges' },
  { key: 'leaderboard', label: 'Leaderboard' },
];

export function BarkadaTabs({ activeTab, onTabChange }: BarkadaTabsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
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
              <Text style={styles.label}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: layout.screenPaddingX,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radii.pill,
    minHeight: 36,
  },
  pillActive: {
    backgroundColor: TAB_ACTIVE_BG,
    borderWidth: 1,
    borderColor: TAB_ACTIVE_BG,
  },
  pillInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: TAB_BORDER,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: TAB_TEXT,
    textAlign: 'center',
  },
});
