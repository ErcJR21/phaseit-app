import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { isGuestUser, useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { GoalSetupScreen } from '../screens/GoalSetupScreen';
import { completeGoalSetup, HOME_AFTER_SETUP_ROUTE, skipGoalSetup } from '../services/goalSetupService';
import type { GoalSetupSelections } from '../utils/goalSetupCalculator';
import { colors } from '../theme/colors';

export default function GoalSetupRoute() {
  const { user, isGuest, refreshProfile } = useAuth();
  const { saveGoals } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const guestSession = isGuest || isGuestUser(user);

  const finishSetup = useCallback(
    async (selections: GoalSetupSelections) => {
      if (!user || isSubmitting) return;

      setIsSubmitting(true);

      try {
        await completeGoalSetup({
          userId: user.id,
          isGuest: guestSession,
          selections,
          saveGoals,
          refreshProfile,
        });
        router.replace(HOME_AFTER_SETUP_ROUTE);
      } catch (error) {
        console.warn('[GoalSetup] Failed to complete setup:', error);
        Alert.alert(
          'Setup failed',
          error instanceof Error
            ? error.message
            : 'We could not save your setup. Please check your connection and try again.',
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, isSubmitting, guestSession, saveGoals, refreshProfile],
  );

  const handleSkip = useCallback(async () => {
    if (!user || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await skipGoalSetup({
        userId: user.id,
        isGuest: guestSession,
        saveGoals,
        refreshProfile,
      });
      router.replace(HOME_AFTER_SETUP_ROUTE);
    } catch (error) {
      console.warn('[GoalSetup] Failed to skip setup:', error);
      Alert.alert(
        'Setup failed',
        error instanceof Error
          ? error.message
          : 'We could not save your default setup. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [user, isSubmitting, guestSession, saveGoals, refreshProfile]);

  return (
    <View style={styles.container}>
      <GoalSetupScreen
        onComplete={finishSetup}
        onSkip={handleSkip}
        isSubmitting={isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
