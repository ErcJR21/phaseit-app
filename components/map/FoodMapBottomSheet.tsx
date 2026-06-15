import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronUp } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';

export type FoodMapSheetSnap = 'collapsed' | 'expanded';

type FoodMapBottomSheetProps = {
  snap: FoodMapSheetSnap;
  onSnapChange: (snap: FoodMapSheetSnap) => void;
  collapsedContent: React.ReactNode;
  expandedContent: React.ReactNode;
  onHeightChange?: (height: number) => void;
};

const SCREEN_HEIGHT = Dimensions.get('window').height;
const HANDLE_ZONE_HEIGHT = 36;
const COLLAPSED_BODY_HEIGHT = 160;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.75;
const SNAP_THRESHOLD = 48;

export function FoodMapBottomSheet({
  snap,
  onSnapChange,
  collapsedContent,
  expandedContent,
  onHeightChange,
}: FoodMapBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const collapsedHeight = COLLAPSED_BODY_HEIGHT + HANDLE_ZONE_HEIGHT + insets.bottom;
  const heightAnim = useRef(
    new Animated.Value(snap === 'expanded' ? EXPANDED_HEIGHT : collapsedHeight),
  ).current;
  const dragOffset = useRef(0);
  const currentSnap = useRef<FoodMapSheetSnap>(snap);
  const bottomInset = Math.max(insets.bottom, spacing.sm);

  const snapTo = useCallback(
    (nextSnap: FoodMapSheetSnap, animated = true) => {
      currentSnap.current = nextSnap;
      const targetHeight = nextSnap === 'expanded' ? EXPANDED_HEIGHT : collapsedHeight;

      if (animated) {
        Animated.spring(heightAnim, {
          toValue: targetHeight,
          useNativeDriver: false,
          tension: 68,
          friction: 12,
        }).start();
      } else {
        heightAnim.setValue(targetHeight);
      }

      onHeightChange?.(targetHeight);
    },
    [collapsedHeight, heightAnim, onHeightChange],
  );

  useEffect(() => {
    snapTo(snap);
  }, [snap, snapTo]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6,
        onPanResponderGrant: () => {
          heightAnim.stopAnimation((value) => {
            dragOffset.current = value;
          });
        },
        onPanResponderMove: (_, gesture) => {
          const nextHeight = Math.min(
            EXPANDED_HEIGHT,
            Math.max(collapsedHeight, dragOffset.current - gesture.dy),
          );
          heightAnim.setValue(nextHeight);
          onHeightChange?.(nextHeight);
        },
        onPanResponderRelease: (_, gesture) => {
          const projected =
            dragOffset.current - gesture.dy - gesture.vy * 80;
          const midpoint = (collapsedHeight + EXPANDED_HEIGHT) / 2;
          const nextSnap: FoodMapSheetSnap =
            projected > midpoint + SNAP_THRESHOLD
              ? 'expanded'
              : projected < midpoint - SNAP_THRESHOLD
                ? 'collapsed'
                : currentSnap.current;

          onSnapChange(nextSnap);
        },
      }),
    [collapsedHeight, heightAnim, onHeightChange, onSnapChange],
  );

  const handleToggle = () => {
    onSnapChange(snap === 'expanded' ? 'collapsed' : 'expanded');
  };

  const contentOpacity = heightAnim.interpolate({
    inputRange: [collapsedHeight, EXPANDED_HEIGHT],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const collapsedOpacity = heightAnim.interpolate({
    inputRange: [collapsedHeight, collapsedHeight + 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.sheetShadow, { height: heightAnim }]}>
      <Animated.View style={styles.sheet}>
        <View style={styles.handleZone} {...panResponder.panHandlers}>
          <Pressable
            style={styles.handleRow}
            onPress={handleToggle}
            accessibilityRole="button"
            accessibilityLabel={snap === 'expanded' ? 'Collapse food spots' : 'Expand food spot details'}
          >
            <View style={styles.dragHandle} accessibilityElementsHidden />
            <ChevronUp
              size={14}
              color={colors.muted}
              strokeWidth={2}
              style={{ transform: [{ rotate: snap === 'expanded' ? '180deg' : '0deg' }] }}
            />
          </Pressable>
        </View>

        <Animated.View
          style={[
            styles.collapsedLayer,
            { opacity: collapsedOpacity, paddingBottom: bottomInset },
            snap === 'collapsed' ? styles.layerInteractive : styles.layerPassthrough,
          ]}
        >
          {collapsedContent}
        </Animated.View>

        <Animated.View
          style={[
            styles.expandedLayer,
            { opacity: contentOpacity, paddingBottom: bottomInset + spacing.md },
            snap === 'expanded' ? styles.layerInteractive : styles.layerPassthrough,
          ]}
        >
          {expandedContent}
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

export const FOOD_MAP_SHEET_HANDLE_HEIGHT = HANDLE_ZONE_HEIGHT;
export const FOOD_MAP_SHEET_COLLAPSED_BODY_HEIGHT = COLLAPSED_BODY_HEIGHT;
export const FOOD_MAP_SHEET_EXPANDED_HEIGHT = EXPANDED_HEIGHT;

const styles = StyleSheet.create({
  sheetShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
    pointerEvents: 'box-none',
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    overflow: 'hidden',
    pointerEvents: 'auto',
  },
  handleZone: {
    zIndex: 2,
  },
  handleRow: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: HANDLE_ZONE_HEIGHT,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.xs,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(142, 142, 147, 0.5)',
  },
  collapsedLayer: {
    flex: 1,
  },
  expandedLayer: {
    ...StyleSheet.absoluteFillObject,
    top: HANDLE_ZONE_HEIGHT,
  },
  layerInteractive: {
    pointerEvents: 'auto',
  },
  layerPassthrough: {
    pointerEvents: 'none',
  },
});
