import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Calendar, MapPin, ThumbsUp, Trophy, UserPlus } from 'lucide-react-native';
import { ActivityFeedCard } from '../components/barkada/ActivityFeedCard';
import { BarkadaTabs } from '../components/barkada/BarkadaTabs';
import { LeaderboardBanner } from '../components/barkada/LeaderboardBanner';
import { PhaseItLogo } from '../components/PhaseItLogo';
import { MOCK_INVITE_LINK, useBarkada } from '../context/BarkadaContext';
import { getLevelProgress } from '../data/exp';
import { SAMPLE_RESTAURANTS } from '../data/restaurants';
import { activityTagColors, components } from '../theme/designSystem';
import { colors, shadows } from '../theme/colors';
import { layout, radii, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const USER_AVATARS = {
  Camille: '👩🏽',
  Rico: '👨🏽',
  'Ate Bea': '👩🏻',
  'Kuya Pat': '👨🏻',
  You: '🧑',
};

function getRestaurantById(restaurantId) {
  return SAMPLE_RESTAURANTS.find((restaurant) => restaurant.id === restaurantId);
}

function formatRestaurantName(restaurantId) {
  const restaurant = getRestaurantById(restaurantId);
  if (restaurant) return restaurant.name;

  return restaurantId.replace(/-/g, ' ');
}

function inferActivityMeta(action) {
  const normalized = action.toLowerCase();

  if (normalized.includes('meal') || normalized.includes('logged')) {
    return {
      tag: 'Meal Logged',
      tagColor: activityTagColors.meal,
      badge: '🍛',
      badgeColor: colors.green,
    };
  }

  if (normalized.includes('streak')) {
    return {
      tag: 'Streak',
      tagColor: activityTagColors.streak,
      badge: '🔥',
      badgeColor: colors.coral,
    };
  }

  if (normalized.includes('budget')) {
    return {
      tag: 'Budget Win',
      tagColor: activityTagColors.budget,
      badge: '💰',
      badgeColor: colors.navy,
    };
  }

  if (normalized.includes('voted')) {
    return {
      tag: 'Vote',
      tagColor: activityTagColors.challenge,
      badge: '👍',
      badgeColor: colors.gold,
    };
  }

  if (normalized.includes('challenge')) {
    return {
      tag: 'Challenge',
      tagColor: activityTagColors.challenge,
      badge: '🏆',
      badgeColor: colors.gold,
    };
  }

  return {
    tag: 'Activity',
    tagColor: colors.muted,
    badge: '✨',
    badgeColor: colors.green,
  };
}

function mapFeedItemToActivity(item) {
  const meta = inferActivityMeta(item.action);

  return {
    id: item.id,
    avatar: USER_AVATARS[item.user] ?? '🧑',
    badge: meta.badge,
    badgeColor: meta.badgeColor,
    name: item.user,
    action: item.action,
    detail: item.detail,
    imageUri: item.imageUri,
    tag: meta.tag,
    tagColor: meta.tagColor,
    timeAgo: item.timestamp,
    exp: item.exp,
    reactions: Math.max(1, Math.floor(item.exp / 5)),
  };
}

function InviteToast({ visible, onDismiss }) {
  if (!visible) return null;

  return (
    <View style={styles.toastWrap}>
      <View style={styles.toastCard}>
        <Text style={typography.toastMessage}>Invite link copied to clipboard!</Text>
        <Pressable onPress={onDismiss} hitSlop={12}>
          <Text style={styles.toastClose}>×</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FeedView({ feed, leaderboard, onSeeLeaderboard }) {
  const activities = useMemo(() => feed.map(mapFeedItemToActivity), [feed]);
  const leader = leaderboard[0];

  const renderItem = useCallback(
    ({ item }) => <ActivityFeedCard activity={item} />,
    [],
  );

  return (
    <FlatList
      data={activities}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.feedList}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.feedHeader}>
          {leader ? (
            <LeaderboardBanner
              leaderName={leader.name}
              meals={Math.max(1, Math.round(leader.totalExp / 12))}
              level={Math.max(1, Math.floor(leader.totalExp / 100) + 1)}
              onSeeAll={onSeeLeaderboard}
            />
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No activity yet. Earn EXP to populate your feed.</Text>
        </View>
      }
    />
  );
}

function LeaderboardView({ leaderboard }) {
  const renderItem = useCallback(({ item, index }) => {
    const rank = index + 1;

    return (
      <View style={[styles.leaderboardRow, item.isCurrentUser && styles.leaderboardRowYou]}>
        <View style={[styles.rankCircle, rank === 1 && styles.rankCircleFirst]}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>
        <View style={styles.leaderboardCopy}>
          <Text style={styles.leaderboardName}>{item.name}</Text>
          <Text style={styles.leaderboardMeta}>
            Lv.{Math.max(1, Math.floor(item.totalExp / 100) + 1)}
            {item.isCurrentUser ? ' · You' : ''}
          </Text>
        </View>
        <Text style={styles.leaderboardExp}>{item.totalExp} EXP</Text>
      </View>
    );
  }, []);

  const leader = leaderboard[0];

  return (
    <FlatList
      data={leaderboard}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.leaderboardList}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        leader ? (
          <LeaderboardBanner
            leaderName={leader.name}
            meals={Math.max(1, Math.round(leader.totalExp / 12))}
            level={Math.max(1, Math.floor(leader.totalExp / 100) + 1)}
          />
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No leaderboard data yet.</Text>
        </View>
      }
    />
  );
}

function GroupsView({ groups, trips, sortedRestaurants, castVote, onInvite }) {
  const renderRestaurant = useCallback(
    ({ item, index }) => {
      const { id, votes: voteCount, restaurant } = item;
      const name = restaurant?.name ?? formatRestaurantName(id);

      return (
        <View style={[styles.voteCard, index === 0 && styles.voteCardTop]}>
          {index === 0 ? (
            <View style={styles.topPickBadge}>
              <Text style={styles.topPickText}>Top Pick</Text>
            </View>
          ) : null}

          <View style={styles.voteCardHeader}>
            <Text style={styles.voteName} numberOfLines={2}>
              {name}
            </Text>
            {restaurant ? <Text style={styles.votePrice}>₱{restaurant.price}</Text> : null}
          </View>

          {restaurant ? (
            <Text style={styles.voteMeta}>
              {restaurant.isOpen ? 'Open Now' : 'Closed'} · {restaurant.tags.join(' · ')}
            </Text>
          ) : null}

          <Pressable
            style={styles.voteButton}
            onPress={() => castVote(id, name)}
            accessibilityRole="button"
            accessibilityLabel={`Vote for ${name}`}
          >
            <ThumbsUp size={14} color={colors.white} strokeWidth={2} />
            <Text style={styles.voteButtonText}>Vote</Text>
            <View style={styles.voteCountBadge}>
              <Text style={styles.voteCountText}>{voteCount}</Text>
            </View>
          </Pressable>
        </View>
      );
    },
    [castVote],
  );

  return (
    <FlatList
      data={sortedRestaurants}
      keyExtractor={(item) => item.id}
      renderItem={renderRestaurant}
      contentContainerStyle={styles.groupsList}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.groupsHeader}>
          <Pressable style={styles.inviteButton} onPress={onInvite}>
            <UserPlus size={18} color={colors.navy} strokeWidth={2} />
            <Text style={styles.inviteButtonText}>Invite Friends</Text>
          </Pressable>

          <Text style={typography.sectionTitle}>Your Groups</Text>
          <View style={styles.groupCards}>
            {groups.map((group) => (
              <View key={group.id} style={styles.groupCard}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupMeta}>{group.members.length} members</Text>
                <Text style={styles.groupMembers}>{group.members.join(', ')}</Text>
              </View>
            ))}
          </View>

          <Text style={typography.sectionTitle}>Upcoming Food Trips</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tripStrip}
          >
            {trips.map((trip) => (
              <View key={trip.id} style={styles.tripCard}>
                <View style={styles.tripRow}>
                  <Calendar size={14} color={colors.coral} strokeWidth={2} />
                  <Text style={styles.tripLabel}>Date</Text>
                  <Text style={styles.tripValue}>{trip.date}</Text>
                </View>
                <View style={styles.tripDivider} />
                <View style={styles.tripRow}>
                  <MapPin size={14} color={colors.green} strokeWidth={2} />
                  <Text style={styles.tripLabel}>Location</Text>
                  <Text style={styles.tripValue}>{trip.location}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <Text style={typography.sectionTitle}>Vote for Your Next Spot</Text>
          <Text style={typography.subtitle}>Sorted by votes — top pick stays on top.</Text>
        </View>
      }
    />
  );
}

