import type { Vendor, VendorBadge, VendorType } from '../data/vendors';
import { supabase } from '../lib/supabase';

function logCanteensError(operation: string, error: { code?: string; message: string; details?: string }) {
  if (error.code === 'PGRST205' || error.message.includes("Could not find the table 'public.canteens'")) {
    console.error(
      `[PhaseIt] ${operation}: public.canteens does not exist or is not exposed via the Data API. ` +
        'Run supabase/canteens.sql in the Supabase SQL Editor, then confirm the table appears under Table Editor.',
    );
    return;
  }

  console.error(`[PhaseIt] ${operation} error:`, error.message, error.details ?? '');
}

export type CanteenRow = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  avg_price_min: number;
  avg_price_max: number;
  macro_friendly_tags: string[];
  venue_type: VendorType;
  source: VendorBadge;
  hours: string | null;
  is_open: boolean;
  hero_combo_description: string | null;
  hero_combo_price: number | null;
  submitted_by: string | null;
  created_at: string;
  updated_at: string;
};

export type InsertCanteenInput = {
  name: string;
  latitude: number;
  longitude: number;
  avgPriceMin: number;
  avgPriceMax: number;
  macroFriendlyTags: string[];
  venueType?: VendorType;
  hours?: string;
  heroComboDescription?: string;
  heroComboPrice?: number;
  submittedBy?: string;
};

const venueEmoji: Record<VendorType, string> = {
  carinderia: '🍛',
  canteen: '🏫',
  vendor: '🍢',
  fastfood: '🍔',
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function formatDistanceMeters(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): string {
  const earthRadiusM = 6371000;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(dLng / 2) ** 2;
  const meters = earthRadiusM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function canteenRowToVendor(
  row: CanteenRow,
  userLocation?: { latitude: number; longitude: number },
): Vendor {
  const startingPrice = row.hero_combo_price ?? row.avg_price_min;
  const isVeggieFriendly = row.macro_friendly_tags.includes('veggie');

  return {
    id: row.id,
    name: row.name,
    type: row.venue_type,
    badge: row.source,
    emoji: venueEmoji[row.venue_type],
    coordinate: {
      latitude: row.latitude,
      longitude: row.longitude,
    },
    startingPrice,
    rating: row.source === 'verified' ? 4.5 : 4.2,
    distance: userLocation
      ? formatDistanceMeters(
          userLocation.latitude,
          userLocation.longitude,
          row.latitude,
          row.longitude,
        )
      : '—',
    isOpen: row.is_open,
    hours: row.hours ?? 'Hours not listed',
    budgetAware: row.avg_price_min <= 60 || row.macro_friendly_tags.includes('budget-meal'),
    crowdLevel: row.source === 'verified' ? 'moderate' : 'low',
    isFavorite: row.macro_friendly_tags.includes('budget-meal'),
    isVeggieFriendly,
    macroFriendlyTags: row.macro_friendly_tags,
    heroCombo: {
      description: row.hero_combo_description ?? `Meals from ₱${row.avg_price_min}–₱${row.avg_price_max}`,
      price: startingPrice,
    },
    menu: [
      {
        name: 'Typical meal',
        price: row.avg_price_min,
      },
      {
        name: 'Hearty meal',
        price: row.avg_price_max,
      },
    ],
  };
}

export function withVendorDistance(
  vendor: Vendor,
  userLocation?: { latitude: number; longitude: number },
): Vendor {
  if (!userLocation) return vendor;

  return {
    ...vendor,
    distance: formatDistanceMeters(
      userLocation.latitude,
      userLocation.longitude,
      vendor.coordinate.latitude,
      vendor.coordinate.longitude,
    ),
  };
}

export async function fetchCanteens(): Promise<CanteenRow[]> {
  const { data, error } = await supabase
    .from('canteens')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    logCanteensError('fetchCanteens', error);
    throw error;
  }

  return (data ?? []) as CanteenRow[];
}

export async function insertCanteen(input: InsertCanteenInput): Promise<CanteenRow> {
  const payload = {
    name: input.name.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    avg_price_min: input.avgPriceMin,
    avg_price_max: input.avgPriceMax,
    macro_friendly_tags: input.macroFriendlyTags,
    venue_type: input.venueType ?? 'carinderia',
    source: 'crowdsourced' as const,
    hours: input.hours ?? null,
    hero_combo_description: input.heroComboDescription ?? null,
    hero_combo_price: input.heroComboPrice ?? input.avgPriceMin,
    submitted_by: input.submittedBy ?? null,
  };

  const { data, error } = await supabase
    .from('canteens')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    logCanteensError('insertCanteen', error);
    throw error;
  }

  return data as CanteenRow;
}
