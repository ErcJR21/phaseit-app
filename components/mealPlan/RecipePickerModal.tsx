import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import type { RecipeRow } from '../../services/recipesService';
import { colors, shadows } from '../../theme/colors';
import { layout, radii, spacing } from '../../theme/spacing';
import type { MealType } from '../../services/mealPlansService';

type RecipePickerModalProps = {
  visible: boolean;
  mealType: MealType;
  mealLabel: string;
  recipes: RecipeRow[];
  loading?: boolean;
  saving?: boolean;
  onClose: () => void;
  onSelect: (recipe: RecipeRow) => void;
};

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export function RecipePickerModal({
  visible,
  mealType,
  mealLabel,
  recipes,
  loading = false,
  saving = false,
  onClose,
  onSelect,
}: RecipePickerModalProps) {
  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleSelect = (recipe: RecipeRow) => {
    if (saving) return;
    onSelect(recipe);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.scrim} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Add {MEAL_TYPE_LABELS[mealType]}</Text>
              <Text style={styles.subtitle}>{mealLabel}</Text>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={handleClose}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Close recipe picker"
            >
              <X size={20} color={colors.navy} strokeWidth={2.5} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.coral} />
              <Text style={styles.loadingText}>Loading recipes...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.results}
              contentContainerStyle={styles.resultsContent}
              keyboardShouldPersistTaps="handled"
            >
              {recipes.length === 0 ? (
                <Text style={styles.emptyText}>No recipes available yet.</Text>
              ) : (
                recipes.map((recipe) => (
                  <Pressable
                    key={recipe.id}
                    style={({ pressed }) => [
                      styles.resultCard,
                      pressed && styles.resultCardPressed,
                    ]}
                    onPress={() => handleSelect(recipe)}
                    disabled={saving}
                  >
                    <View style={styles.resultEmoji}>
                      <Text style={styles.emojiText}>{recipe.emoji}</Text>
                    </View>
                    <View style={styles.resultCopy}>
                      <Text style={styles.resultName}>{recipe.name}</Text>
                      <Text style={styles.resultMeta}>
                        ₱{recipe.cost}
                        {recipe.place ? ` · ${recipe.place}` : ''}
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
            </ScrollView>
          )}

          {saving && (
            <View style={styles.savingRow}>
              <ActivityIndicator color={colors.coral} />
              <Text style={styles.savingText}>Saving meal plan...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 30, 58, 0.45)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '82%',
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.muted,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    fontSize: 13,
    color: colors.muted,
  },
  results: {
    flexGrow: 0,
  },
  resultsContent: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  emptyText: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  resultCardPressed: {
    opacity: 0.85,
  },
  resultEmoji: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 22,
  },
  resultCopy: {
    flex: 1,
    gap: 2,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
  },
  resultMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.green,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  savingText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
  },
});
