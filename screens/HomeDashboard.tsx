import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PhaseEatLogo } from '../components/PhaseEatLogo';
import { BudgetTracker } from '../components/BudgetTracker';
import { QuickActions } from '../components/QuickActions';
import { colors } from '../theme/colors';
import { sizes } from '../theme/spacing';

type HomeDashboardProps = {
  userName?: string;
  onLogMeal?: () => void;
  onOpenBarkada?: () => void;
  onOpenJar?: () => void;
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function HomeDashboard({
  userName = 'Naomi',
  onLogMeal,
  onOpenBarkada,
  onOpenJar,
}: HomeDashboardProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <PhaseEatLogo variant="compact" size={sizes.logoMarkSize} />
          <Pressable style={styles.profileButton}>
            <View style={styles.profileDot} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.greeting}>
            {getGreeting()}, {userName}! 👋
          </Text>
          <Text style={styles.headline}>
            Kain tayo? Let's log{'\n'}your meal.
          </Text>
        </View>

        <BudgetTracker onPress={onOpenJar} />

        <QuickActions onLogMeal={onLogMeal} onBarkada={onOpenBarkada} />
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
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 8,
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
    gap: 8,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
  },
  headline: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.navy,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
});
