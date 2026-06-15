import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BottomNav, TabKey } from './components/BottomNav';
import { ExpToast } from './components/ExpToast';
import CameraScreen, { type MealLogResult } from './CameraScreen';
import { ExpProvider } from './context/ExpContext';
import { BarkadaProvider } from './context/BarkadaContext';
import { BudgetProvider, useBudget } from './context/BudgetContext';
import { MacroProvider } from './context/MacroContext';
import { useUser } from './context/UserContext';
import {
  applyMealToSummaryStats,
  INITIAL_SUMMARY_STATS,
  MEAL_LOG_EXP,
} from './data/dailyMacros';
import { useMealLog } from './MealLog';
import { Dashboard } from './screens/Dashboard';
import BarkadaScreen from './app/barkada';
import MealPlanScreen from './app/meal-plan';
import { JarScreen } from './screens/JarScreen';
import MapScreen from './screens/MapScreen';
import { MealHistoryScreen } from './screens/MealHistoryScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ConfirmMealScreen } from './screens/ConfirmMealScreen';
import { SetMacroGoalsScreen } from './screens/SetMacroGoalsScreen';
import { SplashScreen } from './screens/SplashScreen';
import { colors } from './theme/colors';
import {
  detectedMealToLogResult,
  mealLogResultToDetectedMeal,
  type DetectedMeal,
} from './types/detectedMeal';

export default function App() {
  return (
    <MacroProvider>
      <ExpProvider>
        <BarkadaProvider>
          <BudgetProvider>
            <PhaseEatApp />
          </BudgetProvider>
        </BarkadaProvider>
      </ExpProvider>
    </MacroProvider>
  );
}

function AppDataSync() {
  const { fromSetup } = useLocalSearchParams<{ fromSetup?: string }>();
  const { reloadFromStorage: reloadBudget } = useBudget();
  const { reloadFromStorage: reloadUserGoals } = useUser();

  useFocusEffect(
    useCallback(() => {
      void reloadBudget();
      // Goals were just saved in-memory during goal setup — avoid reloading stale data.
      if (fromSetup !== '1') {
        void reloadUserGoals();
      }
    }, [reloadBudget, reloadUserGoals, fromSetup]),
  );

  return null;
}

function PhaseEatApp() {
  const { fromSetup } = useLocalSearchParams<{ fromSetup?: string }>();
  const skipSplash = fromSetup === '1';
  const [showSplash, setShowSplash] = useState(!skipSplash);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [showCamera, setShowCamera] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showJar, setShowJar] = useState(false);
  const [showMealPlan, setShowMealPlan] = useState(false);
  const [showMacroGoals, setShowMacroGoals] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Lunch logged! Nice choice!');
  const [summaryStats, setSummaryStats] = useState(INITIAL_SUMMARY_STATS);
  const [pendingMeal, setPendingMeal] = useState<DetectedMeal | null>(null);
  const { logMealFromScan } = useMealLog();
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const workspaceOpacity = useRef(new Animated.Value(0)).current;
  const workspaceTranslateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (skipSplash) {
      setShowSplash(false);
      workspaceOpacity.setValue(1);
      workspaceTranslateY.setValue(0);
    }
  }, [skipSplash, workspaceOpacity, workspaceTranslateY]);

  useEffect(() => {
    if (showSplash) return;

    Animated.parallel([
      Animated.timing(workspaceOpacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(workspaceTranslateY, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [showSplash, workspaceOpacity, workspaceTranslateY]);

  const handleAnalysisComplete = (result: MealLogResult) => {
    setShowCamera(false);
    setPendingMeal(mealLogResultToDetectedMeal(result));
  };

  const handleConfirmMeal = (meal: DetectedMeal) => {
    const foodName = logMealFromScan(detectedMealToLogResult(meal));
    setSummaryStats((prev) => applyMealToSummaryStats(prev));
    setToastMessage(`${foodName} logged! Nice choice!`);
    setPendingMeal(null);
    setActiveTab('home');
    setShowToast(true);
  };

  const handleGetStarted = () => {
    Animated.timing(splashOpacity, {
      toValue: 0,
      duration: 320,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setShowSplash(false);
    });
  };

  if (showSplash) {
    return (
      <>
        <StatusBar style="dark" />
        <Animated.View style={[styles.splashLayer, { opacity: splashOpacity }]}>
          <SplashScreen onGetStarted={handleGetStarted} />
        </Animated.View>
      </>
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <Dashboard
            summaryStats={summaryStats}
            onLogMeal={() => setShowCamera(true)}
            onOpenBarkada={() => setActiveTab('barkada')}
            onOpenFoodMap={() => setShowMap(true)}
            onOpenHistory={() => setActiveTab('history')}
            onOpenProfile={() => setActiveTab('profile')}
            onOpenJar={() => setShowJar(true)}
            onOpenMealPlan={() => setShowMealPlan(true)}
          />
        );
      case 'barkada':
        return <BarkadaScreen />;
      case 'history':
        return <MealHistoryScreen onLogMeal={() => setShowCamera(true)} />;
      case 'profile':
        return <ProfileScreen onOpenMacroGoals={() => setShowMacroGoals(true)} />;
      default:
        return null;
    }
  };

  return (
    <Animated.View
      style={[
        styles.app,
        {
          opacity: workspaceOpacity,
          transform: [{ translateY: workspaceTranslateY }],
        },
      ]}
    >
      <AppDataSync />
      <StatusBar style="dark" />
      <View style={styles.screen}>{renderScreen()}</View>

      {activeTab === 'home' && showToast && (
        <ExpToast
          message={toastMessage}
          exp={MEAL_LOG_EXP}
          onDismiss={() => setShowToast(false)}
        />
      )}

      {!showMap && !showJar && !showMealPlan && !pendingMeal && !showMacroGoals && (
        <BottomNav activeTab={activeTab} onTabPress={setActiveTab} />
      )}

      <Modal
        visible={showMap}
        animationType="slide"
        onRequestClose={() => setShowMap(false)}
      >
        <MapScreen onClose={() => setShowMap(false)} />
      </Modal>

      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}
      >
        <CameraScreen
          onClose={() => setShowCamera(false)}
          onUploadComplete={handleAnalysisComplete}
        />
      </Modal>

      <Modal
        visible={pendingMeal !== null}
        animationType="slide"
        onRequestClose={() => setPendingMeal(null)}
      >
        {pendingMeal ? (
          <ConfirmMealScreen
            detectedMeal={pendingMeal}
            onConfirm={handleConfirmMeal}
            onCancel={() => setPendingMeal(null)}
          />
        ) : null}
      </Modal>

      <Modal
        visible={showMacroGoals}
        animationType="slide"
        onRequestClose={() => setShowMacroGoals(false)}
      >
        <SetMacroGoalsScreen onClose={() => setShowMacroGoals(false)} />
      </Modal>

      <Modal
        visible={showJar}
        animationType="slide"
        onRequestClose={() => setShowJar(false)}
      >
        <JarScreen onClose={() => setShowJar(false)} />
      </Modal>

      <Modal
        visible={showMealPlan}
        animationType="slide"
        onRequestClose={() => setShowMealPlan(false)}
      >
        <MealPlanScreen onClose={() => setShowMealPlan(false)} />
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  splashLayer: {
    flex: 1,
  },
  app: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
  },
});
