import { StyleSheet, Text, View } from 'react-native';
import { MealThumbnail } from '../MealThumbnail';
import { colors, shadows } from '../../theme/colors';

export type ActivityType = 'meal' | 'streak' | 'budget' | 'challenge';

export type FeedActivity = {
  id: string;
  avatar: string;
  badge: string;
  badgeColor: string;
  name: string;
  action: string;
  detail?: string;
  imageUri?: string;
  tag: string;
  tagColor: string;
  timeAgo: string;
  exp: number;
  reactions: number;
};

type ActivityFeedCardProps = {
  activity: FeedActivity;
};

export function ActivityFeedCard({ activity }: ActivityFeedCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.avatarCol}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>{activity.avatar}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: activity.badgeColor }]}>
          <Text style={styles.badgeEmoji}>{activity.badge}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.bodyTop}>
          <Text style={[styles.message, activity.imageUri && styles.messageWithImage]}>
            <Text style={styles.name}>{activity.name}</Text>
            {' '}
            {activity.action}
            {activity.detail ? (
              <>
                {' '}
                <Text style={styles.detail}>— {activity.detail}</Text>
              </>
            ) : null}
          </Text>
          {activity.imageUri ? <MealThumbnail imageUri={activity.imageUri} /> : null}
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.tag, { color: activity.tagColor }]}>{activity.tag}</Text>
          <Text style={styles.time}>{activity.timeAgo}</Text>
        </View>

        <Text style={styles.exp}>⚡ +{activity.exp} EXP earned</Text>
      </View>

      <View style={styles.reactions}>
        <Text style={styles.reactionCount}>{activity.reactions}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 24,
    gap: 12,
    ...shadows.card,
  },
  avatarCol: {
    width: 44,
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeEmoji: {
    fontSize: 10,
  },
  body: {
    flex: 1,
    gap: 6,
  },
  bodyTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  message: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.navy,
  },
  messageWithImage: {
    paddingRight: 4,
  },
  name: {
    fontWeight: '700',
  },
  detail: {
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tag: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  time: {
    fontSize: 11,
    color: colors.muted,
  },
  exp: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gold,
  },
  reactions: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 20,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.muted,
  },
});
