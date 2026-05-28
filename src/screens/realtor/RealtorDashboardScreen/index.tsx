import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { colors, typography, spacing } from '@/theme';
import { useRealtorStatsQuery } from '@/api/hooks/useStats';
import AsyncBoundary from '@/components/common/AsyncBoundary';
import type { RootState } from '@/store';

const formatNumber = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

const STAT_CONFIG = [
  { key: 'activeListings',   icon: 'list',           label: 'Active',    color: colors.primary,  bg: colors.primarySurface },
  { key: 'draftListings',    icon: 'document-text',  label: 'Drafts',    color: '#64748B',       bg: '#F1F5F9' },
  { key: 'pendingApprovals', icon: 'time',           label: 'Pending',   color: colors.warning,  bg: colors.warningSurface },
  { key: 'soldCount',        icon: 'checkmark-done', label: 'Sold',      color: colors.success,  bg: colors.successSurface },
  { key: 'rentedCount',      icon: 'home',           label: 'Rented',    color: '#8B5CF6',       bg: '#F5F3FF' },
  { key: 'totalViews',       icon: 'eye',            label: 'Views',     color: colors.info,     bg: colors.infoSurface },
];

const StatCard = ({
  icon, label, value, color, bg,
}: { icon: string; label: string; value: string; color: string; bg: string }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconWrap, { backgroundColor: bg }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const RealtorDashboardScreen = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: stats, isLoading, isError, error, refetch, isFetching } = useRealtorStatsQuery();
  const errorMessage = isError
    ? (error as any)?.response?.data?.message ?? 'Could not load dashboard stats.'
    : null;

  return (
    <AsyncBoundary loading={isLoading} error={errorMessage} onRetry={() => refetch()}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => refetch()}
            tintColor={colors.primary}
          />
        }
      >
        {/* Hero Banner */}
        <LinearGradient
          colors={[colors.primary, colors.gradientMid, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroAvatarWrap}>
            <View style={styles.heroAvatar}>
              <Ionicons name="person" size={24} color={colors.primary} />
            </View>
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroGreeting}>Welcome back,</Text>
            <Text style={styles.heroName}>{user?.firstName ?? 'Realtor'} 👋</Text>
          </View>
          <View style={styles.heroTotalBadge}>
            <Text style={styles.heroTotalValue}>
              {(stats?.activeListings ?? 0) + (stats?.draftListings ?? 0) +
               (stats?.pendingApprovals ?? 0) + (stats?.soldCount ?? 0) + (stats?.rentedCount ?? 0)}
            </Text>
            <Text style={styles.heroTotalLabel}>Total</Text>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.statsGrid}>
            {STAT_CONFIG.map(({ key, icon, label, color, bg }) => (
              <StatCard
                key={key}
                icon={icon}
                label={label}
                value={formatNumber(stats?.[key as keyof typeof stats] as number ?? 0)}
                color={color}
                bg={bg}
              />
            ))}
          </View>
        </View>

        {/* Overview Table */}
        <View style={styles.overviewCard}>
          <Text style={styles.sectionTitle}>Overview</Text>
          {[
            { label: 'Active Listings',   value: stats?.activeListings ?? 0 },
            { label: 'Properties Sold',   value: stats?.soldCount ?? 0 },
            { label: 'Properties Rented', value: stats?.rentedCount ?? 0 },
            { label: 'Total Views',       value: formatNumber(stats?.totalViews ?? 0) },
            { label: 'Pending Approval',  value: stats?.pendingApprovals ?? 0 },
          ].map((row, i) => (
            <View key={i} style={[styles.overviewRow, i === 4 && styles.overviewRowLast]}>
              <Text style={styles.overviewLabel}>{row.label}</Text>
              <View style={styles.overviewValueWrap}>
                <Text style={styles.overviewValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </AsyncBoundary>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  heroAvatarWrap: {},
  heroAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  heroTextWrap: { flex: 1 },
  heroGreeting: { fontSize: typography.fontSize.sm, color: 'rgba(255,255,255,0.85)' },
  heroName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginTop: 2,
  },
  heroTotalBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroTotalValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.extrabold,
    color: colors.white,
  },
  heroTotalLabel: { fontSize: typography.fontSize.xs, color: 'rgba(255,255,255,0.85)' },

  statsSection: { padding: spacing.md, paddingTop: spacing.lg },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: {
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
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.extrabold,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },

  overviewCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  overviewRowLast: { borderBottomWidth: 0 },
  overviewLabel: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  overviewValueWrap: {
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  overviewValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
});

export default RealtorDashboardScreen;
