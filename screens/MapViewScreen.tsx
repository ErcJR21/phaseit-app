import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { ChevronLeft } from 'lucide-react-native';
import { colors, shadows } from '../theme/colors';
import { layout, spacing } from '../theme/spacing';

type MapViewScreenProps = {
  onClose?: () => void;
};

const FALLBACK_REGION: Region = {
  latitude: 14.5995,
  longitude: 120.9842,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const mapProvider =
  Platform.OS === 'android' || (Platform.OS === 'ios' && googleMapsApiKey)
    ? PROVIDER_GOOGLE
    : undefined;

export default function MapViewScreen({ onClose }: MapViewScreenProps) {
  const [region, setRegion] = useState<Region | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (!mounted) return;

      if (status !== 'granted') {
        setPermissionDenied(true);
        setRegion(FALLBACK_REGION);
        setLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!mounted) return;

      const { latitude, longitude } = position.coords;

      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !region) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.green} />
        <Text style={styles.loadingText}>Finding your location…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={mapProvider}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
        showsCompass={false}
        toolbarEnabled={false}
      >
        <Marker
          coordinate={{
            latitude: region.latitude,
            longitude: region.longitude,
          }}
          title="Sample Food Spot"
          description="Budget-friendly eats near you — more pins coming soon!"
          pinColor={colors.green}
        />
      </MapView>

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <Pressable
            style={styles.backButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={22} color={colors.navy} strokeWidth={2.5} />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.screenTitle}>Food Map</Text>
            <Text style={styles.screenSubtitle}>
              {permissionDenied
                ? 'Location denied — showing default area'
                : 'Your location and nearby food spots'}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: layout.screenPaddingX,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  titleBlock: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
  },
  screenSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.muted,
    marginTop: 2,
  },
});
