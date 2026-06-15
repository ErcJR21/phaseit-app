import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  Bell,
  CalendarDays,
  Camera,
  ChevronRight,
  Flame,
  Heart,
  HelpCircle,
  LogOut,
  Settings,
  Shield,
  Star,
  Wallet,
} from 'lucide-react-native';
import { PhaseEatLogoMark } from '../components/PhaseEatLogo';
import { useAuth } from '../context/AuthContext';
import { BUDGET_HERO_STREAK, useBudget } from '../context/BudgetContext';
import { useExperience } from '../context/ExpContext';
import { useMacros } from '../context/MacroContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { layout, radii, spacing } from '../theme/spacing';
import { fontWeights } from '../theme/typography';
import { calculateMealSummary } from '../utils/mealHistoryHelpers';

const BADGE_DEFINITIONS = [
  { id: 'streak', emoji: '🔥', label: '7-Day Streak', check: (ctx) => ctx.streak >= 7 },
  {
    id: 'budget',
    emoji: '💰',
    label: 'Budget Master',
    check: (ctx) => ctx.daysUnderBudget >= BUDGET_HERO_STREAK,
  },
  { id: 'veggie', emoji: '🥦', label: 'Veggie Lover', check: () => false, comingSoon: true },
  { id: 'meals', emoji: '📸', label: '50 Meals Logged', check: (ctx) => ctx.totalMeals >= 50 },
  { id: 'barkada', emoji: '🏆', label: 'Barkada Champ', check: () => false, comingSoon: true },
  { id: 'level', emoji: '⭐', label: 'Level 10', check: (ctx) => ctx.level >= 10 },
];

const QUICK_LINKS = [
  {
    id: 'meal-plan',
    icon: CalendarDays,
    label: 'Meal Plan',
    subtitle: 'Plan your weekly meals',
    color: colors.coral,
    implemented: true,
  },
  {
    id: 'notifications',
    icon: Bell,
    label: 'Notifications',
    subtitle: 'Meal reminders, streaks',
    color: colors.gold,
    implemented: false,
  },
  {
    id: 'privacy',
    icon: Shield,
    label: 'Privacy',
    subtitle: 'Who can see your meals',
    color: colors.green,
    implemented: false,
  },
  {
    id: 'help',
    icon: HelpCircle,
    label: 'Help & Support',
    subtitle: 'FAQs, contact us',
    color: colors.navy,
    implemented: false,
  },
];

function formatPeso(amount) {
  return `₱${Math.round(amount).toLocaleString('en-PH')}`;
}

