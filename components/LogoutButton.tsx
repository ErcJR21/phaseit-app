import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { radii, spacing } from '../theme/spacing';
import { fontWeights } from '../theme/typography';

type LogoutButtonProps = {
  /** Menu row style for profile settings lists; default is a standalone button. */
  variant?: 'button' | 'menu';
  label?: string;
};

export function LogoutButton({ variant = 'button', label = 'Logout' }: LogoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;

    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);

    if (error) {
      console.error('[PhaseEat] signOut error:', error.message);
      Alert.alert('Sign out failed', error.message);
      return;
    }

    router.replace('/login');
  };

  if (variant === 'menu') {
    return (
      <Pressable
        style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
        onPress={() => void handleLogout()}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.coral} />
        ) : (
          <Ionicons name="log-out-outline" size={20} color={colors.coral} />
        )}
        <Text style={[styles.menuItemText, styles.menuItemTextDestructive]}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        loading && styles.buttonDisabled,
      ]}
      onPress={() => void handleLogout()}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={styles.buttonLabel}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.coral,
    borderRadius: radii.pill,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: fontWeights.bold,
    color: colors.white,
    letterSpacing: -0.2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: fontWeights.medium,
    color: colors.navy,
  },
  menuItemTextDestructive: {
    color: colors.coral,
    fontWeight: fontWeights.semibold,
  },
  pressed: {
    opacity: 0.92,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
