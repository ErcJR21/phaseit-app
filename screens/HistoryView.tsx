import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useMacros,
  type MacroHistoryEntry,
} from '../context/MacroContext';
import { colors, shadows } from '../theme/colors';
import { layout, radii, spacing } from '../theme/spacing';
import { fontWeights, typography } from '../theme/typography';

type WeeklySummary = {
  protein: number;
  carbs: number;
  fats: number;
  count: number;
};

function formatHistoryDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

type HistoryRowProps = {
  entry: MacroHistoryEntry;
  onDelete: (timestamp: string) => void;
};

function HistoryRow({ entry, onDelete }: HistoryRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.date}>{formatHistoryDate(entry.date)}</Text>
        <Pressable
          style={styles.deleteButton}
          onPress={() => onDelete(entry.timestamp)}
          accessibilityRole="button"
          accessibilityLabel={`Delete history for ${formatHistoryDate(entry.date)}`}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </Pressable>
      </View>

      <View style={styles.macroGrid}>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Protein</Text>
          <Text style={[styles.macroValue, { color: colors.coral }]}>
            {entry.macros.protein}g
          </Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Carbs</Text>
          <Text style={[styles.macroValue, { color: colors.gold }]}>
            {entry.macros.carbs}g
          </Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Fats</Text>
          <Text style={[styles.macroValue, { color: colors.navy }]}>
            {entry.macros.fats}g
          </Text>
        </View>
      </View>
    </View>
  );
}

type WeeklySummaryCardProps = {
  summary: WeeklySummary;
};

function WeeklySummaryCard({ summary }: WeeklySummaryCardProps) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Weekly Summary</Text>
      <Text style={styles.summarySubtitle}>
        Average daily macros across {summary.count}{' '}
        {summary.count === 1 ? 'entry' : 'entries'}
      </Text>

      <View style={styles.macroGrid}>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Protein</Text>
          <Text style={[styles.macroValue, { color: colors.coral }]}>
            {summary.protein}g
          </Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Carbs</Text>
          <Text style={[styles.macroValue, { color: colors.gold }]}>
            {summary.carbs}g
          </Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Fats</Text>
          <Text style={[styles.macroValue, { color: colors.navy }]}>
            {summary.fats}g
          </Text>
        </View>
      </View>
    </View>
  );
}

function EmptyHistory() {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyMessage}>No history yet</Text>
    </View>
  );
}

export function HistoryView() {
  const { history, isLoading, isReady, deleteHistoryEntry } = useMacros();

  const weeklySummary = useMemo<WeeklySummary>(() => {
    if (history.length === 0) {
      return { protein: 0, carbs: 0, fats: 0, count: 0 };
    }

    const totals = history.reduce(
      (acc, entry) => ({
        protein: acc.protein + entry.macros.protein,
        carbs: acc.carbs + entry.macros.carbs,
        fats: acc.fats + entry.macros.fats,
      }),
      { protein: 0, carbs: 0, fats: 0 },
    );

    return {
      protein: Math.round(totals.protein / history.length),
      carbs: Math.round(totals.carbs / history.length),
      fats: Math.round(totals.fats / history.length),
      count: history.length,
    };
  }, [history]);

  const listHeader = useMemo(
    () => (
      <View style={styles.headerBlock}>
        <View style={styles.header}>
          <Text style={styles.title}>Macro History</Text>
          <Text style={styles.subtitle}>Your archived daily totals</Text>
        </View>

        {history.length > 0 && <WeeklySummaryCard summary={weeklySummary} />}
      </View>
    ),
    [history.length, weeklySummary],
  );

  if (isLoading || !isReady) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.title}>Macro History</Text>
          <ActivityIndicator size="small" color={colors.green} />
          <Text style={styles.loadingText}>Loading history…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.timestamp}
        renderItem={({ item }) => (
          <HistoryRow
            entry={item}
            onDelete={(timestamp) => {
              void deleteHistoryEntry(timestamp);
            }}
          />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={EmptyHistory}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  headerBlock: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    ...typography.pageTitle,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: layout.cardPadding,
    gap: spacing.md,
    ...shadows.card,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: fontWeights.semibold,
    color: colors.navy,
  },
  summarySubtitle: {
    fontSize: 13,
    color: colors.muted,
  },
  row: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: layout.cardPadding,
    gap: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  date: {
    flex: 1,
    fontSize: 15,
    fontWeight: fontWeights.semibold,
    color: colors.navy,
  },
  deleteButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.coralTint10,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    color: colors.coral,
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  macroItem: {
    flex: 1,
    gap: spacing.xs,
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: fontWeights.medium,
    color: colors.muted,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: fontWeights.bold,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 13,
    color: colors.muted,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    ...shadows.card,
  },
  emptyMessage: {
    fontSize: 15,
    fontWeight: fontWeights.medium,
    color: colors.muted,
    textAlign: 'center',
  },
});
