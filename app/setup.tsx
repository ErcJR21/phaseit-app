import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { UserProvider, useUser } from '../context/UserContext';
import { SetMacroGoalsScreen } from '../screens/SetMacroGoalsScreen';
import { persistUserSetup } from '../services/setupService';
import type { MacroGoalTargets, UserProfile } from '../utils/macroCalculator';
import { colors } from '../theme/colors';

function SetupScreen() {
  const { user, refreshProfile } = useAuth();
  const { saveGoals } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (profile: UserProfile, goals: MacroGoalTargets) => {
      if (!user || isSubmitting) return;

      setIsSubmitting(true);

      try {
        await persistUserSetup({
          userId: user.id,
          profile,
          goals,
        });

        await saveGoals(profile, goals);
        await refreshProfile();
        router.replace('/dashboard');
      } catch (error) {
        console.warn('[SetupScreen] Failed to complete setup:', error);
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
    [user, isSubmitting, saveGoals, refreshProfile],
  );

  return (
    <View style={styles.container}>
      <SetMacroGoalsScreen
        onClose={() => undefined}
        onSubmit={handleSubmit}
        hideBackButton
        submitLabel="Finish Setup"
        isSubmitting={isSubmitting}
      />
    </View>
  );
}

export default function SetupRoute() {
  const { appSessionKey } = useAuth();

  return (
    <UserProvider key={appSessionKey}>
      <SetupScreen />
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
