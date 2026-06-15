export type VendorType = 'carinderia' | 'canteen' | 'vendor' | 'fastfood';

export type VendorBadge = 'verified' | 'crowdsourced';

export type CrowdLevel = 'low' | 'moderate' | 'busy';

export type MenuItem = {
  name: string;
  price: number;
};

export type Vendor = {
  id: string;
  name: string;
  type: VendorType;
  badge: VendorBadge;
  emoji: string;
  coordinate: { latitude: number; longitude: number };
  startingPrice: number;
  rating: number;
  distance: string;
  isOpen: boolean;
  hours: string;
  budgetAware: boolean;
  crowdLevel: CrowdLevel;
  isFavorite: boolean;
  isVeggieFriendly: boolean;
  macroFriendlyTags: string[];
  heroCombo: { description: string; price: number };
  menu: MenuItem[];
};

/** UP Diliman campus center — matches Figma phaseeat-map neighborhood */
export const CAMPUS_CENTER = {
  latitude: 14.6537,
  longitude: 121.0689,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

export const SEED_VENDORS: Vendor[] = [
  {
    id: 'kuya-marios',
    name: "Kuya Mario's Carinderia",
    type: 'carinderia',
    badge: 'verified',
    emoji: '🍛',
    coordinate: { latitude: 14.6548, longitude: 121.0672 },
    startingPrice: 65,
    rating: 4.7,
    distance: '120m',
    isOpen: true,
    hours: '10:00 AM – 8:00 PM',
    budgetAware: true,
    crowdLevel: 'moderate',
    isFavorite: true,
    isVeggieFriendly: true,
    macroFriendlyTags: ['high-protein', 'veggie', 'budget-meal'],
    heroCombo: {
      description: 'Ulam: Adobo + Rice + Ginisang Gulay',
      price: 65,
    },
    menu: [
      { name: 'Adobo + Rice', price: 55 },
      { name: 'Sinigang + Rice', price: 60 },
      { name: 'Ginisang Gulay', price: 25 },
      { name: 'Extra Rice', price: 10 },
    ],
  },
  {
    id: 'canteen-b',
    name: 'Canteen B — UP Diliman',
    type: 'canteen',
    badge: 'verified',
    emoji: '🏫',
    coordinate: { latitude: 14.6521, longitude: 121.0701 },
    startingPrice: 55,
    rating: 4.4,
    distance: '280m',
    isOpen: true,
    hours: '7:00 AM – 6:00 PM',
    budgetAware: true,
    crowdLevel: 'busy',
    isFavorite: false,
    isVeggieFriendly: true,
    macroFriendlyTags: ['high-protein', 'veggie', 'budget-meal'],
    heroCombo: {
      description: 'Tapsilog + Iced Tea',
      price: 55,
    },
    menu: [
      { name: 'Tapsilog', price: 55 },
      { name: 'Longsilog', price: 50 },
      { name: 'Vegetable Pancit', price: 45 },
    ],
  },
  {
    id: 'tita-rosa',
    name: 'Tita Rosa Street Eats',
    type: 'vendor',
    badge: 'crowdsourced',
    emoji: '🍢',
    coordinate: { latitude: 14.6559, longitude: 121.0698 },
    startingPrice: 35,
    rating: 4.2,
    distance: '90m',
    isOpen: true,
    hours: '4:00 PM – 10:00 PM',
    budgetAware: true,
    crowdLevel: 'low',
    isFavorite: true,
    isVeggieFriendly: false,
    macroFriendlyTags: ['budget-meal'],
    heroCombo: {
      description: 'Fishball + Kwek-Kwek combo',
      price: 35,
    },
    menu: [
      { name: 'Fishball (5 pcs)', price: 20 },
      { name: 'Kwek-Kwek (3 pcs)', price: 25 },
      { name: 'Sago\'t Gulaman', price: 15 },
    ],
  },
  {
    id: 'engg-canteen',
    name: 'Engg Canteen Corner',
    type: 'canteen',
    badge: 'verified',
    emoji: '🏫',
    coordinate: { latitude: 14.6512, longitude: 121.0665 },
    startingPrice: 48,
    rating: 4.5,
    distance: '350m',
    isOpen: false,
    hours: '7:30 AM – 5:00 PM',
    budgetAware: true,
    crowdLevel: 'low',
    isFavorite: false,
    isVeggieFriendly: true,
    macroFriendlyTags: ['veggie', 'budget-meal', 'high-fiber'],
    heroCombo: {
      description: 'Vegetable Kare-Kare + Rice',
      price: 48,
    },
    menu: [
      { name: 'Kare-Kare + Rice', price: 48 },
      { name: 'Laing + Rice', price: 45 },
      { name: 'Turon', price: 15 },
    ],
  },
  {
    id: 'mang-jun',
    name: 'Mang Jun\'s Lutong Bahay',
    type: 'carinderia',
    badge: 'crowdsourced',
    emoji: '🍛',
    coordinate: { latitude: 14.6565, longitude: 121.0668 },
    startingPrice: 58,
    rating: 4.6,
    distance: '200m',
    isOpen: true,
    hours: '11:00 AM – 9:00 PM',
    budgetAware: true,
    crowdLevel: 'moderate',
    isFavorite: false,
    isVeggieFriendly: false,
    macroFriendlyTags: ['high-protein', 'budget-meal'],
    heroCombo: {
      description: 'Pork Sinigang + Rice + Gulay',
      price: 58,
    },
    menu: [
      { name: 'Sinigang + Rice', price: 58 },
      { name: 'Bicol Express + Rice', price: 62 },
      { name: 'Pinakbet', price: 30 },
    ],
  },
];

export type MapFilterKey = 'all' | 'budget' | 'openNow' | 'barkadaFavorites';

export const MAP_FILTERS: { key: MapFilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'budget', label: 'Budget Meals' },
  { key: 'openNow', label: 'Open Now' },
  { key: 'barkadaFavorites', label: 'Barkada Favorites' },
];

export const BUDGET_MEAL_MAX = 60;

export const MACRO_TAG_OPTIONS = [
  { key: 'budget-meal', label: 'Budget Meal' },
  { key: 'high-protein', label: 'High Protein' },
  { key: 'veggie', label: 'Veggie' },
  { key: 'low-fat', label: 'Low Fat' },
  { key: 'high-fiber', label: 'High Fiber' },
] as const;

export type MacroTagKey = (typeof MACRO_TAG_OPTIONS)[number]['key'];

export function filterVendors(
  vendors: Vendor[],
  filter: MapFilterKey,
  searchQuery: string,
): Vendor[] {
  const query = searchQuery.trim().toLowerCase();

  return vendors.filter((vendor) => {
    if (query && !vendor.name.toLowerCase().includes(query)) return false;

    switch (filter) {
      case 'budget':
        return vendor.startingPrice <= BUDGET_MEAL_MAX && vendor.budgetAware;
      case 'openNow':
        return vendor.isOpen;
      case 'barkadaFavorites':
        return vendor.isFavorite;
      default:
        return true;
    }
  });
}
