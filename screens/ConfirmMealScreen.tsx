import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ChevronLeft, Pencil, Sparkles } from 'lucide-react-native';
import { EditIngredientsModal } from '../components/EditIngredientsModal';
import { MealMacroRings } from '../components/MealMacroRings';
import { MEAL_LOG_EXP } from '../data/dailyMacros';
import { components } from '../theme/designSystem';
import { colors, shadows } from '../theme/colors';
import { layout, radii, spacing } from '../theme/spacing';
import { fontWeights, typography } from '../theme/typography';
import type { DetectedMeal } from '../types/detectedMeal';

type ConfirmMealScreenProps = {
  detectedMeal: DetectedMeal;
  onConfirm: (meal: DetectedMeal) => void;
  onCancel: () => void;
};

const CONFIDENCE_LABELS: Record<DetectedMeal['confidence'], string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
};

const CONFIDENCE_COLORS: Record<DetectedMeal['confidence'], string> = {
  high: colors.green,
  medium: colors.gold,
  low: colors.coral,
};

function formatPeso(amount: number) {
  return `₱${Math.round(amount).toLocaleString('en-PH')}`;
}

export function ConfirmMealScreen({ detectedMeal, onConfirm, onCancel }: ConfirmMealScreenProps) {
  const [meal, setMeal] = useState(detectedMeal);
  const [showEditModal, setShowEditModal] = useState(false);

  const confidenceColor = CONFIDENCE_COLORS[meal.confidence];

  const ingredientSummary = useMemo(
    () => meal.ingredients.join(' · '),
    [meal.ingredients],
  );

  const handleConfirm = () => {
    onConfirm(meal);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={22} color={colors.navy} strokeWidth={2.2} />
            </Pressable>
            <Text style={styles.headerTitle}>Confirm Meal</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.heroCard}>
            <Image
              source={{ uri: meal.imageUri }}
              style={styles.heroImage}
              accessibilityIgnoresInvertColors
            />

            <View style={styles.heroCopy}>
              <View style={styles.aiRow}>
                <Sparkles size={14} color={colors.green} strokeWidth={2.2} />
                <Text style={styles.aiLabel}>AI Analysis</Text>
              </View>

              <Text style={styles.foodName}>{meal.foodName}</Text>

              <View style={[styles.confidenceBadge, { borderColor: confidenceColor }]}>
                <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
                <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                  {CONFIDENCE_LABELS[meal.confidence]}
                </Text>
              </View>

              <Text style={styles.price}>{formatPeso(meal.pricePeso)}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nutrition Breakdown</Text>
            <MealMacroRings
              calories={meal.calories}
              protein={meal.protein}
              carbs={meal.carbs}
              fat={meal.fats}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Detected Ingredients</Text>
            <View style={styles.ingredientList}>
              {meal.ingredients.map((ingredient, index) => (
                <View key={`${ingredient}-${index}`} style={styles.ingredientChip}>
                  <Text style={styles.ingredientChipText}>{ingredient}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.ingredientSummary}>{ingredientSummary}</Text>
          </View>

          <Pressable
            style={styles.editButton}
            onPress={() => setShowEditModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Edit details manually"
          >
            <Pencil size={16} color={colors.navy} strokeWidth={2.2} />
            <Text style={styles.editButtonText}>Edit Details Manually</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.stickyFooter}>
          <Pressable
            style={({ pressed }) => [styles.confirmButton, pressed && styles.confirmButtonPressed]}
            onPress={handleConfirm}
            accessibilityRole="button"
            accessibilityLabel={`Confirm and log meal, plus ${MEAL_LOG_EXP} experience points`}
          >
            <Text style={styles.confirmButtonText}>
              Confirm and Log Meal (+{MEAL_LOG_EXP} EXP)
            </Text>
          </Pressable>
        </View>
      </View>

      <EditIngredientsModal
        visible={showEditModal}
        ingredients={meal.ingredients}
        onSave={(ingredients) => setMeal((prev) => ({ ...prev, ingredients }))}
        onClose={() => setShowEditModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  headerTitle: {
    ...typography.pageTitle,
    fontSize: 18,
  },
  headerSpacer: {
    width: 40,
  },
  heroCard: {
    ...components.card,
    overflow: 'hidden',
    padding: 0,
    gap: 0,
  },
  heroImage: {
    width: '100%',
    height: 220,
    backgroundColor: colors.track,
  },
  heroCopy: {
    padding: layout.cardPadding,
    gap: spacing.sm,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    color: colors.green,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  foodName: {
    fontSize: 22,
    fontWeight: fontWeights.bold,
    color: colors.navy,
    lineHeight: 28,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    backgroundColor: colors.white,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
  },
  price: {
    fontSize: 16,
    fontWeight: fontWeights.bold,
    color: colors.coral,
  },
  card: {
    ...components.card,
    gap: spacing.md,
  },
  cardTitle: {
    ...typography.sectionTitle,
  },
  ingredientList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  ingredientChip: {
    backgroundColor: colors.navyTint10,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  ingredientChipText: {
    fontSize: 13,
    fontWeight: fontWeights.medium,
    color: colors.navy,
  },
  ingredientSummary: {
    ...typography.subtitle,
    lineHeight: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.track,
    ...shadows.card,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: fontWeights.semibold,
    color: colors.navy,
  },
  stickyFooter: {
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.track,
  },
  confirmButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
    borderRadius: radii.pill,
    paddingVertical: 16,
    ...shadows.card,
  },
  confirmButtonPressed: {
    opacity: 0.9,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
});
