import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { Camera, ChevronUp, MapPin, Shield, Star } from 'lucide-react-native';
import type { Vendor } from '../../data/vendors';
import { colors, shadows } from '../../theme/colors';
import { layout, radii, spacing } from '../../theme/spacing';

type VendorDetailSheetProps = {
  vendor: Vendor;
  onLogMeal?: () => void;
};

function buildGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

async function handleGetDirections(lat: number, lng: number): Promise<void> {
  const url = buildGoogleMapsUrl(lat, lng);

  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    await Linking.openURL(url);
  } catch (error) {
    console.warn('[VendorDetailSheet] Failed to open directions:', error);
  }
}

const crowdLabels = {
  low: { emoji: '🟢', label: 'Low crowd' },
  moderate: { emoji: '🟡', label: 'Moderate' },
  busy: { emoji: '🔴', label: 'Busy' },
} as const;

export function VendorDetailSheet({ vendor, onLogMeal }: VendorDetailSheetProps) {
  const [expanded, setExpanded] = useState(false);
  const crowd = crowdLabels[vendor.crowdLevel];

  const onDirectionsPress = () => {
    const { latitude, longitude } = vendor.coordinate;
    void handleGetDirections(latitude, longitude);
  };

  return (
    <View style={styles.sheet}>
          <Pressable
            style={styles.handleRow}
            onPress={() => setExpanded((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Collapse menu' : 'Expand menu'}
          >
        <View style={styles.handle} />
        <ChevronUp
          size={16}
          color={colors.muted}
          strokeWidth={2}
          style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {vendor.name}
        </Text>
        <View style={styles.ratingBadge}>
          <Star size={12} color={colors.gold} fill={colors.gold} strokeWidth={0} />
          <Text style={styles.ratingText}>{vendor.rating.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.badgeRow}>
        <View
          style={[
            styles.sourceBadge,
            vendor.badge === 'verified' ? styles.verifiedBadge : styles.crowdBadge,
          ]}
        >
          <Text
            style={[
              styles.sourceBadgeText,
              vendor.badge === 'verified' ? styles.verifiedText : styles.crowdText,
            ]}
          >
            {vendor.badge === 'verified' ? 'Verified' : 'Crowd-sourced'}
          </Text>
        </View>
      </View>

      <Text style={styles.metaRow}>
        {vendor.distance} ·{' '}
        <Text style={vendor.isOpen ? styles.openText : styles.closedText}>
          {vendor.isOpen ? 'Open Now' : 'Closed'}
        </Text>
        {vendor.budgetAware ? ' · ₱₱ Budget-Aware' : ''} · {crowd.emoji} {crowd.label}
      </Text>

      {vendor.macroFriendlyTags.length > 0 && (
        <View style={styles.macroTagRow}>
          {vendor.macroFriendlyTags.map((tag) => (
            <View key={tag} style={styles.macroTag}>
              <Text style={styles.macroTagText}>{tag.replace(/-/g, ' ')}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Student combo</Text>
        <View style={styles.heroRow}>
          <Text style={styles.heroDescription}>{vendor.heroCombo.description}</Text>
          <Text style={styles.heroPrice}>₱{vendor.heroCombo.price}</Text>
        </View>
      </View>

      <View style={styles.shieldBar}>
        <Shield size={14} color={colors.green} strokeWidth={2} />
        <Text style={styles.shieldText}>
          Aggregated safety status active — no GPS shared
        </Text>
      </View>

      {expanded && (
        <ScrollView style={styles.menuList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {vendor.menu.map((item) => (
            <View key={item.name} style={styles.menuRow}>
              <Text style={styles.menuName}>{item.name}</Text>
              <Text style={styles.menuPrice}>₱{item.price}</Text>
            </View>
          ))}
          <View style={styles.updatePrices}>
            <Text style={styles.updatePricesText}>Update prices</Text>
          </View>
        </ScrollView>
      )}

      <View style={styles.ctaRow}>
        <Pressable
          style={styles.directionsButton}
          onPress={onDirectionsPress}
          accessibilityRole="button"
          accessibilityLabel={`Get directions to ${vendor.name}`}
        >
          <MapPin size={18} color={colors.white} strokeWidth={2} />
          <Text style={styles.directionsText}>Get Directions</Text>
        </Pressable>
        <Pressable
          style={styles.logButton}
          onPress={onLogMeal}
          accessibilityRole="button"
          accessibilityLabel="Log meal with AI camera"
        >
          <Camera size={18} color={colors.navy} strokeWidth={2} />
          <Text style={styles.logText}>Log with AI Cam</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: layout.screenPaddingX,
    paddingBottom: spacing.lg,
    maxHeight: '48%',
    ...shadows.card,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.track,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.goldTint15,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  sourceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  verifiedBadge: {
    backgroundColor: colors.greenTint15,
  },
  crowdBadge: {
    backgroundColor: colors.coralTint15,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  verifiedText: {
    color: colors.green,
  },
  crowdText: {
    color: colors.coral,
  },
  metaRow: {
    marginTop: spacing.sm,
    fontSize: 12,
    fontWeight: '500',
    color: colors.muted,
    lineHeight: 18,
  },
  openText: {
    color: colors.green,
    fontWeight: '600',
  },
  closedText: {
    color: colors.coral,
    fontWeight: '600',
  },
  macroTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  macroTag: {
    backgroundColor: colors.greenTint15,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  macroTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.green,
    textTransform: 'capitalize',
  },
  heroCard: {
    marginTop: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 4,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  heroDescription: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
    lineHeight: 20,
  },
  heroPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.green,
  },
  shieldBar: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.greenTint15,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  shieldText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: colors.navy,
    lineHeight: 15,
  },
  menuList: {
    marginTop: spacing.md,
    maxHeight: 120,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.track,
  },
  menuName: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.navy,
  },
  menuPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.green,
  },
  updatePrices: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: 4,
  },
  updatePricesText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.coral,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  directionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.coral,
    borderRadius: radii.lg,
    paddingVertical: 14,
    ...shadows.card,
    shadowColor: colors.coral,
    shadowOpacity: 0.25,
  },
  directionsText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  logButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.navy,
    borderRadius: radii.lg,
    paddingVertical: 12,
  },
  logText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
  },
});
