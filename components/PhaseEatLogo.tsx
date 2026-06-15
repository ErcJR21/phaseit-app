import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { colors } from '../theme/colors';
import { sizes } from '../theme/spacing';
import { fontWeights } from '../theme/typography';

export type PhaseEatLogoVariant = 'full' | 'compact' | 'icon';

type PhaseEatLogoProps = {
  variant?: PhaseEatLogoVariant;
  /** Full-logo height (splash/onboarding). Figma: splash 100, onboarding 80. */
  height?: number;
  /** Compact mark or icon-only size. Figma header mark: 36. */
  size?: number;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
};

function BowlIcon({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <Ellipse cx="28" cy="44" rx="18" ry="4" fill="rgba(0,0,0,0.07)" />
      <Path
        d="M10 28 C10 38 18 44 28 44 C38 44 46 38 46 28 Z"
        fill="white"
        stroke="#D0C8BE"
        strokeWidth={1}
      />
      <Path
        d="M10.5 29.5 C10.5 29.5 16 32 28 32 C40 32 45.5 29.5 45.5 29.5"
        stroke="#4A7CC9"
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M11.5 32.5 C11.5 32.5 17 35 28 35 C39 35 44.5 32.5 44.5 32.5"
        stroke="#4A7CC9"
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
        opacity={0.4}
      />
      <Path
        d="M9 28 Q9 26.5 10.5 26.5 L45.5 26.5 Q47 26.5 47 28"
        fill="#F0EBE4"
        stroke="#D0C8BE"
        strokeWidth={1}
      />
      <G rotation={-30} originX={20} originY={23}>
        <Ellipse cx={20} cy={23} rx={5} ry={3.5} fill="#5BB85B" />
      </G>
      <G rotation={-30} originX={20} originY={23}>
        <Ellipse cx={20} cy={23} rx={5} ry={3.5} fill="#4DAA4D" opacity={0.6} />
      </G>
      <G rotation={20} originX={33} originY={21}>
        <Ellipse cx={33} cy={21} rx={5.5} ry={3} fill="#6DC26D" />
      </G>
      <G rotation={-10} originX={27} originY={19}>
        <Ellipse cx={27} cy={19} rx={4} ry={2.5} fill="#4DAA4D" />
      </G>
      <Circle cx={25} cy={25} r={4} fill="#FF6B5B" />
      <Circle cx={25} cy={25} r={2.5} fill="#FF5A45" />
      <Circle cx={23.5} cy={23.5} r={1} fill="rgba(255,255,255,0.5)" />
      <G rotation={15} originX={34} originY={26}>
        <Ellipse cx={34} cy={26} rx={3.5} ry={2.5} fill="white" stroke="#E8C4B8" strokeWidth={1} />
      </G>
      <G rotation={15} originX={34} originY={26}>
        <Ellipse cx={34} cy={26} rx={2.2} ry={1.5} fill="rgba(232,196,184,0.5)" />
      </G>
      <Circle cx={28} cy={8} r={7} fill={colors.coral} />
      <Circle cx={28} cy={8} r={3.5} fill="white" />
      <Path d="M28 15 L25 20 Q28 22 31 20 Z" fill={colors.coral} />
    </Svg>
  );
}

function LeafAccent({ size = 14 }: { size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      style={{ marginLeft: 1, marginBottom: size * 0.35 }}
    >
      <Path
        d="M7 12 C7 12 1 8 2 3 C2 3 7 2 11 6 C13 8 12 12 7 12 Z"
        fill={colors.green}
      />
      <Path
        d="M7 12 C7 12 7 7 5 4"
        stroke="#4DAA4D"
        strokeWidth={1}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

function Wordmark({
  fontSize = 32,
  showTagline = false,
}: {
  fontSize?: number;
  showTagline?: boolean;
}) {
  return (
    <View style={styles.wordmarkColumn}>
      <View style={styles.wordmarkRow}>
        <Text style={[styles.wordmarkPhase, { fontSize, lineHeight: fontSize }]}>Phase</Text>
        <Text style={[styles.wordmarkEat, { fontSize, lineHeight: fontSize }]}>Eat</Text>
        <LeafAccent size={Math.round(fontSize * 0.46)} />
      </View>
      {showTagline ? (
        <Text style={[styles.tagline, { fontSize: Math.round(fontSize * 0.38) }]}>
          Your Food Compass
        </Text>
      ) : null}
    </View>
  );
}

/** Full logo with tagline — splash & onboarding (Figma PhaseItFullLogo). */
export function PhaseEatFullLogo({
  height = sizes.logoOnboardingHeight,
  style,
}: {
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const bowlSize = Math.round(height * 0.85);
  const fontSize = Math.round(height * 0.42);

  return (
    <View
      style={[styles.fullLogo, { height, gap: Math.round(height * 0.18) }, style]}
      accessibilityRole="image"
      accessibilityLabel="PhaseEat — Your Food Compass"
    >
      <BowlIcon size={bowlSize} />
      <Wordmark fontSize={fontSize} showTagline />
    </View>
  );
}

/** Compact mark — bowl + wordmark, no tagline (Figma PhaseItLogoMark). */
export function PhaseEatLogoMark({
  size = sizes.logoMarkSize,
  style,
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const bowlSize = Math.round(size * 1.1);
  const fontSize = Math.round(size * 0.5);

  return (
    <View
      style={[styles.markLogo, { gap: Math.round(size * 0.25) }, style]}
      accessibilityRole="image"
      accessibilityLabel="PhaseEat"
    >
      <BowlIcon size={bowlSize} />
      <Wordmark fontSize={fontSize} showTagline={false} />
    </View>
  );
}

export function PhaseEatLogo({
  variant = 'compact',
  height,
  size,
  maxWidth,
  style,
}: PhaseEatLogoProps) {
  const wrapStyle = [styles.wrap, maxWidth != null ? { maxWidth } : null, style];

  if (variant === 'full') {
    return (
      <View style={wrapStyle}>
        <PhaseEatFullLogo height={height ?? sizes.logoOnboardingHeight} />
      </View>
    );
  }

  if (variant === 'icon') {
    const iconSize = size ?? sizes.logoIcon;
    return (
      <View style={wrapStyle} accessibilityRole="image" accessibilityLabel="PhaseEat">
        <BowlIcon size={iconSize} />
      </View>
    );
  }

  return (
    <View style={wrapStyle}>
      <PhaseEatLogoMark size={size ?? sizes.logoMarkSize} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexShrink: 1,
  },
  fullLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  markLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  wordmarkColumn: {
    gap: 1,
    flexShrink: 1,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  wordmarkPhase: {
    fontWeight: fontWeights.bold,
    color: colors.navy,
    letterSpacing: -0.5,
  },
  wordmarkEat: {
    fontWeight: fontWeights.bold,
    color: colors.coral,
    letterSpacing: -0.5,
  },
  tagline: {
    fontWeight: fontWeights.medium,
    color: colors.muted,
    letterSpacing: 0.2,
    marginTop: 1,
  },
});
