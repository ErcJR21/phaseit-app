import { createElement, forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadows } from '../../theme/colors';
import { layout, radii, spacing } from '../../theme/spacing';
import type { MapCoordinate, MapRegion } from './mapTypes';
import type { FoodMapLayerProps, FoodMapLayerRef } from './mapTypes';
import { PricePillMarker } from './PricePillMarker';

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

function latitudeDeltaToZoom(latitudeDelta: number): number {
  const zoom = Math.round(Math.log2(360 / latitudeDelta));
  return Math.min(Math.max(zoom, 13), 17);
}

function buildMapEmbedUrl(center: MapCoordinate, latitudeDelta: number): string {
  const zoom = latitudeDeltaToZoom(latitudeDelta);
  const { latitude, longitude } = center;

  if (googleMapsApiKey && googleMapsApiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    return `https://www.google.com/maps/embed/v1/view?key=${googleMapsApiKey}&center=${latitude},${longitude}&zoom=${zoom}&maptype=roadmap`;
  }

  return `https://maps.google.com/maps?q=${latitude},${longitude}&hl=en&z=${zoom}&output=embed`;
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
  { initialRegion, userLocation, vendors, selectedVendorId, onSelectVendor },
  ref,
) {
  const [region, setRegion] = useState<MapRegion>(initialRegion);

  useImperativeHandle(ref, () => ({
    animateToRegion: (nextRegion) => {
      setRegion(nextRegion);
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

      <View style={styles.overlayLayer} pointerEvents="box-none">
        <View
          style={[
            styles.userMarker,
            { left: userPosition.left, top: userPosition.top },
          ]}
          pointerEvents="none"
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
              onPress={() => onSelectVendor(vendor.id)}
              accessibilityLabel={`${vendor.name}, ₱${vendor.startingPrice}`}
            >
              <PricePillMarker
                vendor={vendor}
                selected={vendor.id === selectedVendorId}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.mapBadge} pointerEvents="none">
        <Text style={styles.mapBadgeText}>UP Diliman Campus · {vendors.length} pins</Text>
      </View>
    </View>
  );
});

export default FoodMapLayer;

export type { FoodMapLayerRef, FoodMapLayerProps };

const styles = StyleSheet.create({
  mapShell: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.backgroundMuted,
    paddingTop: 150,
    paddingBottom: 260,
    paddingHorizontal: layout.screenPaddingX,
  },
  mapFrame: {
    flex: 1,
    width: '100%',
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.track,
    backgroundColor: colors.white,
    ...shadows.card,
  },
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    marginTop: 150,
    marginBottom: 260,
    marginHorizontal: layout.screenPaddingX,
  },
  userMarker: {
    position: 'absolute',
    transform: [{ translateX: -14 }, { translateY: -14 }],
  },
  vendorMarker: {
    position: 'absolute',
    transform: [{ translateX: -40 }, { translateY: -36 }],
    zIndex: 2,
  },
  mapBadge: {
    position: 'absolute',
    top: 162,
    left: layout.screenPaddingX + spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
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