function ChallengesView() {
  return (
    <View style={styles.placeholderWrap}>
      <View style={styles.emptyCard}>
        <View style={styles.challengeIconWrap}>
          <Trophy size={22} color={colors.gold} strokeWidth={2.2} />
        </View>
        <Text style={typography.sectionTitle}>Challenges coming soon</Text>
        <Text style={styles.emptyText}>
          Team up with your barkada on weekly goals and bonus EXP rewards.
        </Text>
      </View>
    </View>
  );
}

export function BarkadaScreen() {
  const { feed, leaderboard, groups, trips, votes, castVote } = useBarkada();
  const [activeTab, setActiveTab] = useState('feed');
  const [inviteToastVisible, setInviteToastVisible] = useState(false);

  const currentUser = useMemo(
    () => leaderboard.find((user) => user.isCurrentUser),
    [leaderboard],
  );

  const levelProgress = useMemo(
    () => getLevelProgress(currentUser?.totalExp ?? 0),
    [currentUser],
  );

  const sortedRestaurants = useMemo(
    () =>
      Object.entries(votes)
        .map(([id, voteCount]) => ({
          id,
          votes: voteCount,
          restaurant: getRestaurantById(id),
        }))
        .sort((a, b) => b.votes - a.votes),
    [votes],
  );

  useEffect(() => {
    if (!inviteToastVisible) return undefined;

    const timer = setTimeout(() => setInviteToastVisible(false), 2800);
    return () => clearTimeout(timer);
  }, [inviteToastVisible]);

  const handleInviteFriends = async () => {
    await Clipboard.setStringAsync(MOCK_INVITE_LINK);
    setInviteToastVisible(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <FeedView
            feed={feed}
            leaderboard={leaderboard}
            onSeeLeaderboard={() => setActiveTab('leaderboard')}
          />
        );
      case 'groups':
        return (
          <GroupsView
            groups={groups}
            trips={trips}
            sortedRestaurants={sortedRestaurants}
            castVote={castVote}
            onInvite={handleInviteFriends}
          />
        );
      case 'challenges':
        return <ChallengesView />;
      case 'leaderboard':
        return <LeaderboardView leaderboard={leaderboard} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <PhaseItLogo />
        <View style={styles.expBadge}>
          <Text style={typography.expBadge}>+{currentUser?.totalExp ?? 0} EXP</Text>
        </View>
      </View>

      <View style={styles.titleBlock}>
        <Text style={typography.pageTitle}>Barkada</Text>
        <Text style={typography.subtitle}>Eat together, grow together</Text>
        <Text style={typography.levelText}>
          Lv.{levelProgress.level} · {currentUser?.totalExp ?? 0} EXP
        </Text>
      </View>

      <BarkadaTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <View style={styles.tabContent}>{renderTabContent()}</View>

      <InviteToast visible={inviteToastVisible} onDismiss={() => setInviteToastVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.sm,
  },
  expBadge: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  titleBlock: {
    paddingHorizontal: layout.screenPaddingX,
    gap: spacing.xs,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  tabContent: {
    flex: 1,
    marginTop: spacing.md,
  },
  feedList: {
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  feedHeader: {
    marginBottom: spacing.xs,
  },
  leaderboardList: {
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginHorizontal: layout.screenPaddingX,
    gap: spacing.md,
    ...shadows.card,
  },
  leaderboardRowYou: {
    backgroundColor: colors.greenTint15,
    borderWidth: 1,
    borderColor: colors.green,
  },
  rankCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.goldTint15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankCircleFirst: {
    backgroundColor: colors.gold,
  },
  rankText: {
    ...typography.tabPill,
    color: colors.navy,
    fontWeight: '800',
  },
  leaderboardCopy: {
    flex: 1,
    gap: 2,
  },
  leaderboardName: {
    ...typography.quickActionLabel,
  },
  leaderboardMeta: {
    ...typography.timestamp,
  },
  leaderboardExp: {
    ...typography.expEarned,
    fontSize: 13,
  },
  groupsList: {
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  groupsHeader: {
    paddingHorizontal: layout.screenPaddingX,
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.navy,
    borderRadius: radii.lg,
    paddingVertical: 14,
    backgroundColor: colors.white,
    ...shadows.card,
  },
  inviteButtonText: {
    ...typography.quickActionLabel,
  },
  groupCards: {
    gap: spacing.sm,
  },
  groupCard: {
    ...components.cardCompact,
  },
  groupName: {
    ...typography.quickActionLabel,
  },
  groupMeta: {
    ...typography.levelText,
    marginTop: spacing.xs,
  },
  groupMembers: {
    ...typography.subtitle,
    marginTop: 2,
  },
  tripStrip: {
    gap: spacing.sm,
    paddingRight: layout.screenPaddingX,
  },
  tripCard: {
    width: 260,
    ...components.cardCompact,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  tripLabel: {
    width: 58,
    ...typography.pill,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  tripValue: {
    flex: 1,
    ...typography.feedMessage,
    fontWeight: '600',
  },
  tripDivider: {
    height: 1,
    backgroundColor: colors.track,
  },
  voteCard: {
    ...components.cardCompact,
    marginHorizontal: layout.screenPaddingX,
    gap: spacing.sm,
  },
  voteCardTop: {
    backgroundColor: colors.greenTint15,
    borderWidth: 1,
    borderColor: colors.green,
  },
  topPickBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.green,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  topPickText: {
    ...typography.pill,
    color: colors.white,
    textTransform: 'uppercase',
  },
  voteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  voteName: {
    flex: 1,
    ...typography.quickActionLabel,
  },
  votePrice: {
    ...typography.quickActionLabel,
    color: colors.green,
  },
  voteMeta: {
    ...typography.timestamp,
    textTransform: 'capitalize',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    backgroundColor: colors.coral,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.card,
    shadowColor: colors.coral,
    shadowOpacity: 0.25,
  },
  voteButtonText: {
    ...typography.tabPill,
    color: colors.white,
  },
  voteCountBadge: {
    minWidth: 24,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
  },
  voteCountText: {
    ...typography.tabPill,
    color: colors.white,
    fontWeight: '800',
  },
  placeholderWrap: {
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.sm,
  },
  challengeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.goldTint15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    ...components.card,
    marginHorizontal: layout.screenPaddingX,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.subtitle,
    textAlign: 'center',
    lineHeight: 20,
  },
  toastWrap: {
    position: 'absolute',
    left: layout.screenPaddingX,
    right: layout.screenPaddingX,
    bottom: spacing.lg,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  toastClose: {
    fontSize: 22,
    color: colors.muted,
    lineHeight: 24,
    paddingHorizontal: 4,
  },
});
