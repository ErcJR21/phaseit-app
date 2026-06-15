import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Camera, MapPin, Users, Archive, CalendarDays } from 'lucide-react-native';
import { colors, shadows } from '../theme/colors';

type QuickAction = {
  id: string;
  label: string;
  icon: ReactNode;
  iconBg: string;
  onPress?: () => void;
};

type QuickActionsProps = {
  onLogMeal?: () => void;
  onBarkada?: () => void;
  onFoodMap?: () => void;
  onJar?: () => void;
  onMealPlan?: () => void;
};

export function QuickActions({ onLogMeal, onBarkada, onFoodMap, onJar, onMealPlan }: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      id: 'log-meal',
      label: 'Log Meal',
      icon: <Camera size={24} color={colors.coral} strokeWidth={2} />,
      iconBg: colors.coralTint15,
      onPress: onLogMeal,
    },
    {
      id: 'food-map',
      label: 'Food Map',
      icon: <MapPin size={24} color={colors.green} strokeWidth={2} />,
      iconBg: colors.greenTint15,
      onPress: onFoodMap,
    },
    {
      id: 'barkada',
      label: 'Barkada',
      icon: <Users size={24} color={colors.gold} strokeWidth={2} />,
      iconBg: colors.goldTint15,
      onPress: onBarkada,
    },
    {
      id: 'jar',
      label: 'Jar',
      icon: <Archive size={24} color={colors.navy} strokeWidth={2} />,
      iconBg: colors.navyTint10,
      onPress: onJar,
    },
    {
      id: 'meal-plan',
      label: 'Meal Plan',
      icon: <CalendarDays size={24} color={colors.coral} strokeWidth={2} />,
      iconBg: colors.coralTint10,
      onPress: onMealPlan,
    },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Quick Actions</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {actions.map((action) => (
          <Pressable
            key={action.id}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={action.onPress}
          >
            <View style={[styles.iconWrap, { backgroundColor: action.iconBg }]}>
              {action.icon}
            </View>
            <Text style={styles.label}>{action.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.navy,
  },
  row: {
    gap: 12,
    paddingRight: 24,
  },
  card: {
    width: 108,
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 10,
    ...shadows.card,
  },
  cardPressed: {
    opacity: 0.85,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
    textAlign: 'center',
  },
});
