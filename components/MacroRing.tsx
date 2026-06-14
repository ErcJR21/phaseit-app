import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme/colors';
import { fontWeights } from '../theme/typography';

type MacroRingProps = {
  size: number;
  strokeWidth?: number;
  progress: number;
  color: string;
  label: string;
  value: number;
  unit?: string;
  goal?: number;
  percentLabel?: string;
};

export function MacroRing({
  size,
  strokeWidth = 8,
  progress,
  color,
  label,
  value,
  unit = 'g',
  goal,
  percentLabel,
}: MacroRingProps) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clamped);
  const center = size / 2;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>

      <View style={styles.center}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {value}
          <Text style={styles.unit}>{unit}</Text>
        </Text>
        {goal !== undefined ? (
          <Text style={styles.goal}>
            / {goal}
            {unit}
          </Text>
        ) : null}
        {percentLabel ? <Text style={styles.percent}>{percentLabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: fontWeights.semibold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 16,
    fontWeight: fontWeights.bold,
    color: colors.navy,
    marginTop: 2,
  },
  unit: {
    fontSize: 11,
    fontWeight: fontWeights.medium,
    color: colors.muted,
  },
  goal: {
    fontSize: 10,
    fontWeight: fontWeights.medium,
    color: colors.muted,
    marginTop: 1,
  },
  percent: {
    fontSize: 9,
    fontWeight: fontWeights.semibold,
    color: colors.muted,
    marginTop: 2,
  },
});
