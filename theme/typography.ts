import { TextStyle } from 'react-native';
import { colors } from './colors';

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const typography = {
  pageTitle: {
    fontSize: 22,
    fontWeight: fontWeights.bold,
    color: colors.navy,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: fontWeights.semibold,
    color: colors.navy,
  },
  wordmark: {
    fontSize: 18,
    fontWeight: fontWeights.bold,
    color: colors.navy,
    letterSpacing: -0.3,
  },
  budgetAmount: {
    fontSize: 32,
    fontWeight: fontWeights.bold,
    color: colors.navy,
  },
  budgetSuffix: {
    fontSize: 16,
    fontWeight: fontWeights.medium,
    color: colors.muted,
  },
  greeting: {
    fontSize: 13,
    fontWeight: fontWeights.medium,
    color: colors.muted,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: fontWeights.medium,
    color: colors.muted,
  },
  tagline: {
    fontSize: 10,
    fontWeight: fontWeights.medium,
    color: colors.muted,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: fontWeights.semibold,
    color: colors.navy,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: fontWeights.regular,
    color: colors.muted,
  },
  navLabelActive: {
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    color: colors.coral,
  },
  expBadge: {
    fontSize: 15,
    fontWeight: fontWeights.extrabold,
    color: colors.white,
  },
  levelText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.gold,
  },
  feedMessage: {
    fontSize: 13,
    fontWeight: fontWeights.regular,
    color: colors.navy,
    lineHeight: 18,
  },
  feedName: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
    color: colors.navy,
  },
  activityTag: {
    fontSize: 10,
    fontWeight: fontWeights.semibold,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: fontWeights.regular,
    color: colors.muted,
  },
  expEarned: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.gold,
  },
  pill: {
    fontSize: 11,
    fontWeight: fontWeights.semibold,
  },
  tabPill: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
  },
  toastMessage: {
    fontSize: 14,
    fontWeight: fontWeights.semibold,
    color: colors.navy,
  },
  toastExp: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    color: colors.green,
  },
  cameraTitle: {
    fontSize: 16,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
} satisfies Record<string, TextStyle>;
