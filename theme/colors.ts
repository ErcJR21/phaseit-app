export const colors = {
  background: '#F5EDE1',
  backgroundMuted: '#E8E4DF',
  navy: '#0F1E3A',
  muted: '#8E8E93',
  coral: '#FF7A66',
  green: '#43B06A',
  gold: '#FFC857',
  white: '#FFFFFF',
  track: '#E5E5EA',
  avatarBg: '#E5E5EA',

  coralTint15: 'rgba(255, 122, 102, 0.15)',
  coralTint10: 'rgba(255, 122, 102, 0.1)',
  greenTint15: 'rgba(67, 176, 106, 0.15)',
  goldTint15: 'rgba(255, 200, 87, 0.15)',
  navyTint10: 'rgba(15, 30, 58, 0.1)',

  /** Camera / overlay surfaces from Log Meal screen */
  aiPillBg: 'rgba(15, 30, 58, 0.65)',
  positionPillBg: 'rgba(67, 176, 106, 0.85)',
  viewfinder: '#0F1E3A',
} as const;

export const shadows = {
  card: {
    shadowColor: '#0F1E3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;
