import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Heart, MessageCircle, Trophy, Zap } from 'lucide-react-native';
import { colors, shadows } from '../../theme/colors';
import { layout, radii, spacing } from '../../theme/spacing';
import { fontWeights } from '../../theme/typography';
import {
  FEED_TYPE_COLORS,
  FEED_TYPE_LABELS,
  type FeedItem,
} from './barkadaData';

type BarkadaFeedTabProps = {
  items: FeedItem[];
  likedItems: Set<string>;
  onLike: (id: string) => void;
  onSeeLeaderboard?: () => void;
};

export function BarkadaFeedTab({
  items,
  likedItems,
  onLike,
  onSeeLeaderboard,
}: BarkadaFeedTabProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.banner}>
        <Trophy size={16} color={colors.gold} strokeWidth={2} />
        <View style={styles.bannerCopy}>
          <Text style={styles.bannerTitle}>Ate Bea leads this week </Text>
          <Text style={styles.bannerSubtitle}>with 61 meals & Lv.7</Text>
        </View>
        <Pressable
          style={styles.bannerAction}
          onPress={onSeeLeaderboard}
          accessibilityRole="button"
          accessibilityLabel="See all leaderboard"
        >
          <Text style={styles.bannerLink}>See all</Text>
          <ChevronRight size={12} color={colors.coral} strokeWidth={2.5} />
        </Pressable>
      </View>

      {items.map((item) => {
        const liked = likedItems.has(item.id);
        const typeColor = FEED_TYPE_COLORS[item.type];
        const likeCount = item.likes + (liked ? 1 : 0);

        return (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarEmoji}>{item.avatar}</Text>
                </View>
                <View style={[styles.avatarBadge, { backgroundColor: typeColor }]}>
                  <Text style={styles.avatarBadgeEmoji}>{item.emoji}</Text>
                </View>
              </View>

              <View style={styles.body}>
                <Text style={styles.message}>
                  <Text style={styles.name}>{item.user}</Text> {item.detail}
                  {item.meal ? <Text style={styles.meal}> — {item.meal}</Text> : null}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={[styles.tag, { color: typeColor, backgroundColor: `${typeColor}18` }]}>
                    {FEED_TYPE_LABELS[item.type]}
                  </Text>
                  <Text style={styles.time}>{item.time}</Text>
                </View>
                <View style={styles.expRow}>
                  <Zap size={12} color={colors.gold} fill={colors.gold} strokeWidth={0} />
                  <Text style={styles.expText}>+{item.exp} EXP earned</Text>
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => onLike(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Like ${item.user}'s activity`}
                >
                  <Heart
                    size={16}
                    color={liked ? colors.coral : colors.muted}
                    fill={liked ? colors.coral : 'transparent'}
                    strokeWidth={2}
                  />
                  <Text style={[styles.likeCount, liked && styles.likeCountActive]}>{likeCount}</Text>
                </Pressable>
                <Pressable
                  style={styles.actionButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Comment on ${item.user}'s activity`}
                >
                  <MessageCircle size={16} color={colors.muted} strokeWidth={2} />
                </Pressable>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.card,
    shadowOpacity: 0.06,
  },
  bannerCopy: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    color: colors.navy,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: colors.muted,
  },
  bannerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  bannerLink: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    color: colors.coral,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
    shadowOpacity: 0.06,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  avatarWrap: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarBadgeEmoji: {
    fontSize: 10,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.navy,
  },
  name: {
    fontWeight: fontWeights.bold,
  },
  meal: {
    fontWeight: fontWeights.semibold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tag: {
    fontSize: 10,
    fontWeight: fontWeights.semibold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  time: {
    fontSize: 11,
    color: colors.muted,
  },
  expRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  expText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.gold,
  },
  actions: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    fontSize: 11,
    color: colors.muted,
  },
  likeCountActive: {
    color: colors.coral,
  },
});
