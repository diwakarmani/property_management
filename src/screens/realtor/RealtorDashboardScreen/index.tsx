import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { colors, typography, spacing } from '@/theme';
import { RealtorService } from '@/api/services/realtor.service';
import type { RealtorStatsDTO } from '@/api/types/property.types';
import type { RootState } from '@/store';

const formatNumber = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

const StatCard = ({ icon, title, value, color }: { icon: string; title: string; value: string; color: string }) => (
  <View style={styles.statCard}>
    <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon as any} size={24} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const RealtorDashboardScreen = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [stats, setStats] = useState<RealtorStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    RealtorService.getStats()
      .then(res => setStats(res.data.data))
      .catch(err => console.error('Failed to load stats', err))
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
      <Text style={styles.greeting}>
        Welcome, {user?.firstName ?? 'Realtor'}!
      </Text>

      <View style={styles.statsGrid}>
        <StatCard
          icon="list"
          title="Active Listings"
          value={formatNumber(stats?.activeListings ?? 0)}
          color={colors.primary}
        />
        <StatCard
          icon="document-outline"
          title="Drafts"
          value={formatNumber(stats?.draftListings ?? 0)}
          color="#95A5A6"
        />
        <StatCard
          icon="time-outline"
          title="Pending Approval"
          value={formatNumber(stats?.pendingApprovals ?? 0)}
          color={colors.warning}
        />
        <StatCard
          icon="checkmark-done"
          title="Sold"
          value={formatNumber(stats?.soldCount ?? 0)}
          color={colors.success}
        />
        <StatCard
          icon="home-outline"
          title="Rented"
          value={formatNumber(stats?.rentedCount ?? 0)}
          color="#8E44AD"
        />
        <StatCard
          icon="eye-outline"
          title="Total Views"
          value={formatNumber(stats?.totalViews ?? 0)}
          color="#2980B9"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.overviewRow}>
          <Text style={styles.overviewLabel}>Total Listings</Text>
          <Text style={styles.overviewValue}>
            {(stats?.activeListings ?? 0) + (stats?.draftListings ?? 0) +
             (stats?.pendingApprovals ?? 0) + (stats?.soldCount ?? 0) + (stats?.rentedCount ?? 0)}
          </Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.overviewLabel}>Properties Sold</Text>
          <Text style={styles.overviewValue}>{stats?.soldCount ?? 0}</Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.overviewLabel}>Properties Rented</Text>
          <Text style={styles.overviewValue}>{stats?.rentedCount ?? 0}</Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.overviewLabel}>Total Property Views</Text>
          <Text style={styles.overviewValue}>{formatNumber(stats?.totalViews ?? 0)}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  greeting: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
  },
  statTitle: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  section: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.lg,
  },
  sectionTitle: { fontSize: typography.fontSize.lg, fontWeight: 'bold', marginBottom: spacing.md },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  overviewLabel: { fontSize: typography.fontSize.md, color: colors.text },
  overviewValue: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.primary },
});

export default RealtorDashboardScreen;
