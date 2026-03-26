import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { AnalyticsService, type PlatformStatsDTO } from '@/api/services/analytics.service';

const StatRow = ({ label, value, iconName, color }: { label: string; value: string | number; iconName: string; color: string }) => (
  <View style={styles.statRow}>
    <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={iconName as any} size={18} color={color} />
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

const MetricCard = ({ title, value, sub }: { title: string; value: string | number; sub?: string }) => (
  <View style={styles.metricCard}>
    <Text style={styles.metricTitle}>{title}</Text>
    <Text style={styles.metricValue}>{value}</Text>
    {sub ? <Text style={styles.metricSub}>{sub}</Text> : null}
  </View>
);

const PlatformAnalyticsScreen = () => {
  const [stats, setStats] = useState<PlatformStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    AnalyticsService.getPlatformStats()
      .then(res => setStats(res.data.data))
      .catch(err => console.error('Failed to load platform stats', err))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchStats(true)} />}
    >
      <Text style={styles.heading}>Platform Analytics</Text>

      {/* Top metric cards */}
      <View style={styles.metricsGrid}>
        <MetricCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          sub={`+${stats?.newUsersThisMonth ?? 0} this month`}
        />
        <MetricCard
          title="Total Properties"
          value={stats?.totalProperties ?? 0}
          sub={`+${stats?.newPropertiesThisMonth ?? 0} this month`}
        />
        <MetricCard
          title="Active Listings"
          value={stats?.activeListings ?? 0}
        />
        <MetricCard
          title="Pending Review"
          value={stats?.pendingApprovals ?? 0}
        />
      </View>

      {/* Properties breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Properties by Status</Text>
        <StatRow label="Active" value={stats?.activeListings ?? 0} iconName="checkmark-circle" color={colors.success} />
        <StatRow label="Pending Approval" value={stats?.pendingApprovals ?? 0} iconName="time" color={colors.warning} />
        <StatRow label="Sold" value={stats?.soldProperties ?? 0} iconName="cash" color="#2980B9" />
        <StatRow label="Rented" value={stats?.rentedProperties ?? 0} iconName="key" color="#8E44AD" />
      </View>

      {/* Groups */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Realtor Groups</Text>
        <StatRow label="Total Groups" value={stats?.totalGroups ?? 0} iconName="business" color={colors.primary} />
        <StatRow label="Active Groups" value={stats?.activeGroups ?? 0} iconName="checkmark-circle" color={colors.success} />
        <StatRow label="Pending Groups" value={(stats?.totalGroups ?? 0) - (stats?.activeGroups ?? 0)} iconName="time" color={colors.warning} />
      </View>

      {/* This Month */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Month</Text>
        <StatRow label="New Users" value={stats?.newUsersThisMonth ?? 0} iconName="person-add" color={colors.primary} />
        <StatRow label="New Properties" value={stats?.newPropertiesThisMonth ?? 0} iconName="home" color="#27AE60" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: typography.fontSize['2xl'], fontWeight: 'bold', padding: spacing.lg },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  metricCard: {
    width: '47%',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  metricTitle: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  metricValue: { fontSize: typography.fontSize['2xl'], fontWeight: 'bold', marginTop: spacing.xs, color: colors.text },
  metricSub: { fontSize: typography.fontSize.xs, color: colors.success, marginTop: 4 },
  section: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
  },
  sectionTitle: { fontSize: typography.fontSize.lg, fontWeight: 'bold', marginBottom: spacing.md },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: { flex: 1, fontSize: typography.fontSize.md, color: colors.text },
  statValue: { fontSize: typography.fontSize.lg, fontWeight: 'bold' },
});

export default PlatformAnalyticsScreen;