function formatDisplayName(emailPrefix) {
  return emailPrefix
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function calculateBudgetSaved(meals, dailyAllowance) {
  const spentByDate = {};

  for (const meal of meals) {
    spentByDate[meal.date] = (spentByDate[meal.date] ?? 0) + meal.price;
  }

  return Object.values(spentByDate).reduce((sum, spent) => {
    if (spent < dailyAllowance) {
      return sum + (dailyAllowance - spent);
    }
    return sum;
  }, 0);
}

function showComingSoon(feature) {
  Alert.alert('Coming soon', `${feature} is still in progress. Check back in a future update.`);
}

function StatCard({ icon: Icon, iconColor, value, label }) {
  return (
    <View style={styles.statCard}>
      <Icon size={20} color={iconColor} strokeWidth={2} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickLinkRow({ item, isFirst, onPress }) {
  const Icon = item.icon;

  return (
    <Pressable
      style={({ pressed }) => [styles.quickLinkRow, pressed && styles.quickLinkPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.label}
    >
      {!isFirst ? <View style={styles.quickLinkDivider} /> : null}
      <View style={styles.quickLinkContent}>
        <View style={[styles.quickLinkIconWrap, { backgroundColor: `${item.color}18` }]}>
          <Icon size={16} color={item.color} strokeWidth={2} />
        </View>
        <View style={styles.quickLinkCopy}>
          <Text style={styles.quickLinkLabel}>{item.label}</Text>
          <Text style={styles.quickLinkSubtitle}>{item.subtitle}</Text>
        </View>
        <ChevronRight size={16} color={colors.muted} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

export function ProfileScreen({ onOpenMealPlan, onOpenJar }) {
  const { user } = useAuth();
  const { profile } = useUser();
  const { exp, levelProgress } = useExperience();
  const { meals } = useMacros();
  const { dailyAllowance, daysUnderBudget } = useBudget();
  const [notificationsOn] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const mealSummary = useMemo(() => calculateMealSummary(meals), [meals]);
  const budgetSaved = useMemo(
    () => calculateBudgetSaved(meals, dailyAllowance),
    [meals, dailyAllowance],
  );

  const badgeContext = useMemo(
    () => ({
      streak: mealSummary.streak,
      daysUnderBudget,
      totalMeals: mealSummary.totalMeals,
      level: levelProgress.level,
    }),
    [mealSummary, daysUnderBudget, levelProgress.level],
  );

  const badges = useMemo(
    () =>
      BADGE_DEFINITIONS.map((badge) => ({
        ...badge,
        earned: badge.check(badgeContext),
      })),
    [badgeContext],
  );

  const earnedBadgeCount = badges.filter((badge) => badge.earned).length;
  const progressPercent = Math.round(levelProgress.progress * 100);
  const expGoal = levelProgress.isMaxLevel
    ? levelProgress.expTotal
    : levelProgress.expInLevel + levelProgress.expToNext;

  const emailPrefix = user?.email?.split('@')[0] ?? '';
  const displayName = emailPrefix ? formatDisplayName(emailPrefix) : 'Student User';
  const handle = emailPrefix ? `@${emailPrefix}` : '@student';
  const avatarEmoji = profile.gender === 'male' ? '👨🏽' : '👩🏽';

  const handleQuickLink = (item) => {
    if (item.id === 'meal-plan') {
      onOpenMealPlan?.();
      return;
    }

    showComingSoon(item.label);
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    setLoggingOut(false);

    if (error) {
      Alert.alert('Sign out failed', error.message);
      return;
    }

    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <PhaseEatLogoMark size={36} />
        <Pressable
          style={styles.settingsButton}
          onPress={() => showComingSoon('Settings')}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Settings size={20} color={colors.navy} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
              </View>
              <Pressable
                style={styles.cameraButton}
                onPress={() => showComingSoon('Profile photo')}
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
              >
                <Camera size={12} color={colors.navy} strokeWidth={2.5} />
              </Pressable>
            </View>

            <View style={styles.profileCopy}>
              <Text style={styles.displayName}>{displayName}</Text>
              <Text style={styles.handle}>
                {handle} · Level {levelProgress.level}
              </Text>
              <View style={styles.streakRow}>
                <Flame size={14} color={colors.coral} strokeWidth={2.2} />
                <Text style={styles.streakText}>
                  {mealSummary.streak > 0
                    ? `${mealSummary.streak}-day streak`
                    : 'Start your streak today'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.expHeader}>
            <Text style={styles.expLabel}>EXP</Text>
            <Text style={styles.expValue}>
              {levelProgress.isMaxLevel ? exp : levelProgress.expInLevel} / {expGoal}
            </Text>
          </View>
          <View style={styles.expTrack}>
            <View style={[styles.expFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.expHint}>
            {levelProgress.isMaxLevel
              ? 'Max level reached — keep exploring!'
              : `${levelProgress.expToNext} EXP to Level ${levelProgress.level + 1}`}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            icon={Camera}
            iconColor={colors.coral}
            value={String(mealSummary.totalMeals)}
            label="Meals"
          />
          <StatCard
            icon={Wallet}
            iconColor={colors.green}
            value={formatPeso(budgetSaved)}
            label="Saved"
          />
          <StatCard
            icon={Star}
            iconColor={colors.gold}
            value={String(earnedBadgeCount)}
            label="Badges"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.sectionMeta}>
              {earnedBadgeCount}/{badges.length}
            </Text>
          </View>
          <View style={styles.badgeGrid}>
            {badges.map((badge) => (
              <View
                key={badge.id}
                style={[styles.badgeCard, !badge.earned && styles.badgeCardLocked]}
              >
                <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                <Text style={styles.badgeLabel}>{badge.label}</Text>
                {badge.comingSoon && !badge.earned ? (
                  <Text style={styles.badgeSoon}>Soon</Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.budgetCard}>
          <View>
            <Text style={styles.budgetLabel}>Daily Budget</Text>
            <Text style={styles.budgetAmount}>{formatPeso(dailyAllowance)}</Text>
          </View>
          <Pressable
            style={styles.budgetEditButton}
            onPress={() => onOpenJar?.()}
            accessibilityRole="button"
            accessibilityLabel="Edit daily budget"
          >
            <Text style={styles.budgetEditLabel}>Edit</Text>
          </Pressable>
        </View>

        <View style={styles.quickLinksCard}>
          {QUICK_LINKS.map((item, index) => (
            <QuickLinkRow
              key={item.id}
              item={item}
              isFirst={index === 0}
              onPress={() => handleQuickLink(item)}
            />
          ))}
        </View>

        <View style={styles.toggleCard}>
          <View style={styles.toggleCopy}>
            <View style={[styles.quickLinkIconWrap, { backgroundColor: colors.goldTint15 }]}>
              <Bell size={16} color={colors.gold} strokeWidth={2} />
            </View>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.toggleLabel}>Meal Reminders</Text>
              <Text style={styles.toggleSoon}>Work in progress</Text>
            </View>
          </View>
          <Switch
            value={notificationsOn}
            onValueChange={() => showComingSoon('Meal reminders')}
            trackColor={{ false: colors.track, true: colors.green }}
            thumbColor={colors.white}
            accessibilityLabel="Meal reminders toggle"
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.parentPortalCard, pressed && styles.cardPressed]}
          onPress={() => showComingSoon('Parent Portal')}
          accessibilityRole="button"
          accessibilityLabel="Parent Portal"
        >
          <View style={styles.parentPortalIcon}>
            <Heart size={16} color={colors.white} strokeWidth={2} />
          </View>
          <View style={styles.parentPortalCopy}>
            <Text style={styles.parentPortalTitle}>Parent Portal</Text>
            <Text style={styles.parentPortalSubtitle}>
              Share high-level updates with a parent
            </Text>
          </View>
          <ChevronRight size={16} color={colors.muted} strokeWidth={2} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && styles.cardPressed]}
          onPress={() => void handleLogout()}
          disabled={loggingOut}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          {loggingOut ? (
            <ActivityIndicator color={colors.coral} />
          ) : (
            <>
              <LogOut size={16} color={colors.coral} strokeWidth={2} />
              <Text style={styles.logoutLabel}>Log Out</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const cardShadow = {
  shadowColor: colors.navy,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

const profileCardShadow = {
  shadowColor: colors.navy,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 3,
};

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
    paddingBottom: spacing.lg,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenPaddingX,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.xl,
    ...profileCardShadow,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.coral,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  cameraButton: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  profileCopy: {
    flex: 1,
    gap: 2,
  },
  displayName: {
    fontSize: 20,
    fontWeight: fontWeights.bold,
    color: colors.navy,
  },
  handle: {
    fontSize: 13,
    fontWeight: fontWeights.medium,
    color: colors.muted,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    color: colors.coral,
  },
  expHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  expLabel: {
    fontSize: 12,
    fontWeight: fontWeights.medium,
    color: colors.muted,
  },
  expValue: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    color: colors.navy,
  },
  expTrack: {
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  expFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.coral,
  },
  expHint: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    ...cardShadow,
  },
  statValue: {
    fontSize: 16,
    fontWeight: fontWeights.bold,
    color: colors.navy,
  },
  statLabel: {
    fontSize: 11,
    color: colors.muted,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
    color: colors.navy,
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    color: colors.coral,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  badgeCard: {
    width: '30%',
    flexGrow: 1,
    flexBasis: '28%',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    ...cardShadow,
  },
  badgeCardLocked: {
    opacity: 0.4,
  },
  badgeEmoji: {
    fontSize: 24,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: fontWeights.semibold,
    color: colors.navy,
    textAlign: 'center',
  },
  badgeSoon: {
    fontSize: 9,
    fontWeight: fontWeights.semibold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  budgetCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...cardShadow,
  },
  budgetLabel: {
    fontSize: 13,
    color: colors.muted,
  },
  budgetAmount: {
    fontSize: 22,
    fontWeight: fontWeights.bold,
    color: colors.navy,
    marginTop: 2,
  },
  budgetEditButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.coralTint10,
  },
  budgetEditLabel: {
    fontSize: 13,
    fontWeight: fontWeights.semibold,
    color: colors.coral,
  },
  quickLinksCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...cardShadow,
  },
  quickLinkRow: {
    position: 'relative',
  },
  quickLinkPressed: {
    backgroundColor: colors.track,
  },
  quickLinkDivider: {
    position: 'absolute',
    top: 0,
    left: spacing.lg,
    right: spacing.lg,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.track,
  },
  quickLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  quickLinkIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLinkCopy: {
    flex: 1,
    gap: 2,
  },
  quickLinkLabel: {
    fontSize: 14,
    fontWeight: fontWeights.semibold,
    color: colors.navy,
  },
  quickLinkSubtitle: {
    fontSize: 12,
    color: colors.muted,
  },
  toggleCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...cardShadow,
  },
  toggleCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: fontWeights.semibold,
    color: colors.navy,
  },
  toggleTextWrap: {
    gap: 2,
  },
  toggleSoon: {
    fontSize: 11,
    color: colors.muted,
  },
  parentPortalCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...cardShadow,
  },
  parentPortalIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
  },
  parentPortalCopy: {
    flex: 1,
    gap: 2,
  },
  parentPortalTitle: {
    fontSize: 14,
    fontWeight: fontWeights.bold,
    color: colors.navy,
  },
  parentPortalSubtitle: {
    fontSize: 12,
    color: colors.muted,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.coralTint10,
    minHeight: 48,
  },
  logoutLabel: {
    fontSize: 14,
    fontWeight: fontWeights.bold,
    color: colors.coral,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
