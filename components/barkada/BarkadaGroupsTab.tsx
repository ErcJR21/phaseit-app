import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, MapPin, Plus, Zap } from 'lucide-react-native';
import { colors, shadows } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { fontWeights } from '../../theme/typography';
import type { GroupMeal } from './barkadaData';

type BarkadaGroupsTabProps = {
  meals: GroupMeal[];
  onToggleJoin: (id: string) => void;
};

export function BarkadaGroupsTab({ meals, onToggleJoin }: BarkadaGroupsTabProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Coordinate meals with your squad</Text>
        <Pressable style={styles.planButton} accessibilityRole="button" accessibilityLabel="Plan group meal">
          <Plus size={12} color={colors.white} strokeWidth={2.5} />
          <Text style={styles.planButtonText}>Plan</Text>
        </Pressable>
      </View>

      {meals.map((meal) => {
        const goingCount = meal.members.length + (meal.joined ? 1 : 0);

        return (
          <View key={meal.id} style={styles.card}>
            <View style={styles.titleRow}>
              <View style={styles.emojiTile}>
                <Text style={styles.emoji}>{meal.emoji}</Text>
              </View>
              <View style={styles.titleCopy}>
                <Text style={styles.title}>{meal.title}</Text>
                <View style={styles.placeRow}>
                  <MapPin size={12} color={colors.muted} strokeWidth={2} />
                  <Text style={styles.place}>{meal.place}</Text>
                </View>
              </View>
              <Text style={styles.priceBadge}>{meal.priceRange}</Text>
            </View>

            <View style={styles.footerRow}>
              <View style={styles.footerCopy}>
                <Text style={styles.time}>{meal.time}</Text>
                <View style={styles.membersRow}>
                  {meal.members.map((member, index) => (
                    <View key={`${meal.id}-${index}`} style={styles.memberAvatar}>
                      <Text style={styles.memberEmoji}>{member}</Text>
                    </View>
                  ))}
                  <Text style={styles.goingText}>
                    {goingCount}/{meal.slots} going
                  </Text>
                </View>
              </View>

              <Pressable
                style={[styles.joinButton, meal.joined && styles.joinButtonActive]}
                onPress={() => onToggleJoin(meal.id)}
                accessibilityRole="button"
                accessibilityLabel={meal.joined ? 'Leave group meal' : 'Join group meal'}
              >
                {meal.joined ? (
                  <View style={styles.joinedRow}>
                    <Check size={14} color={colors.green} strokeWidth={2.5} />
                    <Text style={styles.joinedText}>Joined</Text>
                  </View>
                ) : (
                  <Text style={styles.joinText}>Join +10 EXP</Text>
                )}
              </Pressable>
            </View>
          </View>
        );
      })}

      <View style={styles.tipCard}>
        <Zap size={16} color={colors.gold} fill={colors.gold} strokeWidth={0} />
        <Text style={styles.tipText}>
          Joining group meals earns <Text style={styles.tipHighlight}>+10 EXP</Text> and helps you
          discover budget-friendly spots!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  headerText: {
    flex: 1,
    fontSize: 13,
    color: colors.muted,
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  planButtonText: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    color: colors.white,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
    shadowOpacity: 0.06,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  emojiTile: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  titleCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: fontWeights.bold,
    color: colors.navy,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  place: {
    flex: 1,
    fontSize: 12,
    color: colors.muted,
  },
  priceBadge: {
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    color: colors.green,
    backgroundColor: colors.greenTint15,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  footerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  time: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    color: colors.navy,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberEmoji: {
    fontSize: 13,
  },
  goingText: {
    fontSize: 11,
    color: colors.muted,
    marginLeft: 4,
  },
  joinButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.coral,
  },
  joinButtonActive: {
    backgroundColor: colors.greenTint15,
  },
  joinText: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  joinedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  joinedText: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
    color: colors.green,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.goldTint15,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: colors.navy,
    fontWeight: fontWeights.medium,
  },
  tipHighlight: {
    fontWeight: fontWeights.bold,
    color: colors.gold,
  },
});
