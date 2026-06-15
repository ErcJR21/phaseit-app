import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { ChevronLeft, MapPin, Plus } from 'lucide-react-native';
import { AddCanteenModal } from '../components/map/AddCanteenModal';
import FoodMapLayer from '../components/map/FoodMapLayer';
import type { FoodMapLayerRef } from '../components/map/mapTypes';
import { MapSearchBar } from '../components/map/MapSearchBar';
import { VendorDetailSheet } from '../components/map/VendorDetailSheet';
import {
  restaurantToVendor,
  vendorToRestaurant,
  type Restaurant,
} from '../data/restaurants';
import { CAMPUS_CENTER } from '../data/vendors';
import {
  canteenRowToVendor,
  fetchCanteens,
  insertCanteen,
  withVendorDistance,
  type InsertCanteenInput,
} from '../services/canteensService';
import { colors, shadows } from '../theme/colors';
import { layout, radii, spacing } from '../theme/spacing';

type MapScreenProps = {
  onClose?: () => void;
  onLogMeal?: () => void;
};

const isNativeMobile = Platform.OS === 'ios' || Platform.OS === 'android';

const MAPUA_MAKATI_MAP_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.642738981442!2d121.00693527588145!3d14.561560085906232!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c962b71a0675%3A0x63390c57650f0003!2sMap%C3%BAa%20University%20Makati!5e0!3m2!1sen!2sph!4v1718360000000!5m2!1sen!2sph';

function WebMapArea() {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={styles.webMapContainer}>
      {createElement('iframe', {
        src: MAPUA_MAKATI_MAP_EMBED_URL,
        title: 'Mapúa University Makati',
        loading: 'lazy',
        referrerPolicy: 'no-referrer-when-downgrade',
        allowFullScreen: true,
        style: {
          border: 0,
          width: '100%',
          height: 400,
          display: 'block',
        },
      })}
    </View>
  );
}

type LocationPermissionState = 'idle' | 'requesting' | 'ready';

const INITIAL_RESTAURANTS: Restaurant[] = [
  {
    id: 'kuya-marios',
    name: "Kuya Mario's Carinderia",
    tags: ['high-protein', 'veggie', 'budget-meal'],
    price: 65,
    isOpen: true,
  },
  {
    id: 'canteen-b',
    name: 'Canteen B — UP Diliman',
    tags: ['high-protein', 'veggie', 'budget-meal'],
    price: 55,
    isOpen: true,
  },
  {
    id: 'tita-rosa',
    name: 'Tita Rosa Street Eats',
    tags: ['budget-meal'],
    price: 35,
    isOpen: true,
  },
  {
    id: 'engg-canteen',
    name: 'Engg Canteen Corner',
    tags: ['veggie', 'budget-meal', 'high-fiber'],
    price: 48,
    isOpen: false,
  },
  {
    id: 'mang-jun',
    name: "Mang Jun's Lutong Bahay",
    tags: ['high-protein', 'budget-meal'],
    price: 58,
    isOpen: true,
  },
];

const FILTER_OPTIONS = [
  { key: 'budget-meal', label: 'Budget' },
  { key: 'openNow', label: 'Open Now' },
  { key: 'high-protein', label: 'High Protein' },
  { key: 'veggie', label: 'Veggie' },
  { key: 'high-fiber', label: 'High Fiber' },
] as const;

function restaurantMatchesFilter(restaurant: Restaurant, filter: string): boolean {
  if (filter === 'openNow') {
    return restaurant.isOpen;
  }

  return restaurant.tags.includes(filter);
}

async function handleGetDirections(latitude: number, longitude: number): Promise<void> {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    await Linking.openURL(url);
  } catch (error) {
    console.warn('[MapScreen] Failed to open directions:', error);
  }
}

