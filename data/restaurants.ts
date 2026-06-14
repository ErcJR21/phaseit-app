import { BUDGET_MEAL_MAX, SEED_VENDORS, type Vendor } from './vendors';

export type Restaurant = {
  id: string;
  name: string;
  tags: string[];
  price: number;
  isOpen: boolean;
  isFavorite?: boolean;
};

export const SAMPLE_RESTAURANTS: Restaurant[] = [
  {
    id: 'kuya-marios',
    name: "Kuya Mario's Carinderia",
    tags: ['high-protein', 'veggie', 'budget-meal'],
    price: 65,
    isOpen: true,
    isFavorite: true,
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
    isFavorite: true,
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

export function filterRestaurants(
  restaurants: Restaurant[],
  searchQuery: string,
  activeFilters: string[] = [],
): Restaurant[] {
  const query = searchQuery.trim().toLowerCase();

  return restaurants.filter((restaurant) => {
    if (query) {
      const matchesName = restaurant.name.toLowerCase().includes(query);
      const matchesTags = restaurant.tags.some((tag) =>
        tag.toLowerCase().includes(query),
      );

      if (!matchesName && !matchesTags) return false;
    }

    if (activeFilters.length > 0) {
      const matchesActiveFilters = activeFilters.every((filter) =>
        restaurant.tags.includes(filter),
      );

      if (!matchesActiveFilters) return false;
    }

    return true;
  });
}

export function restaurantToVendor(restaurant: Restaurant): Vendor {
  const seed = SEED_VENDORS.find((vendor) => vendor.id === restaurant.id);

  if (seed) {
    return {
      ...seed,
      name: restaurant.name,
      startingPrice: restaurant.price,
      isOpen: restaurant.isOpen,
      macroFriendlyTags: restaurant.tags,
      isFavorite: restaurant.isFavorite ?? seed.isFavorite,
      budgetAware:
        restaurant.price <= BUDGET_MEAL_MAX ||
        restaurant.tags.includes('budget-meal'),
      heroCombo: {
        ...seed.heroCombo,
        price: restaurant.price,
      },
    };
  }

  return {
    id: restaurant.id,
    name: restaurant.name,
    type: 'vendor',
    badge: 'crowdsourced',
    emoji: '🍽️',
    coordinate: { latitude: 14.6537, longitude: 121.0689 },
    startingPrice: restaurant.price,
    rating: 4.2,
    distance: '—',
    isOpen: restaurant.isOpen,
    hours: 'Hours not listed',
    budgetAware:
      restaurant.price <= BUDGET_MEAL_MAX ||
      restaurant.tags.includes('budget-meal'),
    crowdLevel: 'low',
    isFavorite: restaurant.isFavorite ?? false,
    isVeggieFriendly: restaurant.tags.includes('veggie'),
    macroFriendlyTags: restaurant.tags,
    heroCombo: {
      description: `Meals from ₱${restaurant.price}`,
      price: restaurant.price,
    },
    menu: [{ name: 'Typical meal', price: restaurant.price }],
  };
}

export function vendorToRestaurant(vendor: Vendor): Restaurant {
  return {
    id: vendor.id,
    name: vendor.name,
    tags: vendor.macroFriendlyTags,
    price: vendor.startingPrice,
    isOpen: vendor.isOpen,
    isFavorite: vendor.isFavorite,
  };
}
