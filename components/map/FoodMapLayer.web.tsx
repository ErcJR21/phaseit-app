import { createElement, forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadows } from '../../theme/colors';
import { layout, radii, spacing } from '../../theme/spacing';
import type { MapCoordinate, MapInsets, MapRegion } from './mapTypes';
import type { FoodMapLayerProps, FoodMapLayerRef } from './mapTypes';
import { PricePillMarker } from './PricePillMarker';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const FOCUS_DELTA = 0.006;

function centerForVisibleMap(
  coordinate: MapCoordinate,
  insets: MapInsets,
): MapRegion {
  const top = insets.top;
  const bottom = insets.bottom;
  const visibleCenterY = top + (SCREEN_HEIGHT - top - bottom) / 2;
  const offsetFraction = visibleCenterY / SCREEN_HEIGHT - 0.5;
  const latShift = FOCUS_DELTA * offsetFraction * 1.15;

  return {
    latitude: coordinate.latitude - latShift,
    longitude: coordinate.longitude,
    latitudeDelta: FOCUS_DELTA,
    longitudeDelta: FOCUS_DELTA,
  };
}

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const useEmbedApi = process.env.EXPO_PUBLIC_GOOGLE_MAPS_USE_EMBED_API === 'true';

function latitudeDeltaToZoom(latitudeDelta: number): number {
  const zoom = Math.round(Math.log2(360 / latitudeDelta));
  return Math.min(Math.max(zoom, 13), 17);
}

/**
 * Web uses an iframe embed — not react-native-maps MapView.
 * embed/v1/view requires the separate "Maps Embed API" enabled in Google Cloud;
 * billing on Maps SDK for Android/iOS does not cover it (403 otherwise).
 */
function buildMapEmbedUrl(center: MapCoordinate, latitudeDelta: number): string {
  const zoom = latitudeDeltaToZoom(latitudeDelta);
  const { latitude, longitude } = center;

  const hasApiKey = Boolean(
    googleMapsApiKey && googleMapsApiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE',
  );

  if (hasApiKey && useEmbedApi) {
    return `https://www.google.com/maps/embed/v1/view?key=${googleMapsApiKey}&center=${latitude},${longitude}&zoom=${zoom}&maptype=roadmap`;
  }

  return `https://www.google.com/maps?q=${latitude},${longitude}&hl=en&z=${zoom}&output=embed`;
}

function coordinateToOverlayPosition(
  coordinate: MapCoordinate,
  region: MapRegion,
): { left: string; top: string } {
  const minLng = region.longitude - region.longitudeDelta / 2;
  const maxLat = region.latitude + region.latitudeDelta / 2;
  const x = ((coordinate.longitude - minLng) / region.longitudeDelta) * 100;
  const y = ((maxLat - coordinate.latitude) / region.latitudeDelta) * 100;

  return {
    left: `${Math.min(Math.max(x, 6), 94)}%`,
    top: `${Math.min(Math.max(y, 14), 86)}%`,
  };
}

type WebMapFrameProps = {
  src: string;
  title: string;
};

function WebMapFrame({ src, title }: WebMapFrameProps) {
  if (Platform.OS !== 'web') {
    return null;
  }

  return createElement('iframe', {
    src,
    title,
    loading: 'lazy',
    referrerPolicy: 'no-referrer-when-downgrade',
    allowFullScreen: true,
    style: {
      border: 0,
      width: '100%',
      height: '100%',
      display: 'block',
    },
  });
}

function UserLocationDot() {
  return (
    <View style={styles.userDotWrap}>
      <View style={styles.userRingOuter} />
      <View style={styles.userRingMid} />
      <View style={styles.userDotCore} />
    </View>
  );
}

const FoodMapLayer = forwardRef<FoodMapLayerRef, FoodMapLayerProps>(function FoodMapLayer(
  { initialRegion, userLocation, vendors, selectedStallId, onSelectStall },
  ref,
) {
  const [region, setRegion] = useState<MapRegion>(initialRegion);

  useImperativeHandle(ref, () => ({
    animateToRegion: (nextRegion) => {
      setRegion(nextRegion);
    },
    focusOnCoordinate: (coordinate, insets) => {
      setRegion(centerForVisibleMap(coordinate, insets));
    },
  }));

  const mapSrc = useMemo(
    () => buildMapEmbedUrl(region, region.latitudeDelta),
    [region],
  );

  const userPosition = useMemo(
    () => coordinateToOverlayPosition(userLocation, region),
    [region, userLocation],
  );

  return (
    <View style={styles.mapShell}>
      <View style={styles.mapFrame}>
        <WebMapFrame src={mapSrc} title="Campus Food Map" />
      </View>

      <View style={styles.overlayLayer}>
        <View
          style={[
            styles.userMarker,
            { left: userPosition.left, top: userPosition.top },
          ]}
        >
          <UserLocationDot />
        </View>

        {vendors.map((vendor) => {
          const position = coordinateToOverlayPosition(vendor.coordinate, region);

          return (
            <Pressable
              key={vendor.id}
              style={[
                styles.vendorMarker,
                { left: position.left, top: position.top },
              ]}
              onPress={() => onSelectStall(vendor)}
              accessibilityLabel={`${vendor.name}, ₱${vendor.startingPrice}`}
            >
              <PricePillMarker
                vendor={vendor}
                selected={vendor.id === selectedStallId}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.mapBadge}>
        <Text style={styles.mapBadgeText}>UP Diliman Campus · {vendors.length} pins</Text>
      </View>
    </View>
  );
});

export default FoodMapLayer;

export type { FoodMapLayerRef, FoodMapLayerProps };

const styles = StyleSheet.create({
  mapShell: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    backgroundColor: colors.backgroundMuted,
  },
  mapFrame: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.white,
  },
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none',
  },
  userMarker: {
    position: 'absolute',
    transform: [{ translateX: -14 }, { translateY: -14 }],
    pointerEvents: 'none',
  },
  vendorMarker: {
    position: 'absolute',
    transform: [{ translateX: -40 }, { translateY: -36 }],
    zIndex: 2,
  },
  mapBadge: {
    position: 'absolute',
    top: 188,
    left: layout.screenPaddingX + spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    pointerEvents: 'none',
    ...shadows.card,
  },
  mapBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.navy,
  },
  userDotWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userRingOuter: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(66, 133, 244, 0.25)',
  },
  userRingMid: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(66, 133, 244, 0.2)',
  },
  userDotCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4285F4',
    borderWidth: 2,
    borderColor: colors.white,
  },
});
