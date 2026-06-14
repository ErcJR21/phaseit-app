import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Trophy } from 'lucide-react-native';
import { colors, shadows } from '../../theme/colors';

type LeaderboardBannerProps = {
  leaderName: string;
  meals: number;
  level: number;
  onSeeAll?: () => void;
};

export function LeaderboardBanner({
  leaderName,
  meals,
  level,
  onSeeAll,
}: LeaderboardBannerProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Trophy size={18} color={colors.gold} strokeWidth={2.2} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.leader}>{leaderName} leads this week</Text>
        <Text style={styles.subtitle}>with {meals} meals & Lv.{level}</Text>
      </View>
      <Pressable onPress={onSeeAll}>
        <Text style={styles.seeAll}>See all</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 24,
    gap: 12,
    ...shadows.card,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.goldTint15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  leader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.muted,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.coral,
  },
});
