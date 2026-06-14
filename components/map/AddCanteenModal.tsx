import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MapPin, X } from 'lucide-react-native';
import { MACRO_TAG_OPTIONS, MacroTagKey } from '../../data/vendors';
import { colors, shadows } from '../../theme/colors';
import { layout, radii, spacing } from '../../theme/spacing';
import type { InsertCanteenInput } from '../../services/canteensService';

type AddCanteenModalProps = {
  visible: boolean;
  latitude: number;
  longitude: number;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (input: InsertCanteenInput) => Promise<void>;
};

export function AddCanteenModal({
  visible,
  latitude,
  longitude,
  submitting = false,
  onClose,
  onSubmit,
}: AddCanteenModalProps) {
  const [name, setName] = useState('');
  const [priceMin, setPriceMin] = useState('45');
  const [priceMax, setPriceMax] = useState('65');
  const [comboDescription, setComboDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<MacroTagKey[]>(['budget-meal']);
  const [error, setError] = useState<string | null>(null);

  const toggleTag = (tag: MacroTagKey) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  };

  const resetForm = () => {
    setName('');
    setPriceMin('45');
    setPriceMax('65');
    setComboDescription('');
    setSelectedTags(['budget-meal']);
    setError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const min = Number(priceMin);
    const max = Number(priceMax);

    if (trimmedName.length < 2) {
      setError('Give your hidden gem a name (at least 2 characters).');
      return;
    }

    if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) {
      setError('Enter a valid price range (min must be ≤ max).');
      return;
    }

    if (selectedTags.length === 0) {
      setError('Pick at least one macro-friendly tag.');
      return;
    }

    setError(null);

    try {
      await onSubmit({
        name: trimmedName,
        latitude,
        longitude,
        avgPriceMin: Math.round(min),
        avgPriceMax: Math.round(max),
        macroFriendlyTags: selectedTags,
        venueType: 'carinderia',
        heroComboDescription: comboDescription.trim() || undefined,
        heroComboPrice: Math.round(min),
      });
      resetForm();
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Could not save your spot. Try again.',
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.scrim} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Drop a Hidden Gem</Text>
            <Pressable style={styles.closeButton} onPress={handleClose} disabled={submitting}>
              <X size={18} color={colors.navy} strokeWidth={2.2} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Share a student-sourced carinderia pin. It goes live for everyone on the map.
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
            <Text style={styles.label}>Spot name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Aling Nena's Carinderia"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>Average price range (₱)</Text>
            <View style={styles.priceRow}>
              <TextInput
                style={[styles.input, styles.priceInput]}
                value={priceMin}
                onChangeText={setPriceMin}
                keyboardType="number-pad"
                placeholder="Min"
                placeholderTextColor={colors.muted}
              />
              <Text style={styles.priceDash}>–</Text>
              <TextInput
                style={[styles.input, styles.priceInput]}
                value={priceMax}
                onChangeText={setPriceMax}
                keyboardType="number-pad"
                placeholder="Max"
                placeholderTextColor={colors.muted}
              />
            </View>

            <Text style={styles.label}>Best-value combo (optional)</Text>
            <TextInput
              style={styles.input}
              value={comboDescription}
              onChangeText={setComboDescription}
              placeholder="e.g. Adobo + Rice + Gulay"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>Macro-friendly tags</Text>
            <View style={styles.tagRow}>
              {MACRO_TAG_OPTIONS.map((tag) => {
                const active = selectedTags.includes(tag.key);
                return (
                  <Pressable
                    key={tag.key}
                    style={[styles.tagPill, active && styles.tagPillActive]}
                    onPress={() => toggleTag(tag.key)}
                  >
                    <Text style={[styles.tagLabel, active && styles.tagLabelActive]}>
                      {tag.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.locationRow}>
              <MapPin size={14} color={colors.green} strokeWidth={2.2} />
              <Text style={styles.locationText}>
                Pin at {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </Text>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitText}>Submit to Food Map</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: spacing.xxl,
    maxHeight: '88%',
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  form: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
    color: colors.navy,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  priceInput: {
    flex: 1,
  },
  priceDash: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.muted,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  tagPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.track,
  },
  tagPillActive: {
    backgroundColor: colors.greenTint15,
    borderColor: colors.green,
  },
  tagLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  tagLabelActive: {
    color: colors.green,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.greenTint15,
    borderRadius: radii.md,
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: colors.navy,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.coral,
    marginTop: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.green,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    ...shadows.card,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
});
