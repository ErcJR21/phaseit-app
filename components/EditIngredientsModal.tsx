import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Plus, Trash2, X } from 'lucide-react-native';
import { colors, shadows } from '../theme/colors';
import { layout, radii, spacing } from '../theme/spacing';
import { fontWeights, typography } from '../theme/typography';

type EditIngredientsModalProps = {
  visible: boolean;
  ingredients: string[];
  onSave: (ingredients: string[]) => void;
  onClose: () => void;
};

export function EditIngredientsModal({
  visible,
  ingredients,
  onSave,
  onClose,
}: EditIngredientsModalProps) {
  const [draft, setDraft] = useState<string[]>(ingredients);

  useEffect(() => {
    if (visible) {
      setDraft(ingredients.length > 0 ? ingredients : ['']);
    }
  }, [visible, ingredients]);

  const updateItem = (index: number, value: string) => {
    setDraft((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const removeItem = (index: number) => {
    setDraft((prev) => (prev.length <= 1 ? [''] : prev.filter((_, i) => i !== index)));
  };

  const addItem = () => {
    setDraft((prev) => [...prev, '']);
  };

  const handleSave = () => {
    const cleaned = draft.map((item) => item.trim()).filter(Boolean);
    onSave(cleaned.length > 0 ? cleaned : ['Mixed ulam']);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Ingredients</Text>
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close edit ingredients"
            >
              <X size={20} color={colors.navy} strokeWidth={2.2} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>Adjust what the AI detected before logging.</Text>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {draft.map((item, index) => (
              <View key={`ingredient-${index}`} style={styles.row}>
                <TextInput
                  style={styles.input}
                  value={item}
                  onChangeText={(value) => updateItem(index, value)}
                  placeholder="Ingredient name"
                  placeholderTextColor={colors.muted}
                />
                <Pressable
                  style={styles.removeButton}
                  onPress={() => removeItem(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ingredient ${index + 1}`}
                >
                  <Trash2 size={18} color={colors.coral} strokeWidth={2} />
                </Pressable>
              </View>
            ))}

            <Pressable
              style={styles.addButton}
              onPress={addItem}
              accessibilityRole="button"
              accessibilityLabel="Add ingredient"
            >
              <Plus size={18} color={colors.green} strokeWidth={2.2} />
              <Text style={styles.addButtonText}>Add ingredient</Text>
            </Pressable>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              style={styles.cancelButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancel editing"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.saveButton}
              onPress={handleSave}
              accessibilityRole="button"
              accessibilityLabel="Save ingredients"
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 30, 58, 0.45)',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '85%',
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.sectionTitle,
    fontSize: 18,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  subtitle: {
    ...typography.subtitle,
    lineHeight: 20,
  },
  list: {
    maxHeight: 320,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    fontWeight: fontWeights.medium,
    color: colors.navy,
    borderWidth: 1,
    borderColor: colors.track,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.coralTint10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.green,
    borderStyle: 'dashed',
    marginTop: spacing.xs,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: fontWeights.semibold,
    color: colors.green,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.track,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: fontWeights.semibold,
    color: colors.navy,
  },
  saveButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.navy,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
});
