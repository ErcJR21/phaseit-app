export type BarkadaTabKey = 'feed' | 'groups' | 'challenges' | 'leaderboard';

export type FeedItemType = 'meal' | 'streak' | 'challenge' | 'budget';

export type FeedItem = {
  id: string;
  user: string;
  avatar: string;
  type: FeedItemType;
  meal?: string;
  emoji: string;
  detail: string;
  time: string;
  exp: number;
  likes: number;
};

export type GroupMeal = {
  id: string;
  title: string;
  place: string;
  time: string;
  emoji: string;
  members: string[];
  slots: number;
  joined: boolean;
  priceRange: string;
};

export type ChallengeDifficulty = 'Easy' | 'Medium' | 'Hard';

export type Challenge = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  expReward: number;
  badgeReward?: string;
  progress: number;
  goal: number;
  daysLeft: number;
  participants: number;
  joined: boolean;
  type: 'budget' | 'veggie' | 'streak' | 'social';
  difficulty: ChallengeDifficulty;
};

export type LeaderboardPeriod = 'This Week' | 'This Month' | 'All Time';
export type LeaderboardSortKey = 'exp' | 'meals' | 'streak';

export type LeaderboardEntry = {
  rank: number;
  name: string;
  avatar: string;
  level: number;
  exp: number;
  meals: number;
  streak: number;
  isMe?: boolean;
};

export const FEED_ITEMS: FeedItem[] = [
  {
    id: '1',
    user: 'Camille',
    avatar: '👩🏽',
    type: 'meal',
    meal: 'Adobo sa Gata',
    emoji: '🍛',
    detail: 'logged a meal',
    time: '2m ago',
    exp: 15,
    likes: 3,
  },
  {
    id: '2',
    user: 'Rico',
    avatar: '👨🏽',
    type: 'streak',
    emoji: '🔥',
    detail: 'hit a 7-day streak!',
    time: '45m ago',
    exp: 30,
    likes: 7,
  },
  {
    id: '3',
    user: 'Ate Bea',
    avatar: '👩🏻',
    type: 'budget',
    emoji: '💰',
    detail: 'stayed under budget for 5 days',
    time: '2h ago',
    exp: 20,
    likes: 5,
  },
  {
    id: '4',
    user: 'Kuya Pat',
    avatar: '👨🏻',
    type: 'meal',
    meal: 'Sinangag + Itlog',
    emoji: '🍳',
    detail: 'logged a meal',
    time: '3h ago',
    exp: 15,
    likes: 1,
  },
  {
    id: '5',
    user: 'Camille',
    avatar: '👩🏽',
    type: 'challenge',
    emoji: '🏆',
    detail: 'completed the Veggie Week challenge!',
    time: '5h ago',
    exp: 50,
    likes: 12,
  },
  {
    id: '6',
    user: 'Rico',
    avatar: '👨🏽',
    type: 'meal',
    meal: 'Sinigang na Baboy',
    emoji: '🥣',
    detail: 'logged a meal',
    time: '6h ago',
    exp: 15,
    likes: 2,
  },
];

export const GROUP_MEALS: GroupMeal[] = [
  {
    id: '1',
    title: 'Lunch sa Canteen B',
    place: 'Canteen B – UP Diliman',
    time: 'Today, 12:00 PM',
    emoji: '🍽️',
    members: ['👩🏽', '👨🏽', '👩🏻'],
    slots: 5,
    joined: true,
    priceRange: '₱60–₱90',
  },
  {
    id: '2',
    title: 'Merienda Run',
    place: 'Jollibee near Gate 2',
    time: 'Today, 4:00 PM',
    emoji: '🍟',
    members: ['👩🏻'],
    slots: 4,
    joined: false,
    priceRange: '₱50–₱80',
  },
  {
    id: '3',
    title: 'Dinner Study Sesh',
    place: "Rodic's Diner",
    time: 'Tomorrow, 6:30 PM',
    emoji: '🌃',
    members: ['👨🏻', '👩🏽'],
    slots: 6,
    joined: false,
    priceRange: '₱70–₱120',
  },
];

export const CHALLENGES: Challenge[] = [
  {
    id: '1',
    title: 'Budget Heroes',
    emoji: '💰',
    description: 'Keep your daily spend under ₱70 for 7 consecutive days.',
    expReward: 50,
    progress: 5,
    goal: 7,
    daysLeft: 2,
    participants: 4,
    joined: true,
    type: 'budget',
    difficulty: 'Medium',
  },
  {
    id: '2',
    title: 'Veggie Week',
    emoji: '🥦',
    description: 'Log at least one vegetable dish every day for 7 days.',
    expReward: 60,
    badgeReward: '🌿 Green Eater',
    progress: 3,
    goal: 7,
    daysLeft: 4,
    participants: 3,
    joined: true,
    type: 'veggie',
    difficulty: 'Medium',
  },
  {
    id: '3',
    title: '5-Day Streak',
    emoji: '🔥',
    description: 'Log every meal for 5 days straight without missing a day.',
    expReward: 40,
    progress: 0,
    goal: 5,
    daysLeft: 5,
    participants: 6,
    joined: false,
    type: 'streak',
    difficulty: 'Easy',
  },
  {
    id: '4',
    title: 'Barkada Bonding',
    emoji: '🤝',
    description: 'Coordinate 3 group meals with your squad this week.',
    expReward: 80,
    badgeReward: '🤝 Squad Leader',
    progress: 1,
    goal: 3,
    daysLeft: 6,
    participants: 2,
    joined: false,
    type: 'social',
    difficulty: 'Hard',
  },
];

export const LEADERBOARD_DATA: LeaderboardEntry[] = [
  {
    rank: 1,
    name: 'Ate Bea',
    avatar: '👩🏻',
    level: 7,
    exp: 1240,
    meals: 61,
    streak: 14,
  },
  {
    rank: 2,
    name: 'Naomi',
    avatar: '👩🏽',
    level: 6,
    exp: 740,
    meals: 42,
    streak: 8,
    isMe: true,
  },
  {
    rank: 3,
    name: 'Rico',
    avatar: '👨🏽',
    level: 5,
    exp: 620,
    meals: 38,
    streak: 5,
  },
  {
    rank: 4,
    name: 'Kuya Pat',
    avatar: '👨🏻',
    level: 4,
    exp: 480,
    meals: 29,
    streak: 3,
  },
  {
    rank: 5,
    name: 'Camille',
    avatar: '👩🏽',
    level: 4,
    exp: 410,
    meals: 25,
    streak: 2,
  },
];

export const FEED_TYPE_COLORS = {
  meal: '#43B06A',
  streak: '#FF7A66',
  challenge: '#FFC857',
  budget: '#0F1E3A',
} as const;

export const FEED_TYPE_LABELS = {
  meal: 'Meal Logged',
  streak: 'Streak',
  challenge: 'Challenge',
  budget: 'Budget Win',
} as const;

export const DIFFICULTY_COLORS = {
  Easy: '#43B06A',
  Medium: '#FFC857',
  Hard: '#FF7A66',
} as const;

export const USER_LEVEL = 6;
export const LEVEL_EXP_GOAL = 1000;
