import { Image, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { radii } from '../theme/spacing';

export const MEAL_THUMBNAIL_SIZE = 50;

type MealThumbnailProps = {
  imageUri?: string | null;
};

export function MealThumbnail({ imageUri }: MealThumbnailProps) {
  if (!imageUri) return null;

  return (
    <Image
      source={{ uri: imageUri }}
      style={styles.mealImage}
      accessibilityIgnoresInvertColors
    />
  );
}

const styles = StyleSheet.create({
  mealImage: {
    width: MEAL_THUMBNAIL_SIZE,
    height: MEAL_THUMBNAIL_SIZE,
    borderRadius: radii.sm,
    backgroundColor: colors.track,
  },
});
