import { getLocalDateKey } from '../context/MacroContext';

function shiftDateKey(dateKey, dayOffset) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + dayOffset);
  return getLocalDateKey(date);
}

export function getMealCategory(loggedAt) {
  const date = new Date(loggedAt);
  const hour = date.getHours();

  if (hour < 11) return 'Breakfast';
  if (hour < 16) return 'Lunch';
  return 'Snack';
}

export function formatMealTime(loggedAt) {
  const date = new Date(loggedAt);

  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getSectionLabel(dateKey, now = new Date()) {
  const today = getLocalDateKey(now);

  if (dateKey === today) return 'Today';

  const yesterday = shiftDateKey(today, -1);
  if (dateKey === yesterday) return 'Yesterday';

  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function getActiveDayCount(meals) {
  return new Set(meals.map((meal) => meal.date)).size;
}

/**
 * Counts consecutive logged days ending at today.
 * Walks unique dates newest-first; any gap resets the streak.
 */
export function calculateStreak(mealHistory, now = new Date()) {
  if (!mealHistory?.length) return 0;

  const loggedDates = [...new Set(mealHistory.map((meal) => meal.date))].sort((a, b) =>
    b.localeCompare(a),
  );

  const today = getLocalDateKey(now);
  if (loggedDates[0] !== today) return 0;

  let streak = 0;
  let expectedDate = today;

  for (const dateKey of loggedDates) {
    if (dateKey !== expectedDate) break;
    streak += 1;
    expectedDate = shiftDateKey(expectedDate, -1);
  }

  return streak;
}

export function calculateMealSummary(meals) {
  const totalSpent = meals.reduce((sum, meal) => sum + meal.price, 0);
  const totalMeals = meals.length;
  const activeDays = getActiveDayCount(meals);
  const avgPerDay = activeDays > 0 ? totalSpent / activeDays : 0;
  const streak = calculateStreak(meals);

  return {
    totalSpent,
    avgPerDay,
    totalMeals,
    streak,
    activeDays,
  };
}

export function groupMealsByDay(meals, now = new Date()) {
  const sorted = [...meals].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  const grouped = new Map();

  for (const meal of sorted) {
    if (!grouped.has(meal.date)) {
      grouped.set(meal.date, []);
    }
    grouped.get(meal.date).push(meal);
  }

  return Array.from(grouped.entries()).map(([dateKey, sectionMeals]) => ({
    dateKey,
    title: getSectionLabel(dateKey, now),
    meals: sectionMeals,
  }));
}
