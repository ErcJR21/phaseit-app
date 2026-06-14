import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadows } from '../theme/colors';

type ExpToastProps = {
  message: string;
  exp: number;
  onDismiss?: () => void;
};

export function ExpToast({ message, exp, onDismiss }: ExpToastProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.icon}>
          <Text style={styles.iconEmoji}>🍛</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.exp}>+{exp} exp</Text>
        </View>
        <Pressable onPress={onDismiss} hitSlop={12}>
          <Text style={styles.close}>×</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    ...shadows.card,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 22,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
  },
  exp: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.green,
  },
  close: {
    fontSize: 22,
    color: colors.muted,
    lineHeight: 24,
    paddingHorizontal: 4,
  },
});
