import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PhaseItLogo } from '../components/PhaseItLogo';
import { BudgetTracker } from '../components/BudgetTracker';
import { QuickActions } from '../components/QuickActions';
import { MacroTracker } from '../components/dashboard/MacroTracker';
import {
  SummaryCards,
  type SummaryStats,
} from '../components/dashboard/SummaryCards';
import { useMacros } from '../context/MacroContext';
import { colors } from '../theme/colors';
import { layout, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export type DashboardProps = {
  userName?: string;
  summaryStats?: SummaryStats;
  onLogMeal?: () => void;
  onOpenBarkada?: () => void;
  onOpenFoodMap?: () => void;
  onOpenHistory?: () => void;
  onOpenProfile?: () => void;
  onOpenJar?: () => void;
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Dashboard({
  userName = 'Naomi',
  summaryStats,
  onLogMeal,
  onOpenBarkada,
  onOpenFoodMap,
  onOpenHistory,
  onOpenProfile,
  onOpenJar,
}: DashboardProps) {
  const { macroStats, isReady, isLoading, resetDailyMacros } = useMacros();

  const handleStartNewDay = () => {
    Alert.alert('Start New Day', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          void resetDailyMacros();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <PhaseItLogo />
          <Pressable
            style={styles.profileButton}
            onPress={onOpenProfile}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
          >
            <View style={styles.profileDot} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.greeting}>
            {getGreeting()}, {userName}! 👋
          </Text>
          <Text style={styles.headline}>
            Kain tayo? Let&apos;s log{'\n'}your meal.
          </Text>
        </View>

        {isReady ? (
          <MacroTracker stats={macroStats} />
        ) : isLoading ? (
          <View style={styles.macroLoadingCard}>
            <ActivityIndicator size="small" color={colors.green} />
            <Text style={styles.macroLoadingText}>Loading today&apos;s macros…</Text>
          </View>
        ) : null}

        {isReady && (
          <Pressable
            style={styles.newDayButton}
            onPress={handleStartNewDay}
            accessibilityRole="button"
            accessibilityLabel="Start new day"
          >
            <Text style={styles.newDayButtonText}>Start New Day</Text>
          </Pressable>
        )}

        {isReady && onOpenHistory && (
          <Pressable
            style={styles.historyButton}
            onPress={onOpenHistory}
            accessibilityRole="button"
            accessibilityLabel="View history"
          >
            <Text style={styles.historyButtonText}>View History</Text>
          </Pressable>
        )}

        <SummaryCards stats={summaryStats} />

        <BudgetTracker onPress={onOpenJar} />

        <QuickActions
          onLogMeal={onLogMeal}
          onBarkada={onOpenBarkada}
          onFoodMap={onOpenFoodMap}
          onJar={onOpenJar}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenPaddingX,
    paddingBottom: spacing.xxl,
    gap: layout.sectionGap,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.coral,
  },
  hero: {
    gap: spacing.sm,
  },
  greeting: {
    ...typography.greeting,
  },
  headline: {
    ...typography.pageTitle,
  },
  macroLoadingCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 220,
  },
  macroLoadingText: {
    fontSize: 13,
    color: colors.muted,
  },
  newDayButton: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.track,
    backgroundColor: colors.white,
  },
  newDayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy,
  },
  historyButton: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.track,
    backgroundColor: colors.white,
  },
  historyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy,
  },
});
