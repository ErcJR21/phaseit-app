import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { EXP_REWARDS } from '../data/exp';
import { useExperience } from './ExpContext';

export const MOCK_INVITE_LINK = 'https://phaseeat.app/join/mapua-batch-2026';

const INITIAL_VOTES = {
  'kuya-marios': 3,
  'tita-rosa': 1,
};

const INITIAL_TRIPS = [
  {
    id: 'trip-mapua-june',
    date: 'Tuesday, June 17 · 6:00 PM',
    location: "Kuya Mario's Carinderia",
    status: 'upcoming',
  },
  {
    id: 'trip-canteen-b',
    date: 'Friday, June 20 · 12:30 PM',
    location: 'Canteen B — UP Diliman',
    status: 'upcoming',
  },
];

const INITIAL_GROUPS = [
  {
    id: 'mapua-batch-2026',
    name: 'Mapua Batch 2026',
    members: ['Camille', 'Rico', 'Ate Bea'],
  },
];

const INITIAL_USERS = [
  { id: 'ate-bea', name: 'Ate Bea', totalExp: 740 },
  { id: 'camille', name: 'Camille', totalExp: 420 },
  { id: 'rico', name: 'Rico', totalExp: 380 },
  { id: 'you', name: 'You', totalExp: 0, isCurrentUser: true },
];

const INITIAL_FEED = [
  {
    id: 'feed-1',
    user: 'Camille',
    action: 'logged a meal',
    timestamp: '2m ago',
    exp: 15,
  },
  {
    id: 'feed-2',
    user: 'Rico',
    action: 'hit a 7-day streak',
    timestamp: '45m ago',
    exp: 30,
  },
  {
    id: 'feed-3',
    user: 'Ate Bea',
    action: 'stayed under budget for 5 days',
    timestamp: '2h ago',
    exp: 20,
  },
  {
    id: 'feed-4',
    user: 'Kuya Pat',
    action: 'logged a meal',
    timestamp: '3h ago',
    exp: 15,
  },
];

function createFeedId() {
  return `feed-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function isTripToday(tripDateStr, now = new Date()) {
  const match = tripDateStr.match(/([A-Za-z]+)\s+(\d{1,2})/);
  if (!match) return false;

  const monthName = match[1];
  const day = Number(match[2]);
  const month = new Date(`${monthName} 1, 2000`).getMonth();

  return now.getMonth() === month && now.getDate() === day;
}

function sortUsersByExp(users, currentUserExp) {
  return users
    .map((user) => (user.isCurrentUser ? { ...user, totalExp: currentUserExp } : user))
    .sort((a, b) => b.totalExp - a.totalExp);
}

const BarkadaContext = createContext(null);

export function BarkadaProvider({ children }) {
  const [votes, setVotes] = useState(INITIAL_VOTES);
  const [trips] = useState(INITIAL_TRIPS);
  const [groups] = useState(INITIAL_GROUPS);
  const [users] = useState(INITIAL_USERS);
  const [feed, setFeed] = useState(INITIAL_FEED);
  const { addExperience, exp } = useExperience();

  const appendFeedItem = useCallback((item) => {
    setFeed((current) => [
      {
        id: createFeedId(),
        user: item.user,
        action: item.action,
        timestamp: item.timestamp ?? 'Just now',
        exp: item.exp,
        imageUri: item.imageUri,
        detail: item.detail,
      },
      ...current,
    ]);
  }, []);

  const logMealToFeed = useCallback(
    ({ foodName, imageUri, exp = 15 }) => {
      addExperience(exp);
      appendFeedItem({
        user: 'You',
        action: foodName ? `logged ${foodName}` : 'logged a meal',
        detail: foodName,
        imageUri,
        timestamp: 'Just now',
        exp,
      });
    },
    [addExperience, appendFeedItem],
  );

  const getLeaderboard = useCallback(() => {
    return sortUsersByExp(users, exp);
  }, [users, exp]);

  const leaderboard = useMemo(() => getLeaderboard(), [getLeaderboard]);

  const todayTrips = useMemo(
    () => trips.filter((trip) => trip.status === 'upcoming' && isTripToday(trip.date)),
    [trips],
  );

  const castVote = useCallback(
    (id, restaurantName) => {
      if (!id) return;

      setVotes((current) => ({
        ...current,
        [id]: (current[id] ?? 0) + 1,
      }));

      addExperience(EXP_REWARDS.vote);
      appendFeedItem({
        user: 'You',
        action: restaurantName ? `voted for ${restaurantName}` : 'voted for a restaurant',
        timestamp: 'Just now',
        exp: EXP_REWARDS.vote,
      });
    },
    [addExperience, appendFeedItem],
  );

  const value = useMemo(
    () => ({
      votes,
      trips,
      groups,
      feed,
      leaderboard,
      todayTrips,
      getLeaderboard,
      castVote,
      logMealToFeed,
    }),
    [votes, trips, groups, feed, leaderboard, todayTrips, getLeaderboard, castVote, logMealToFeed],
  );

  return <BarkadaContext.Provider value={value}>{children}</BarkadaContext.Provider>;
}

export function useBarkada() {
  const context = useContext(BarkadaContext);

  if (!context) {
    throw new Error('useBarkada must be used within a BarkadaProvider');
  }

  return context;
}
