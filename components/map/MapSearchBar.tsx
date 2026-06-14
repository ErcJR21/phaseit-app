import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors, shadows } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';

type MapSearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function MapSearchBar({
  value,
  onChangeText,
  placeholder = 'Search food spots near campus…',
}: MapSearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Search size={18} color={colors.coral} strokeWidth={2.2} />
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        clearButtonMode="never"
      />
      {value.length > 0 && (
        <Pressable
          style={styles.clearButton}
          onPress={() => onChangeText('')}
          accessibilityLabel="Clear search"
        >
          <X size={16} color={colors.muted} strokeWidth={2.2} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    ...shadows.card,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.iconSquare,
    backgroundColor: colors.coralTint15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.navy,
    paddingVertical: 6,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
