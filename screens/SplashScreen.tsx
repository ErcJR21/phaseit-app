import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { MapPin, UtensilsCrossed, Wallet } from 'lucide-react-native';
import { colors, shadows } from '../theme/colors';
import { layout, radii, spacing } from '../theme/spacing';
import { fontWeights } from '../theme/typography';

type SplashScreenProps = {
  onGetStarted?: () => void;
};

const features = [
  {
    id: 'log-meals',
    label: 'Log Meals in Seconds',
    icon: UtensilsCrossed,
    iconColor: '#7A8A99',
    iconBg: 'rgba(122, 138, 153, 0.12)',
  },
  {
    id: 'find-food',
    label: 'Find Food Near You',
    icon: MapPin,
    iconColor: colors.coral,
    iconBg: colors.coralTint15,
  },
  {
    id: 'budget-picks',
    label: 'Budget-Aware Picks',
    icon: Wallet,
    iconColor: colors.gold,
    iconBg: colors.goldTint15,
  },
] as const;

function SplashLogo() {
  return (
    <View style={styles.logoBlock}>
      <View style={styles.logoMarkWrap}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🍲</Text>
        </View>
        <View style={styles.pinBadge}>
          <MapPin size={14} color={colors.white} strokeWidth={2.5} fill={colors.coral} />
        </View>
      </View>

      <Text style={styles.wordmark}>
        <Text style={styles.wordmarkPhase}>Phase</Text>
        <Text style={styles.wordmarkIt}>It</Text>
      </Text>

      <Text style={styles.tagline}>Eat Smart. Stay on Track. We've Got You.</Text>
    </View>
  );
}

export function SplashScreen({ onGetStarted }: SplashScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.blobTopRight} />
      <View style={styles.blobLeft} />
      <View style={styles.blobBottomRight} />

      <View style={styles.content}>
        <SplashLogo />

        <View style={styles.featureList}>
          {features.map(({ id, label, icon: Icon, iconColor, iconBg }) => (
            <View key={id} style={styles.featureCard}>
              <View style={[styles.featureIconWrap, { backgroundColor: iconBg }]}>
                <Icon size={20} color={iconColor} strokeWidth={2.2} />
              </View>
              <Text style={styles.featureLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerBlock}>
          <Pressable
            style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
            onPress={onGetStarted}
            accessibilityRole="button"
            accessibilityLabel="Let's Get Started"
          >
            <Text style={styles.ctaLabel}>Let's Get Started</Text>
          </Pressable>

          <Text style={styles.footerText}>Built for Filipino students. Made with 🧡 by students.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  blobTopRight: {
    position: 'absolute',
    top: -48,
    right: -56,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.coralTint15,
  },
  blobLeft: {
    position: 'absolute',
    top: '34%',
    left: -64,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.greenTint15,
  },
  blobBottomRight: {
    position: 'absolute',
    bottom: 96,
    right: -32,
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.coralTint10,
  },
  content: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
    justifyContent: 'space-between',
  },
  logoBlock: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  logoMarkWrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  logoEmoji: {
    fontSize: 44,
  },
  pinBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  wordmark: {
    fontSize: 34,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  wordmarkPhase: {
    color: colors.navy,
  },
  wordmarkIt: {
    color: colors.green,
  },
  tagline: {
    fontSize: 13,
    fontWeight: fontWeights.medium,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  featureList: {
    gap: spacing.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    ...shadows.card,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.iconSquare,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: fontWeights.semibold,
    color: colors.navy,
    lineHeight: 20,
  },
  footerBlock: {
    gap: spacing.lg,
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
    backgroundColor: colors.coral,
    borderRadius: radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 4,
  },
  ctaPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: fontWeights.bold,
    color: colors.white,
    letterSpacing: -0.2,
  },
  footerText: {
    fontSize: 11,
    fontWeight: fontWeights.medium,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
