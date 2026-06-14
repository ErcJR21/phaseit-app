import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { layout, spacing } from '../../theme/spacing';
import type { FoodMapLayerProps, FoodMapLayerRef } from './mapTypes';

const FoodMapLayer = forwardRef<FoodMapLayerRef, FoodMapLayerProps>(function FoodMapLayer(
  _props,
  _ref,
) {
  return (
    <View style={styles.placeholder}>
      <View style={styles.placeholderBox} />
      <Text style={styles.placeholderMessage}>Map view available on mobile</Text>
    </View>
  );
});

export default FoodMapLayer;

export type { FoodMapLayerRef, FoodMapLayerProps };

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundMuted,
    paddingHorizontal: layout.screenPaddingX,
    gap: spacing.lg,
  },
  placeholderBox: {
    width: '80%',
    height: 200,
    borderRadius: 16,
    backgroundColor: colors.track,
    borderWidth: 2,
    borderColor: colors.white,
    borderStyle: 'dashed',
  },
  placeholderMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 280,
  },
});
