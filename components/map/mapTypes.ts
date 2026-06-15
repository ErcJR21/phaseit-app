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
  focusOnCoordinate: (coordinate: MapCoordinate, insets: MapInsets) => void;
};

export type MapInsets = {
  top: number;
  right?: number;
  bottom: number;
  left?: number;
};

export type FoodMapLayerProps = {
  initialRegion: MapRegion;
  userLocation: MapCoordinate;
  vendors: Vendor[];
  selectedStallId: string | null;
  onSelectStall: (stall: Vendor) => void;
  mapInsets?: MapInsets;
};
