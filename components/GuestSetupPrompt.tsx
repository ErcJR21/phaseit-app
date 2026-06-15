import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Target } from 'lucide-react-native';
import { colors, shadows } from '../theme/colors';
import { radii, spacing } from '../theme/spacing';
import { fontWeights, typography } from '../theme/typography';

type GuestSetupPromptProps = {
  onPress: () => void;
};

export function GuestSetupPrompt({ onPress }: GuestSetupPromptProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Target size={22} color={colors.green} strokeWidth={2.2} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Set up your daily goals</Text>
        <Text style={styles.subtitle}>
          Tell us about yourself so we can personalize your macro targets and unlock the full
          dashboard.
        </Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Set up your daily goals"
      >
        <Text style={styles.ctaLabel}>Get Started</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.green,
    ...shadows.card,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.greenTint15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    gap: spacing.xs,
  },
  title: {
    ...typography.sectionTitle,
  },
  subtitle: {
    ...typography.subtitle,
    lineHeight: 20,
  },
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
    borderRadius: radii.pill,
    paddingVertical: 14,
  },
  ctaPressed: {
    opacity: 0.92,
  },
  ctaLabel: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
});
