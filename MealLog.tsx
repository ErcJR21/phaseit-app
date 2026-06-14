import { useCallback } from 'react';
import type { MealLogResult } from './CameraScreen';
import { useBarkada } from './context/BarkadaContext';
import { useMacros } from './context/MacroContext';
import { MEAL_LOG_EXP } from './data/dailyMacros';

/**
 * Call `logMealFromScan` when CameraScreen finishes AI analysis.
 * Updates global macro totals via MacroContext.
 */
export function useMealLog() {
  const { addMeal } = useMacros();
  const { logMealToFeed } = useBarkada();

  const logMealFromScan = useCallback(
    (result: MealLogResult) => {
      const { nutrition } = result;
      const imageUri = result.localUri ?? result.publicUrl;

      addMeal({
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fats: nutrition.fats,
        foodName: nutrition.foodName,
        price: nutrition.pricePeso,
        imageUri,
      });

      logMealToFeed({
        foodName: nutrition.foodName,
        imageUri,
        exp: MEAL_LOG_EXP,
      });

      return nutrition.foodName;
    },
    [addMeal, logMealToFeed],
  );

  return { logMealFromScan };
}
