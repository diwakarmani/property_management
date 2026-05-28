import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { useGroupStatsQuery } from '@/api/hooks/useStats';
import AsyncBoundary from '@/components/common/AsyncBoundary';

const StatTile = ({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) => (
  <View style={styles.tile}>
    <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon as any} size={22} color={color} />
    </View>
    <Text style={styles.tileValue}>{value}</Text>
    <Text style={styles.tileLabel}>{label}</Text>
  </View>
);

/** Group analytics — wired to `useGroupStatsQuery` (FE-09). */
const GroupAnalyticsScreen = () => {
  const { data: stats, isLoading, isError, error, refetch, isFetching } = useGroupStatsQuery();

  const topPerformers = stats?.topPerformers ?? [];
  const errorMessage = isError ? (error as any)?.response?.data?.message ?? 'Could not load group analytics.' : null;

  return (
    <AsyncBoundary loading={isLoading} error={errorMessage} onRetry={() => refetch()}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => refetch()} />
        }
      >
        <LinearGradient
          colors={[colors.primary, '#8B7CF8', '#A29BFE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroIconWrap}>
            <Ionicons name="stats-chart" size={28} color={colors.white} />
          </View>
          <Text style={styles.heroTitle}>Group Analytics</Text>
          <Text style={styles.heroSub}>Team performance overview</Text>
        </LinearGradient>

        <View style={styles.grid}>
          <StatTile icon="people" label="Members" value={stats?.totalMembers ?? 0} color={colors.primary} />
          <StatTile icon="checkmark-circle" label="Active Listings" value={stats?.activeListings ?? 0} color={colors.success} />
          <StatTile icon="time" label="Pending" value={stats?.pendingApprovals ?? 0} color={colors.warning} />
          <StatTile icon="pricetag" label="Sold (month)" value={stats?.soldThisMonth ?? 0} color={colors.info} />
          <StatTile icon="key" label="Rented (month)" value={stats?.rentedThisMonth ?? 0} color="#8E44AD" />
        </View>

        <Text style={styles.sectionTitle}>Top Performers</Text>
        {topPerformers.length === 0 ? (
          <Text style={styles.emptyText}>No performance data for this month yet.</Text>
        ) : (
          topPerformers.map((m, idx) => (
            <View key={m.userId} style={styles.performerRow}>
              <Text style={styles.rank}>#{idx + 1}</Text>
              <View style={styles.performerInfo}>
                <Text style={styles.performerName}>{m.firstName} {m.lastName}</Text>
                <Text style={styles.performerMeta}>
                  {m.activeListings} active · {m.soldThisMonth} sold this month
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </AsyncBoundary>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xl },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl + 8,
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  heroTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.white },
  heroSub: { fontSize: typography.fontSize.sm, color: 'rgba(255,255,255,0.8)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.md },
  tile: {
    width: '31%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tileValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.extrabold,
    color: colors.text,
  },
  tileLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: typography.fontWeight.medium,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  performerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  rank: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.extrabold,
    color: colors.primary,
    width: 36,
  },
  performerInfo: { flex: 1 },
  performerName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  performerMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 3,
  },
});

export default GroupAnalyticsScreen;
