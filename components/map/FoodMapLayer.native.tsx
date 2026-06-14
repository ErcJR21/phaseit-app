import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { PricePillMarker } from './PricePillMarker';
import { colors } from '../../theme/colors';
import type { FoodMapLayerProps, FoodMapLayerRef } from './mapTypes';

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
const mapProvider =
  Platform.OS === 'android' || (Platform.OS === 'ios' && googleMapsApiKey)
    ? PROVIDER_GOOGLE
    : undefined;

const FoodMapLayer = forwardRef<FoodMapLayerRef, FoodMapLayerProps>(function FoodMapLayer(
  { initialRegion, userLocation, vendors, selectedVendorId, onSelectVendor },
  ref,
) {
  const mapRef = useRef<MapView | null>(null);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region, duration = 350) => {
      mapRef.current?.animateToRegion(region, duration);
    },
  }));

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={mapProvider}
      initialRegion={initialRegion}
      showsUserLocation={false}
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
      mapPadding={{ top: 160, right: 16, bottom: 280, left: 16 }}
    >
      <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }}>
        <UserLocationDot />
      </Marker>

      {vendors.map((vendor) => (
        <Marker
          key={vendor.id}
          coordinate={vendor.coordinate}
          onPress={() => onSelectVendor(vendor.id)}
          anchor={{ x: 0.5, y: 1 }}
        >
          <PricePillMarker
            vendor={vendor}
            selected={vendor.id === selectedVendorId}
          />
        </Marker>
      ))}
    </MapView>
  );
});

export default FoodMapLayer;

export type { FoodMapLayerRef, FoodMapLayerProps };

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
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
