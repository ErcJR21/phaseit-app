import type { MealLogResult } from '../CameraScreen';
import type { MealNutrition } from '../services/nutritionVisionService';

export type DetectedMeal = {
  imageUri: string;
  publicUrl?: string;
  foodName: string;
  description?: string;
  confidence: MealNutrition['confidence'];
  ingredients: string[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  pricePeso: number;
};

export function parseIngredientsFromDescription(description?: string): string[] {
  if (!description?.trim()) return ['Mixed ulam'];

  const parts = description
    .split(/,|\band\b|\+|&/i)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : ['Mixed ulam'];
}

export function mealLogResultToDetectedMeal(result: MealLogResult): DetectedMeal {
  const { nutrition } = result;

  return {
    imageUri: result.localUri ?? result.publicUrl,
    publicUrl: result.publicUrl,
    foodName: nutrition.foodName,
    description: nutrition.description,
    confidence: nutrition.confidence,
    ingredients:
      nutrition.ingredients?.length > 0
        ? nutrition.ingredients
        : parseIngredientsFromDescription(nutrition.description),
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fats: nutrition.fats,
    pricePeso: nutrition.pricePeso,
  };
}

export function detectedMealToLogResult(meal: DetectedMeal): MealLogResult {
  return {
    publicUrl: meal.publicUrl ?? meal.imageUri,
    localUri: meal.imageUri,
    nutrition: {
      foodName: meal.foodName,
      description: meal.ingredients.join(', '),
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
      pricePeso: meal.pricePeso,
      confidence: meal.confidence,
      ingredients: meal.ingredients,
    },
  };
}
