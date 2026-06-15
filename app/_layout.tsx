import { useEffect, type ReactNode } from 'react';
import { SplashScreen, Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { UserProvider } from '../context/UserContext';
import { useSetupGuard } from '../hooks/useSetupGuard';

SplashScreen.preventAutoHideAsync();

function SetupGate({ children }: { children: ReactNode }) {
  useSetupGuard();
  return children;
}

function RootNavigator() {
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <SetupGate>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="index" />
          <Stack.Screen name="goal-setup" />
          <Stack.Screen name="setup" />
          <Stack.Screen name="dashboard" />
        </Stack.Protected>

        <Stack.Protected guard={!session}>
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    </SetupGate>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <UserProvider>
        <RootNavigator />
      </UserProvider>
    </AuthProvider>
  );
}
