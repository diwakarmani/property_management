import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { AnalyticsService, type PlatformStatsDTO } from '@/api/services/analytics.service';

const StatRow = ({ label, value, iconName, color, onPress }: {
  label: string;
  value: string | number;
  iconName: string;
  color: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    style={styles.statRow}
    onPress={onPress}
    disabled={!onPress}
    accessibilityRole={onPress ? 'button' : undefined}
    accessibilityLabel={onPress ? `View ${label}` : undefined}
  >
    <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={iconName as any} size={18} color={color} />
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textLight} /> : null}
  </TouchableOpacity>
);

const MetricCard = ({ title, value, sub, onPress }: {
  title: string;
  value: string | number;
  sub?: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    style={styles.metricCard}
    onPress={onPress}
    disabled={!onPress}
    accessibilityRole={onPress ? 'button' : undefined}
    accessibilityLabel={onPress ? `View ${title}` : undefined}
  >
    <Text style={styles.metricTitle}>{title}</Text>
    <Text style={styles.metricValue}>{value}</Text>
    {sub ? <Text style={styles.metricSub}>{sub}</Text> : null}
  </TouchableOpacity>
);

type AdminListingStatus = 'ALL' | 'ACTIVE' | 'PENDING_APPROVAL' | 'SOLD' | 'RENTED';

const PlatformAnalyticsScreen = ({ navigation }: any) => {
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

  const tabNavigation = navigation.getParent?.() ?? navigation;
  const openUsers = () => tabNavigation.navigate('Users', {
    screen: 'ManageUsers',
    params: { roleFilter: null },
  });
  const openListings = (status: AdminListingStatus) =>
    navigation.navigate('AdminListings', { status });

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
      <LinearGradient
        colors={[colors.primary, '#8B7CF8', '#A29BFE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroIconWrap}>
          <Ionicons name="bar-chart" size={32} color={colors.white} />
        </View>
        <Text style={styles.heroTitle}>Platform Analytics</Text>
        <Text style={styles.heroSub}>Live overview of all platform activity</Text>
      </LinearGradient>

      {/* Top metric cards */}
      <View style={styles.metricsGrid}>
        <MetricCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          sub={`+${stats?.newUsersThisMonth ?? 0} this month`}
          onPress={openUsers}
        />
        <MetricCard
          title="Total Properties"
          value={stats?.totalProperties ?? 0}
          sub={`+${stats?.newPropertiesThisMonth ?? 0} this month`}
          onPress={() => openListings('ALL')}
        />
        <MetricCard
          title="Active Listings"
          value={stats?.activeListings ?? 0}
          onPress={() => openListings('ACTIVE')}
        />
        <MetricCard
          title="Pending Review"
          value={stats?.pendingApprovals ?? 0}
          onPress={() => openListings('PENDING_APPROVAL')}
        />
      </View>

      {/* Properties breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Properties by Status</Text>
        <StatRow label="Active" value={stats?.activeListings ?? 0} iconName="checkmark-circle" color={colors.success} onPress={() => openListings('ACTIVE')} />
        <StatRow label="Pending Approval" value={stats?.pendingApprovals ?? 0} iconName="time" color={colors.warning} onPress={() => openListings('PENDING_APPROVAL')} />
        <StatRow label="Sold" value={stats?.soldProperties ?? 0} iconName="cash" color="#2980B9" onPress={() => openListings('SOLD')} />
        <StatRow label="Rented" value={stats?.rentedProperties ?? 0} iconName="key" color="#8E44AD" onPress={() => openListings('RENTED')} />
      </View>

      {/* This Month */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Month</Text>
        <StatRow label="New Users" value={stats?.newUsersThisMonth ?? 0} iconName="person-add" color={colors.primary} onPress={openUsers} />
        <StatRow label="New Properties" value={stats?.newPropertiesThisMonth ?? 0} iconName="home" color="#27AE60" onPress={() => openListings('ALL')} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl + 8,
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  heroTitle: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.white },
  heroSub: { fontSize: typography.fontSize.sm, color: 'rgba(255,255,255,0.8)' },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  metricCard: {
    width: '47%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  metricTitle: { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontWeight: typography.fontWeight.medium },
  metricValue: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, marginTop: spacing.xs, color: colors.text },
  metricSub: { fontSize: typography.fontSize.xs, color: colors.success, marginTop: 4 },
  section: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text, marginBottom: spacing.md },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: { flex: 1, fontSize: typography.fontSize.md, color: colors.text },
  statValue: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
});

export default PlatformAnalyticsScreen;
