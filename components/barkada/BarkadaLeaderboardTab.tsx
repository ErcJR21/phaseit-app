import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Flame, Trophy, Zap } from 'lucide-react-native';
import { colors, shadows } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { fontWeights } from '../../theme/typography';
import {
  LEADERBOARD_DATA,
  type LeaderboardEntry,
  type LeaderboardPeriod,
  type LeaderboardSortKey,
} from './barkadaData';

type BarkadaLeaderboardTabProps = {
  currentUserExp: number;
};

export function BarkadaLeaderboardTab({ currentUserExp }: BarkadaLeaderboardTabProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('This Week');
  const [sortBy, setSortBy] = useState<LeaderboardSortKey>('exp');

  const sorted = useMemo(() => {
    const data = LEADERBOARD_DATA.map((entry) =>
      entry.isMe ? { ...entry, exp: currentUserExp } : entry,
    );

    return [...data]
      .sort((a, b) => b[sortBy] - a[sortBy])
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [currentUserExp, sortBy]);

  const podium = [sorted[1], sorted[0], sorted[2]].filter(Boolean) as LeaderboardEntry[];

  return (
    <View style={styles.wrap}>
      <View style={styles.periodRow}>
        {(['This Week', 'This Month', 'All Time'] as LeaderboardPeriod[]).map((value) => {
          const active = period === value;
          return (
            <Pressable
              key={value}
              style={[styles.periodPill, active && styles.periodPillActive]}
              onPress={() => setPeriod(value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.periodLabel, active && styles.periodLabelActive]}>{value}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sortRow}>
        <Text style={styles.sortPrefix}>Sort by:</Text>
        {(['exp', 'meals', 'streak'] as LeaderboardSortKey[]).map((key) => {
          const active = sortBy === key;
          const label = key === 'exp' ? 'EXP' : key === 'meals' ? 'Meals' : 'Streak';
          return (
            <Pressable
              key={key}
              style={[styles.sortPill, active && styles.sortPillActive]}
              onPress={() => setSortBy(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.sortLabel, active && styles.sortLabelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.podiumRow}>
        {podium.map((user) => {
          const podiumHeight = user.rank === 1 ? 112 : user.rank === 2 ? 80 : 64;
          const podiumColor =
            user.rank === 1 ? colors.gold : user.rank === 2 ? colors.track : 'rgba(205,127,50,0.25)';

          return (
            <View key={user.rank} style={styles.podiumCol}>
              <View style={styles.podiumAvatarWrap}>
                <View
                  style={[
                    styles.podiumAvatar,
                    user.isMe && { borderWidth: 3, borderColor: colors.coral },
                  ]}
                >
                  <Text style={styles.podiumAvatarEmoji}>{user.avatar}</Text>
                </View>
                {user.rank <= 3 ? (
                  <View style={[styles.podiumBadge, { backgroundColor: podiumColor }]}>
                    <Text style={styles.podiumBadgeEmoji}>
                      {user.rank === 1 ? '👑' : user.rank === 2 ? '🥈' : '🥉'}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.podiumName, user.isMe && styles.podiumNameYou]} numberOfLines={1}>
                {user.name}
              </Text>
              <View style={[styles.podiumBar, { height: podiumHeight, backgroundColor: podiumColor }]}>
                <Text style={styles.podiumValue}>
                  {sortBy === 'exp' ? `${user.exp}` : sortBy === 'meals' ? `${user.meals}` : `${user.streak}d`}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.list}>
        {sorted.map((user) => (
          <View
            key={`${user.name}-${user.rank}`}
            style={[styles.listRow, user.isMe && styles.listRowYou]}
          >
            <View style={styles.rankCol}>
              {user.rank <= 3 ? (
                <Text style={styles.rankEmoji}>
                  {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}
                </Text>
              ) : (
                <Text style={styles.rankNumber}>#{user.rank}</Text>
              )}
            </View>

            <View
              style={[
                styles.listAvatar,
                user.isMe && { borderWidth: 2, borderColor: colors.coral },
              ]}
            >
              <Text style={styles.listAvatarEmoji}>{user.avatar}</Text>
            </View>

            <View style={styles.listCopy}>
              <View style={styles.listTitleRow}>
                <Text style={[styles.listName, user.isMe && styles.listNameYou]}>
                  {user.name}
                  {user.isMe ? ' (You)' : ''}
                </Text>
                <Text style={styles.listLevel}>Lv.{user.level}</Text>
              </View>
              <View style={styles.listMetaRow}>
                <Zap size={12} color={colors.gold} fill={colors.gold} strokeWidth={0} />
                <Text style={styles.listMeta}>{user.exp} EXP</Text>
                <Text style={styles.listMeta}>·</Text>
                <Text style={styles.listMeta}>{user.meals} meals</Text>
                <Flame size={12} color={colors.coral} strokeWidth={2} />
                <Text style={styles.listMeta}>{user.streak}d</Text>
              </View>
            </View>

            <View style={[styles.valueBadge, user.isMe && styles.valueBadgeYou]}>
              <Text style={[styles.valueBadgeText, user.isMe && styles.valueBadgeTextYou]}>
                {sortBy === 'exp' ? `${user.exp}` : sortBy === 'meals' ? `${user.meals}` : `${user.streak}d`}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.tipCard}>
        <Trophy size={16} color={colors.gold} strokeWidth={2} />
        <Text style={styles.tipText}>
          Leaderboard resets every <Text style={styles.tipStrong}>Monday</Text>. Log meals daily and
          complete challenges to climb the ranks!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  periodPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    ...shadows.card,
    shadowOpacity: 0.06,
  },
  periodPillActive: {
    backgroundColor: colors.navy,
    shadowOpacity: 0,
  },
  periodLabel: {
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    color: colors.muted,
  },
  periodLabelActive: {
    color: colors.white,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sortPrefix: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: fontWeights.medium,
  },
  sortPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sortPillActive: {
    backgroundColor: colors.coralTint15,
    borderColor: 'rgba(255, 122, 102, 0.25)',
  },
  sortLabel: {
    fontSize: 11,
    fontWeight: fontWeights.medium,
    color: colors.muted,
  },
  sortLabelActive: {
    color: colors.coral,
    fontWeight: fontWeights.bold,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  podiumCol: {
    width: 80,
    alignItems: 'center',
    gap: spacing.sm,
  },
  podiumAvatarWrap: {
    position: 'relative',
  },
  podiumAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.track,
  },
  podiumAvatarEmoji: {
    fontSize: 22,
  },
  podiumBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumBadgeEmoji: {
    fontSize: 10,
  },
  podiumName: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.navy,
    textAlign: 'center',
  },
  podiumNameYou: {
    color: colors.coral,
  },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.sm,
  },
  podiumValue: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
    color: colors.navy,
  },
  list: {
    gap: spacing.sm,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 14,
    ...shadows.card,
    shadowOpacity: 0.06,
  },
  listRowYou: {
    backgroundColor: colors.coralTint10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 122, 102, 0.25)',
  },
  rankCol: {
    width: 24,
    alignItems: 'center',
  },
  rankEmoji: {
    fontSize: 16,
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
    color: colors.muted,
  },
  listAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listAvatarEmoji: {
    fontSize: 20,
  },
  listCopy: {
    flex: 1,
    gap: 2,
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  listName: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
    color: colors.navy,
  },
  listNameYou: {
    color: colors.coral,
  },
  listLevel: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.gold,
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  listMeta: {
    fontSize: 11,
    color: colors.muted,
  },
  valueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
  },
  valueBadgeYou: {
    backgroundColor: colors.coralTint15,
  },
  valueBadgeText: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
    color: colors.navy,
  },
  valueBadgeTextYou: {
    color: colors.coral,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.goldTint15,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: colors.navy,
  },
  tipStrong: {
    fontWeight: fontWeights.bold,
  },
});
