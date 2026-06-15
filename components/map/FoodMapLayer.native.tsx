import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { PricePillMarker } from './PricePillMarker';
import { colors } from '../../theme/colors';
import type { FoodMapLayerProps, FoodMapLayerRef, MapCoordinate, MapInsets } from './mapTypes';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const FOCUS_DELTA = 0.006;

function centerForVisibleMap(
  coordinate: MapCoordinate,
  insets: MapInsets,
): MapCoordinate & { latitudeDelta: number; longitudeDelta: number } {
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

function UserLocationDot() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.2],
  });

  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0],
  });

  return (
    <View style={styles.userDotWrap}>
      <Animated.View
        style={[
          styles.userRingOuter,
          { opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]}
      />
      <View style={styles.userRingMid} />
      <View style={styles.userDotCore} />
    </View>
  );
}

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const hasGoogleMapsApiKey = Boolean(
  googleMapsApiKey && googleMapsApiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE',
);

const FoodMapLayer = forwardRef<FoodMapLayerRef, FoodMapLayerProps>(function FoodMapLayer(
  { initialRegion, userLocation, vendors, selectedStallId, onSelectStall, mapInsets },
  ref,
) {
  const mapRef = useRef<MapView | null>(null);
  const padding = {
    top: mapInsets?.top ?? 160,
    right: mapInsets?.right ?? 16,
    bottom: mapInsets?.bottom ?? 220,
    left: mapInsets?.left ?? 16,
  };

  useImperativeHandle(ref, () => ({
    animateToRegion: (region, duration = 350) => {
      mapRef.current?.animateToRegion(region, duration);
    },
    focusOnCoordinate: (coordinate, insets) => {
      mapRef.current?.animateToRegion(centerForVisibleMap(coordinate, insets), 350);
    },
  }));

  const handleMapReady = () => {
    if (__DEV__) {
      console.log('[FoodMapLayer.native] Map is ready!', { hasGoogleMapsApiKey });
    }
  };

  return (
    <View style={styles.mapHost}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        mapPadding={padding}
        onMapReady={handleMapReady}
      >
        <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }}>
          <UserLocationDot />
        </Marker>

        {vendors.map((vendor) => (
          <Marker
            key={vendor.id}
            coordinate={vendor.coordinate}
          onPress={() => onSelectStall(vendor)}
          anchor={{ x: 0.5, y: 1 }}
        >
          <PricePillMarker
            vendor={vendor}
            selected={vendor.id === selectedStallId}
          />
          </Marker>
        ))}
      </MapView>
    </View>
  );
});

export default FoodMapLayer;

export type { FoodMapLayerRef, FoodMapLayerProps };

const styles = StyleSheet.create({
  mapHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
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
