import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Clock, Home, User, Users } from 'lucide-react-native';
import { colors } from '../theme/colors';

export type TabKey = 'home' | 'history' | 'barkada' | 'profile';

type BottomNavProps = {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
};

const tabs: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'history', label: 'History', icon: Clock },
  { key: 'barkada', label: 'Barkada', icon: Users },
  { key: 'profile', label: 'Profile', icon: User },
];

export function BottomNav({ activeTab, onTabPress }: BottomNavProps) {
  return (
    <View style={styles.bar}>
      {tabs.map(({ key, label, icon: Icon }) => {
        const active = activeTab === key;
        return (
          <Pressable
            key={key}
            style={styles.tab}
            onPress={() => onTabPress(key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Icon
              size={22}
              color={active ? colors.coral : colors.muted}
              strokeWidth={active ? 2.4 : 2}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.track,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.muted,
  },
  labelActive: {
    fontWeight: '600',
    color: colors.coral,
  },
});
