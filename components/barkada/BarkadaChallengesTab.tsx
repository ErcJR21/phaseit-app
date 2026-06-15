import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, Flame, Star, Zap } from 'lucide-react-native';
import { colors, shadows } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { fontWeights } from '../../theme/typography';
import { DIFFICULTY_COLORS, type Challenge } from './barkadaData';

type BarkadaChallengesTabProps = {
  challenges: Challenge[];
  onToggleJoin: (id: string) => void;
};

function ChallengeCard({
  challenge,
  onToggle,
}: {
  challenge: Challenge;
  onToggle: (id: string) => void;
}) {
  const pct = Math.min(100, Math.round((challenge.progress / challenge.goal) * 100));
  const diffColor = DIFFICULTY_COLORS[challenge.difficulty];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.emojiTile}>
          <Text style={styles.emoji}>{challenge.emoji}</Text>
        </View>
        <View style={styles.headerCopy}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{challenge.title}</Text>
            <Text style={[styles.difficulty, { color: diffColor, backgroundColor: `${diffColor}18` }]}>
              {challenge.difficulty}
            </Text>
          </View>
          <Text style={styles.description}>{challenge.description}</Text>
        </View>
        <Text style={styles.daysLeft}>{challenge.daysLeft}d left</Text>
      </View>

      {challenge.joined ? (
        <>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {challenge.progress}/{challenge.goal} days completed
          </Text>
        </>
      ) : null}

      <View style={styles.footerRow}>
        <View style={styles.rewardCopy}>
          <View style={styles.expRow}>
            <Zap size={12} color={colors.gold} fill={colors.gold} strokeWidth={0} />
            <Text style={styles.expText}>+{challenge.expReward} EXP on completion</Text>
          </View>
          {challenge.badgeReward ? (
            <Text style={styles.badgeText}>Badge: {challenge.badgeReward}</Text>
          ) : null}
          <Text style={styles.participantsText}>{challenge.participants} participating</Text>
        </View>

        <Pressable
          style={[styles.joinButton, challenge.joined && styles.joinButtonActive]}
          onPress={() => onToggle(challenge.id)}
          accessibilityRole="button"
          accessibilityLabel={challenge.joined ? 'Leave challenge' : 'Join challenge'}
        >
          {challenge.joined ? (
            <View style={styles.joinedRow}>
              <Check size={12} color={colors.green} strokeWidth={2.5} />
              <Text style={styles.joinedText}>Joined</Text>
            </View>
          ) : (
            <Text style={styles.joinText}>Join +15 EXP</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export function BarkadaChallengesTab({ challenges, onToggleJoin }: BarkadaChallengesTabProps) {
  const joined = challenges.filter((item) => item.joined);
  const available = challenges.filter((item) => !item.joined);

  return (
    <View style={styles.wrap}>
      {joined.length > 0 ? (
        <>
          <View style={styles.sectionHeader}>
            <Flame size={16} color={colors.coral} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Your Active Challenges</Text>
          </View>
          {joined.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} onToggle={onToggleJoin} />
          ))}
        </>
      ) : null}

      {available.length > 0 ? (
        <>
          <View style={styles.sectionHeader}>
            <Star size={16} color={colors.gold} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Available to Join</Text>
          </View>
          {available.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} onToggle={onToggleJoin} />
          ))}
        </>
      ) : null}

      <View style={styles.guideCard}>
        <Text style={styles.guideTitle}>How EXP Works</Text>
        {[
          { action: 'Log a meal', exp: '+15 EXP' },
          { action: 'Stay under budget', exp: '+10 EXP/day' },
          { action: 'Join a group meal', exp: '+10 EXP' },
          { action: 'Complete a challenge', exp: '+40–80 EXP' },
          { action: 'Daily streak bonus', exp: '+5 EXP/day' },
        ].map((row) => (
          <View key={row.action} style={styles.guideRow}>
            <Text style={styles.guideAction}>{row.action}</Text>
            <Text style={styles.guideExp}>{row.exp}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: fontWeights.bold,
    color: colors.navy,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
    shadowOpacity: 0.08,
  },
  cardHeader: {
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
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: fontWeights.bold,
    color: colors.navy,
  },
  difficulty: {
    fontSize: 10,
    fontWeight: fontWeights.semibold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  description: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 17,
  },
  daysLeft: {
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    color: colors.coral,
    backgroundColor: colors.coralTint15,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  progressTrack: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.track,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.green,
  },
  progressLabel: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rewardCopy: {
    flex: 1,
    gap: 2,
  },
  expRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expText: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    color: colors.gold,
  },
  badgeText: {
    fontSize: 11,
    color: colors.muted,
  },
  participantsText: {
    fontSize: 11,
    color: colors.muted,
  },
  joinButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.navy,
  },
  joinButtonActive: {
    backgroundColor: colors.greenTint15,
  },
  joinText: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  joinedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  joinedText: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    color: colors.green,
  },
  guideCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
    shadowOpacity: 0.06,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.track,
  },
  guideAction: {
    fontSize: 12,
    color: colors.muted,
  },
  guideExp: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    color: colors.gold,
  },
});
