/**
 * PhaseIt design system — sourced from PhaseIT_proto (Figma Make).
 * Figma file key: 9eNg7pR7bMo0DkjHijotU6
 * Published preview routes use `/splash`, `/dashboard`, `/log-meal`, etc.
 *
 * Use these tokens for every new screen so the app stays visually consistent.
 */

import { colors, shadows } from './colors';
import { layout, radii, sizes, spacing } from './spacing';
import { typography } from './typography';

export { colors, shadows } from './colors';
export { typography, fontWeights } from './typography';
export { spacing, layout, radii, sizes } from './spacing';

export type PhaseItRoute =
  | '/splash'
  | '/onboarding'
  | '/dashboard'
  | '/log-meal'
  | '/barkada'
  | '/history'
  | '/profile'
  | '/food-map'
  | '/jar'
  | '/meal-plan';

export type ImplementationStatus = 'built' | 'placeholder' | 'not-started';

export type ScreenSpec = {
  route: PhaseItRoute;
  name: string;
  status: ImplementationStatus;
  file?: string;
  notes: string;
};

/** Full app screen map from the Figma Make prototype */
export const screens: ScreenSpec[] = [
  {
    route: '/splash',
    name: 'Splash',
    status: 'built',
    file: 'screens/SplashScreen.tsx',
    notes: 'Logo, feature cards, coral CTA “Let’s Get Started”, student footer. Entry preview-route in Figma Make.',
  },
  {
    route: '/onboarding',
    name: 'Onboarding',
    status: 'not-started',
    notes: 'First-run flow: “Log Meals in Seconds”, “Find Food Near You”, “Budget-Aware Picks”, CTA “Let’s Get Started”.',
  },
  {
    route: '/dashboard',
    name: 'Home Dashboard',
    status: 'built',
    file: 'screens/Dashboard.tsx',
    notes: 'Logo, greeting, macro rings, summary cards, budget card, quick actions, EXP toast, bottom nav.',
  },
  {
    route: '/log-meal',
    name: 'Log Meal (Camera)',
    status: 'built',
    file: 'CameraScreen.tsx',
    notes: 'Navy viewfinder, AI pill, green brackets, position pill, gallery + shutter controls.',
  },
  {
    route: '/confirm-meal',
    name: 'Confirm Meal',
    status: 'built',
    file: 'screens/ConfirmMealScreen.tsx',
    notes: 'AI analysis review — macro rings, ingredient chips, manual edit modal, confirm CTA (+15 EXP).',
  },
  {
    route: '/barkada',
    name: 'Barkada',
    status: 'built',
    file: 'screens/BarkadaScreen.js',
    notes: 'EXP badge, level, Feed/Groups/Challenges/Leaderboard tabs, leaderboard banner, activity feed.',
  },
  {
    route: '/history',
    name: 'History',
    status: 'built',
    file: 'screens/MealHistoryScreen.js',
    notes: 'Bottom nav tab — summary stats, grouped meal timeline, sticky Log a Meal CTA.',
  },
  {
    route: '/profile',
    name: 'Profile',
    status: 'built',
    file: 'screens/ProfileScreen.js',
    notes: 'Avatar, display name, edit profile, saved/suggestions stats, settings menu. Bottom nav tab.',
  },
  {
    route: '/macro-goals',
    name: 'Set Macro Goals',
    status: 'built',
    file: 'screens/SetMacroGoalsScreen.tsx',
    notes: 'Profile flow — BMR/TDEE calculator (Mifflin-St Jeor), manual macro overrides, persisted in UserContext.',
  },
  {
    route: '/food-map',
    name: 'Food Map',
    status: 'built',
    file: 'screens/MapScreen.tsx',
    notes: 'Google Maps canvas, Supabase canteens table, live fetch/insert, search + filter chips, vendor detail sheet.',
  },
  {
    route: '/jar',
    name: 'Jar',
    status: 'built',
    file: 'screens/JarScreen.js',
    notes: 'Daily/weekly allowance toggle, progress card with on-track status, quick-set pills (150–350), and today\'s logged meals with prices.',
  },
  {
    route: '/meal-plan',
    name: 'Meal Plan',
    status: 'not-started',
    notes: 'Quick action — weekly planner. Coral Calendar icon.',
  },
];

export const quickActions = [
  { id: 'log-meal', label: 'Log Meal', route: '/log-meal' as const, iconColor: colors.coral, iconBg: colors.coralTint15 },
  { id: 'food-map', label: 'Food Map', route: '/food-map' as const, iconColor: colors.green, iconBg: colors.greenTint15 },
  { id: 'barkada', label: 'Barkada', route: '/barkada' as const, iconColor: colors.gold, iconBg: colors.goldTint15 },
  { id: 'jar', label: 'Jar', route: '/jar' as const, iconColor: colors.navy, iconBg: colors.navyTint10 },
  { id: 'meal-plan', label: 'Meal Plan', route: '/meal-plan' as const, iconColor: colors.coral, iconBg: colors.coralTint10 },
] as const;

export const bottomNavTabs = [
  { key: 'home', label: 'Home', route: '/dashboard' as const },
  { key: 'history', label: 'History', route: '/history' as const },
  { key: 'barkada', label: 'Barkada', route: '/barkada' as const },
  { key: 'profile', label: 'Profile', route: '/profile' as const },
] as const;

export const barkadaTabs = ['feed', 'groups', 'challenges', 'leaderboard'] as const;

export const activityTagColors = {
  meal: colors.green,
  streak: colors.coral,
  budget: colors.navy,
  challenge: colors.gold,
} as const;

/** Reusable component recipes — match these when building new UI */
export const components = {
  page: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: layout.screenPaddingX,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: layout.cardPadding,
    ...shadows.card,
  },
  cardCompact: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: layout.cardPaddingCompact,
    ...shadows.card,
  },
  pillActive: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  pillInactive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.track,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  iconTile: {
    width: sizes.quickActionIcon,
    height: sizes.quickActionIcon,
    borderRadius: radii.iconSquare,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  progressTrack: {
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.track,
    overflow: 'hidden' as const,
  },
  cameraViewfinder: {
    flex: 1,
    marginHorizontal: layout.cameraViewfinderMarginX,
    borderRadius: radii.xl,
    overflow: 'hidden' as const,
    backgroundColor: colors.navy,
  },
  aiPill: {
    backgroundColor: 'rgba(15, 30, 58, 0.65)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  positionPill: {
    backgroundColor: 'rgba(67, 176, 106, 0.85)',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
} as const;

export const designSystem = {
  colors,
  typography,
  spacing,
  layout,
  radii,
  sizes,
  shadows,
  screens,
  quickActions,
  bottomNavTabs,
  barkadaTabs,
  activityTagColors,
  components,
} as const;
