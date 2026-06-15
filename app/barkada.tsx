import { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { PhaseEatLogo } from '../components/PhaseEatLogo';
import { Pressable } from 'react-native';
import { BarkadaChallengesTab } from '../components/barkada/BarkadaChallengesTab';
import {
  CHALLENGES,
  FEED_ITEMS,
  GROUP_MEALS,
  LEVEL_EXP_GOAL,
  USER_LEVEL,
  type BarkadaTabKey,
  type Challenge,
  type GroupMeal,
} from '../components/barkada/barkadaData';
import { BarkadaExpToast } from '../components/barkada/BarkadaExpToast';
import { BarkadaFeedTab } from '../components/barkada/BarkadaFeedTab';
import { BarkadaGroupsTab } from '../components/barkada/BarkadaGroupsTab';
import { BarkadaLeaderboardTab } from '../components/barkada/BarkadaLeaderboardTab';
import { BarkadaTabs } from '../components/barkada/BarkadaTabs';
import { colors, shadows } from '../theme/colors';
import { layout, radii, sizes, spacing } from '../theme/spacing';
import { fontWeights } from '../theme/typography';

function BarkadaLogoMark() {
  return <PhaseEatLogo variant="compact" size={sizes.logoMarkSize} />;
}

export default function BarkadaScreen() {
  const { width } = useWindowDimensions();
  const contentMaxWidth = Math.min(width, 560);

  const [activeTab, setActiveTab] = useState<BarkadaTabKey>('feed');
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [groupMeals, setGroupMeals] = useState<GroupMeal[]>(GROUP_MEALS);
  const [challenges, setChallenges] = useState<Challenge[]>(CHALLENGES);
  const [userExp, setUserExp] = useState(740);
  const [toastExp, setToastExp] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);

  const triggerExpToast = useCallback((amount: number) => {
    setToastExp(amount);
    setToastVisible(true);
    setUserExp((current) => current + amount);
    setTimeout(() => setToastVisible(false), 1800);
  }, []);

  const toggleLike = useCallback(
    (id: string) => {
      setLikedItems((current) => {
        const next = new Set(current);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
          triggerExpToast(5);
        }
        return next;
      });
    },
    [triggerExpToast],
  );

  const toggleJoinMeal = useCallback(
    (id: string) => {
      setGroupMeals((current) =>
        current.map((meal) => {
          if (meal.id !== id) return meal;
          if (!meal.joined) triggerExpToast(10);
          return { ...meal, joined: !meal.joined };
        }),
      );
    },
    [triggerExpToast],
  );

  const toggleJoinChallenge = useCallback(
    (id: string) => {
      setChallenges((current) =>
        current.map((challenge) => {
          if (challenge.id !== id) return challenge;
          if (!challenge.joined) triggerExpToast(15);
          return { ...challenge, joined: !challenge.joined };
        }),
      );
    },
    [triggerExpToast],
  );

  const xpPct = Math.min(100, Math.round((userExp / LEVEL_EXP_GOAL) * 100));

  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <BarkadaFeedTab
            items={FEED_ITEMS}
            likedItems={likedItems}
            onLike={toggleLike}
            onSeeLeaderboard={() => setActiveTab('leaderboard')}
          />
        );
      case 'groups':
        return <BarkadaGroupsTab meals={groupMeals} onToggleJoin={toggleJoinMeal} />;
      case 'challenges':
        return (
          <BarkadaChallengesTab challenges={challenges} onToggleJoin={toggleJoinChallenge} />
        );
      case 'leaderboard':
        return <BarkadaLeaderboardTab currentUserExp={userExp} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.page, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
        <BarkadaExpToast amount={toastExp} visible={toastVisible} />

        <View style={styles.header}>
          <View style={styles.headerTop}>
            <BarkadaLogoMark />
            <Pressable style={styles.bellButton} accessibilityRole="button" accessibilityLabel="Notifications">
              <Bell size={20} color={colors.navy} strokeWidth={2} />
              <View style={styles.bellDot} />
            </Pressable>
          </View>

          <View style={styles.titleRow}>
            <View style={styles.titleCopy}>
              <Text style={styles.title}>Barkada</Text>
              <Text style={styles.subtitle}>Eat together, grow together</Text>
            </View>
            <View style={styles.levelBlock}>
              <Text style={styles.levelText}>
                Lv.{USER_LEVEL} • {userExp} EXP
              </Text>
              <View style={styles.levelTrack}>
                <View style={[styles.levelFill, { width: `${xpPct}%` }]} />
              </View>
            </View>
          </View>
        </View>

        <BarkadaTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderTabContent()}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    flex: 1,
  },
  header: {
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  logoMark: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  logoEmoji: {
    fontSize: 18,
  },
  logoPin: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
    shadowOpacity: 0.08,
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.coral,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  titleCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: fontWeights.bold,
    color: colors.navy,
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: fontWeights.medium,
    color: colors.muted,
  },
  levelBlock: {
    alignItems: 'flex-end',
    minWidth: 96,
  },
  levelText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.gold,
  },
  levelTrack: {
    width: 96,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.track,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  levelFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.coral,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingX,
    paddingBottom: spacing.xxxl,
  },
});
