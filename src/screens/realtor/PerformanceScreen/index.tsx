import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { useRealtorStatsQuery } from '@/api/hooks/useStats';
import AsyncBoundary from '@/components/common/AsyncBoundary';

const MetricRow = ({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}) => (
  <View style={styles.row}>
    <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

/**
 * Realtor performance analytics — wired to `useRealtorStatsQuery` (FE-09).
 * Was a "Coming soon" placeholder; previously migrated to ad-hoc useState/useEffect,
 * now react-query for free caching + dedupe with the dashboard's same query key.
 */
const PerformanceScreen = () => {
  const { data: stats, isLoading, isError, error, refetch, isFetching } = useRealtorStatsQuery();

  const closed = (stats?.soldCount ?? 0) + (stats?.rentedCount ?? 0);
  const totalForRate = (stats?.activeListings ?? 0) + closed;
  const conversionRate = totalForRate > 0 ? Math.round((closed / totalForRate) * 100) : 0;
  const errorMessage = isError ? (error as any)?.response?.data?.message ?? 'Could not load performance data.' : null;

  return (
    <AsyncBoundary loading={isLoading} error={errorMessage} onRetry={() => refetch()}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => refetch()} />
        }
      >
        <Text style={styles.title}>Performance</Text>
        <Text style={styles.subtitle}>Your listing activity at a glance.</Text>

        <View style={styles.highlight}>
          <Text style={styles.highlightValue}>{conversionRate}%</Text>
          <Text style={styles.highlightLabel}>Conversion rate (sold or rented)</Text>
        </View>

        <View style={styles.card}>
          <MetricRow icon="checkmark-circle" label="Active Listings" value={stats?.activeListings ?? 0} color={colors.success} />
          <MetricRow icon="create" label="Drafts" value={stats?.draftListings ?? 0} color={colors.textSecondary} />
          <MetricRow icon="time" label="Pending Approval" value={stats?.pendingApprovals ?? 0} color={colors.warning} />
          <MetricRow icon="pricetag" label="Sold" value={stats?.soldCount ?? 0} color={colors.info} />
          <MetricRow icon="key" label="Rented" value={stats?.rentedCount ?? 0} color="#8E44AD" />
          <MetricRow icon="eye" label="Total Views" value={stats?.totalViews ?? 0} color={colors.primary} />
        </View>
      </ScrollView>
    </AsyncBoundary>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  highlight: {
    borderRadius: 18,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  highlightValue: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.white,
    letterSpacing: -1,
  },
  highlightLabel: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowLabel: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  rowValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
});

export default PerformanceScreen;
