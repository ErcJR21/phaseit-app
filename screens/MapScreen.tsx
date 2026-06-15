import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { ChevronLeft, MapPin, Plus } from 'lucide-react-native';
import { AddCanteenModal } from '../components/map/AddCanteenModal';
import {
  FOOD_MAP_SHEET_COLLAPSED_BODY_HEIGHT,
  FOOD_MAP_SHEET_EXPANDED_HEIGHT,
  FOOD_MAP_SHEET_HANDLE_HEIGHT,
  FoodMapBottomSheet,
  type FoodMapSheetSnap,
} from '../components/map/FoodMapBottomSheet';
import FoodMapLayer from '../components/map/FoodMapLayer';
import type { FoodMapLayerRef, MapInsets } from '../components/map/mapTypes';
import { MapSearchBar } from '../components/map/MapSearchBar';
import { VendorDetailSheet } from '../components/map/VendorDetailSheet';
import {
  restaurantToVendor,
  vendorToRestaurant,
  type Restaurant,
} from '../data/restaurants';
import { CAMPUS_CENTER } from '../data/vendors';
import type { Vendor } from '../data/vendors';
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

const FLOATING_HEADER_HEIGHT = 56;
const FLOATING_SEARCH_HEIGHT = 120;

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
  const safeInsets = useSafeAreaInsets();
  const initialCollapsedHeight =
    FOOD_MAP_SHEET_COLLAPSED_BODY_HEIGHT +
    FOOD_MAP_SHEET_HANDLE_HEIGHT +
    Math.max(safeInsets.bottom, spacing.sm);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>(INITIAL_RESTAURANTS);
  const [selectedStall, setSelectedStall] = useState<Vendor | null>(null);
  const [sheetSnap, setSheetSnap] = useState<FoodMapSheetSnap>('collapsed');
  const [sheetHeight, setSheetHeight] = useState(initialCollapsedHeight);
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
    } catch {
      setLoadError('Using offline campus pins — live database unavailable.');
      setRestaurants(INITIAL_RESTAURANTS);
    } finally {
      setLoadingVendors(false);
    }
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

  useEffect(() => {
    if (filteredVendors.length === 0) {
      setSelectedStall(null);
      return;
    }

    setSelectedStall((current) => {
      if (current) {
        const refreshed = filteredVendors.find((vendor) => vendor.id === current.id);
        if (refreshed) return refreshed;
      }
      return filteredVendors[0];
    });
  }, [filteredVendors]);

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

  const mapInsets = useMemo<MapInsets>(
    () => ({
      top: FLOATING_HEADER_HEIGHT + FLOATING_SEARCH_HEIGHT,
      bottom:
        (sheetSnap === 'expanded' ? FOOD_MAP_SHEET_EXPANDED_HEIGHT : sheetHeight) +
        spacing.md,
      left: 16,
      right: 16,
    }),
    [sheetSnap, sheetHeight],
  );

  const focusStall = useCallback(
    (stall: Vendor, snap: FoodMapSheetSnap = sheetSnap) => {
      if (!mapRef.current) return;

      const bottomInset =
        (snap === 'expanded' ? FOOD_MAP_SHEET_EXPANDED_HEIGHT : sheetHeight) + spacing.md;

      mapRef.current.focusOnCoordinate(stall.coordinate, {
        top: FLOATING_HEADER_HEIGHT + FLOATING_SEARCH_HEIGHT,
        bottom: bottomInset,
        left: 16,
        right: 16,
      });
    },
    [sheetHeight, sheetSnap],
  );

  const selectStall = useCallback((stall: Vendor, expandSheet = true) => {
    setSelectedStall(stall);
    if (expandSheet) {
      setSheetSnap('expanded');
    }
  }, []);

  const handleSheetSnapChange = useCallback(
    (snap: FoodMapSheetSnap) => {
      setSheetSnap(snap);
      if (snap === 'collapsed' && selectedStall) {
        setTimeout(() => focusStall(selectedStall, 'collapsed'), 80);
      }
    },
    [selectedStall, focusStall],
  );

  useEffect(() => {
    if (!selectedStall) return;

    const focusDelay = sheetSnap === 'expanded' ? 120 : 0;
    const timer = setTimeout(() => focusStall(selectedStall, sheetSnap), focusDelay);

    return () => clearTimeout(timer);
  }, [selectedStall, sheetSnap, focusStall]);

  const handleSubmitCanteen = async (input: InsertCanteenInput) => {
    setSubmittingPin(true);

    try {
      const row = await insertCanteen(input);
      const newRestaurant = vendorToRestaurant(canteenRowToVendor(row));
      const newStall = withVendorDistance(canteenRowToVendor(row), userLocation);

      setRestaurants((current) => [newRestaurant, ...current]);
      selectStall(newStall);
      setLoadError(null);
    } finally {
      setSubmittingPin(false);
    }
  };

  const initialRegion = {
    ...CAMPUS_CENTER,
  };

  const renderRestaurantCard = (restaurant: Restaurant) => {
    const stall = filteredVendors.find((vendor) => vendor.id === restaurant.id);
    const selected = stall?.id === selectedStall?.id;
    const { latitude, longitude } = restaurantToVendor(restaurant).coordinate;

    return (
      <View
        key={restaurant.id}
        style={[styles.restaurantCard, selected && styles.restaurantCardSelected]}
      >
        <Pressable
          onPress={() => stall && selectStall(stall)}
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

  const collapsedSheetContent =
    filteredRestaurants.length === 0 ? (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No restaurants found matching your criteria.</Text>
      </View>
    ) : (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.resultsStripContent}
        keyboardShouldPersistTaps="handled"
      >
        {filteredRestaurants.map(renderRestaurantCard)}
      </ScrollView>
    );

  const showMapLayer =
    Platform.OS === 'web' || (isNativeMobile && locationPermission === 'ready');

  if (loadingVendors || !selectedStall) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.workspace}>
        {showMapLayer ? (
          <FoodMapLayer
            ref={mapRef}
            initialRegion={initialRegion}
            userLocation={userLocation}
            vendors={filteredVendors}
            selectedStallId={selectedStall.id}
            onSelectStall={selectStall}
            mapInsets={mapInsets}
          />
        ) : isNativeMobile ? (
          <View style={styles.mapPermissionGate}>
            <ActivityIndicator size="large" color={colors.green} />
            <Text style={styles.mapPermissionText}>Requesting location access…</Text>
          </View>
        ) : null}

        {/* Transparent top overlay — does not cover the full screen */}
        <View
          style={[styles.floatingOverlay, { paddingTop: safeInsets.top }]}
        >
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
        </View>

        <FoodMapBottomSheet
          snap={sheetSnap}
          onSnapChange={handleSheetSnapChange}
          onHeightChange={setSheetHeight}
          collapsedContent={collapsedSheetContent}
          expandedContent={
            <VendorDetailSheet
              key={selectedStall.id}
              vendor={selectedStall}
              onLogMeal={onLogMeal}
              embedded
            />
          }
        />
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
    width: '100%',
    backgroundColor: colors.background,
    ...(Platform.OS === 'web'
      ? ({ height: '100%', minHeight: '100%' } as const)
      : null),
  },
  workspace: {
    flex: 1,
    position: 'relative',
    width: '100%',
    minHeight: 0,
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
  resultsStripContent: {
    gap: spacing.sm,
    paddingHorizontal: layout.screenPaddingX,
    paddingRight: layout.screenPaddingX * 2,
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
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
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
  floatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    paddingHorizontal: layout.screenPaddingX,
    gap: spacing.md,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
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
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.card,
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
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    padding: spacing.sm,
    ...shadows.card,
    shadowOpacity: 0.1,
    shadowRadius: 14,
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
});
