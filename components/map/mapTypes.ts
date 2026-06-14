import type { Vendor } from '../../data/vendors';

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type FoodMapLayerRef = {
  animateToRegion: (region: MapRegion, duration?: number) => void;
};

export type FoodMapLayerProps = {
  initialRegion: MapRegion;
  userLocation: MapCoordinate;
  vendors: Vendor[];
  selectedVendorId: string;
  onSelectVendor: (vendorId: string) => void;
};