export default function MapScreen({ onClose, onLogMeal }: MapScreenProps) {
  const mapRef = useRef<FoodMapLayerRef | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>(INITIAL_RESTAURANTS);
  const [selectedVendorId, setSelectedVendorId] = useState<string>(
    INITIAL_RESTAURANTS[0].id,
  );
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submittingPin, setSubmittingPin] = useState(false);
  const [locationPermission, setLocationPermission] = useState<LocationPermissionState>(
    isNativeMobile ? 'idle' : 'ready',
  );
  const [userLocation, setUserLocation] = useState({
    latitude: CAMPUS_CENTER.latitude,
    longitude: CAMPUS_CENTER.longitude,
  });

  const loadVendors = useCallback(async () => {
    setLoadingVendors(true);
    setLoadError(null);

    try {
      const rows = await fetchCanteens();
      const base =
        rows.length === 0
          ? INITIAL_RESTAURANTS
          : rows.map((row) => vendorToRestaurant(canteenRowToVendor(row)));

      setRestaurants(base);
      setSelectedVendorId(base[0]?.id ?? INITIAL_RESTAURANTS[0].id);
    } catch {
      setLoadError('Using offline campus pins — live database unavailable.');
      setRestaurants(INITIAL_RESTAURANTS);
      setSelectedVendorId(INITIAL_RESTAURANTS[0].id);
    } finally {
      setLoadingVendors(false);
    }
  }, []);

  useEffect(() => {
    console.log('[MapScreen] Platform.OS:', Platform.OS);
  }, []);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const toggleFilter = useCallback((filter: string) => {
    setActiveFilters((current) =>
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter],
    );
  }, []);

  const filteredRestaurants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const searchResults = query
      ? restaurants.filter((restaurant) =>
          restaurant.name.toLowerCase().includes(query),
        )
      : restaurants;

    if (activeFilters.length === 0) {
      return searchResults;
    }

    return searchResults.filter((restaurant) =>
      activeFilters.every((filter) => restaurantMatchesFilter(restaurant, filter)),
    );
  }, [restaurants, searchQuery, activeFilters]);

  const filteredVendors = useMemo(
    () =>
      filteredRestaurants.map((restaurant) => {
        const vendor = restaurantToVendor(restaurant);
        return withVendorDistance(vendor, userLocation);
      }),
    [filteredRestaurants, userLocation],
  );

  const selectedVendor =
    filteredVendors.find((vendor) => vendor.id === selectedVendorId) ??
    filteredVendors[0] ??
    (restaurants[0] ? withVendorDistance(restaurantToVendor(restaurants[0]), userLocation) : undefined);

  useEffect(() => {
    if (!selectedVendor) return;
    if (!filteredVendors.some((vendor) => vendor.id === selectedVendorId)) {
      setSelectedVendorId(filteredVendors[0]?.id ?? restaurants[0]?.id);
    }
  }, [filteredVendors, selectedVendorId, selectedVendor, restaurants]);

  useEffect(() => {
    if (!isNativeMobile) return;

    let mounted = true;

    (async () => {
      setLocationPermission('requesting');

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!mounted) return;

      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (mounted) {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      }

      if (mounted) {
        setLocationPermission('ready');
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectVendor = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    const restaurant = restaurants.find((item) => item.id === vendorId);
    if (!restaurant || !mapRef.current) return;

    const vendor = restaurantToVendor(restaurant);

    mapRef.current.animateToRegion(
      {
        ...vendor.coordinate,
        latitudeDelta: 0.006,
        longitudeDelta: 0.006,
      },
      350,
    );
  };

  const handleSubmitCanteen = async (input: InsertCanteenInput) => {
    setSubmittingPin(true);

    try {
      const row = await insertCanteen(input);
      const newRestaurant = vendorToRestaurant(canteenRowToVendor(row));
      const newVendor = withVendorDistance(canteenRowToVendor(row), userLocation);

      setRestaurants((current) => [newRestaurant, ...current]);
      setSelectedVendorId(newRestaurant.id);
      setLoadError(null);

      mapRef.current?.animateToRegion(
        {
          ...newVendor.coordinate,
          latitudeDelta: 0.006,
          longitudeDelta: 0.006,
        },
        350,
      );
    } finally {
      setSubmittingPin(false);
    }
  };

  const initialRegion = {
    ...CAMPUS_CENTER,
  };

  const renderRestaurantCard = (restaurant: Restaurant) => {
    const selected = restaurant.id === selectedVendorId;
    const { latitude, longitude } = restaurantToVendor(restaurant).coordinate;

    return (
      <View
        key={restaurant.id}
        style={[styles.restaurantCard, selected && styles.restaurantCardSelected]}
      >
        <Pressable
          onPress={() => handleSelectVendor(restaurant.id)}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          accessibilityLabel={`${restaurant.name}, ₱${restaurant.price}, ${restaurant.isOpen ? 'open' : 'closed'}`}
        >
          <View style={styles.restaurantCardBody}>
            <View style={styles.restaurantCardHeader}>
              <Text style={styles.restaurantName} numberOfLines={1}>
                {restaurant.name}
              </Text>
              <Text style={styles.restaurantPrice}>₱{restaurant.price}</Text>
            </View>
            <View style={styles.restaurantMetaRow}>
              <Text style={restaurant.isOpen ? styles.openText : styles.closedText}>
                {restaurant.isOpen ? 'Open' : 'Closed'}
              </Text>
              <Text style={styles.restaurantTags} numberOfLines={1}>
                {restaurant.tags.map((tag) => tag.replace(/-/g, ' ')).join(' · ')}
              </Text>
            </View>
          </View>
        </Pressable>
        <Pressable
          style={styles.directionsButton}
          onPress={(event) => {
            event?.stopPropagation?.();
            void handleGetDirections(latitude, longitude);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Get directions to ${restaurant.name}`}
        >
          <MapPin size={14} color={colors.white} strokeWidth={2} />
          <Text style={styles.directionsButtonText}>Get Directions</Text>
        </Pressable>
      </View>
    );
  };

  const renderRestaurantList = () => {
    if (filteredRestaurants.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No restaurants found matching your criteria.</Text>
        </View>
      );
    }

    return filteredRestaurants.map(renderRestaurantCard);
  };

  if (!selectedVendor) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <WebMapArea />
        ) : isNativeMobile && locationPermission === 'ready' ? (
          <FoodMapLayer
            ref={mapRef}
            initialRegion={initialRegion}
            userLocation={userLocation}
            vendors={filteredVendors}
            selectedVendorId={selectedVendor.id}
            onSelectVendor={handleSelectVendor}
          />
        ) : isNativeMobile ? (
          <View style={styles.mapPermissionGate}>
            <ActivityIndicator size="large" color={colors.green} />
            <Text style={styles.mapPermissionText}>Requesting location access…</Text>
          </View>
        ) : null}
      </View>

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
              {loadingVendors
                ? 'Loading live pins…'
                : `${filteredRestaurants.length} student-sourced spots`}
            </Text>
          </View>
          <Pressable
            style={styles.addPinButton}
            accessibilityRole="button"
            accessibilityLabel="Drop a new pin"
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={22} color={colors.white} strokeWidth={2.5} />
          </Pressable>
        </View>

        <View style={styles.searchBlock}>
          <MapSearchBar value={searchQuery} onChangeText={setSearchQuery} />
          {loadError && <Text style={styles.loadError}>{loadError}</Text>}
          <View style={styles.filterBlock}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {FILTER_OPTIONS.map((filter) => {
                const active = activeFilters.includes(filter.key);

                return (
                  <Pressable
                    key={filter.key}
                    style={[styles.filterPill, active ? styles.filterPillActive : styles.filterPillInactive]}
                    onPress={() => toggleFilter(filter.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${active ? 'Remove' : 'Apply'} ${filter.label} filter`}
                  >
                    <Text
                      style={[
                        styles.filterPillLabel,
                        active ? styles.filterPillLabelActive : styles.filterPillLabelInactive,
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountText}>{filteredRestaurants.length} spots</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <View
        style={[
          styles.resultsStrip,
          filteredRestaurants.length === 0 && styles.resultsStripEmpty,
        ]}
      >
        {filteredRestaurants.length === 0 ? (
          renderRestaurantList()
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.resultsStripContent}
            keyboardShouldPersistTaps="handled"
          >
            {renderRestaurantList()}
          </ScrollView>
        )}
      </View>

      <View style={styles.bottomSheet}>
        <VendorDetailSheet vendor={selectedVendor} onLogMeal={onLogMeal} />
      </View>

      <AddCanteenModal
        visible={showAddModal}
        latitude={userLocation.latitude}
        longitude={userLocation.longitude}
        submitting={submittingPin}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleSubmitCanteen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
  },
  webMapContainer: {
    width: '100%',
    height: 400,
    backgroundColor: colors.backgroundMuted,
    borderBottomWidth: 1,
    borderBottomColor: colors.track,
    overflow: 'hidden',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingX,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 280,
  },
  resultsStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '48%',
    paddingHorizontal: layout.screenPaddingX,
  },
  resultsStripEmpty: {
    top: 160,
    bottom: '48%',
    justifyContent: 'center',
  },
  resultsStripContent: {
    gap: spacing.sm,
    paddingRight: layout.screenPaddingX,
  },
  restaurantCard: {
    width: 220,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.track,
    ...shadows.card,
  },
  restaurantCardSelected: {
    borderColor: colors.green,
    backgroundColor: colors.greenTint15,
  },
  restaurantCardBody: {
    flexGrow: 1,
  },
  restaurantCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  restaurantName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
  },
  restaurantPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.green,
  },
  restaurantMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  openText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.green,
  },
  closedText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.coral,
  },
  restaurantTags: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: colors.muted,
    textTransform: 'capitalize',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    backgroundColor: colors.coral,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  directionsButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  mapPermissionGate: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundMuted,
    gap: spacing.md,
  },
  mapPermissionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: layout.screenPaddingX,
    gap: spacing.md,
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
  addPinButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  searchBlock: {
    gap: spacing.md,
  },
  filterBlock: {
    gap: spacing.sm,
  },
  filterRow: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  filterPillActive: {
    backgroundColor: colors.coral,
  },
  filterPillInactive: {
    backgroundColor: colors.track,
  },
  filterPillLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillLabelActive: {
    color: colors.white,
  },
  filterPillLabelInactive: {
    color: colors.muted,
  },
  filterCountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.navyTint10,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.navy,
  },
  loadError: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.coral,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
