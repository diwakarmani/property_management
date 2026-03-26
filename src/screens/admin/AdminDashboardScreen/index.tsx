import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { AnalyticsService, type PlatformStatsDTO } from '@/api/services/analytics.service';
import { AdminService } from '@/api/services/admin.service';

const AdminDashboardScreen = ({ navigation }: any) => {
  const [stats, setStats] = useState<PlatformStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = () => {
    AnalyticsService.getPlatformStats()
      .then(res => setStats(res.data.data))
      .catch(err => console.error('Failed to load analytics', err))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleRefreshCache = () => {
    setRefreshing(true);
    AdminService.refreshDiscoveryCache()
      .then(() => {
        Alert.alert('Success', 'Discovery cache refreshed');
        loadStats();
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to refresh cache');
        setRefreshing(false);
      });
  };

  const StatCard = ({ icon, title, value, color }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const MenuItem = ({ icon, title, onPress, badge }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={24} color={colors.primary} />
        <Text style={styles.menuTitle}>{title}</Text>
      </View>
      {badge != null && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Platform Overview</Text>
        <TouchableOpacity
          style={[styles.refreshBtn, refreshing && { opacity: 0.5 }]}
          onPress={handleRefreshCache}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="refresh" size={20} color={colors.primary} />
          )}
          <Text style={styles.refreshText}>Refresh Cache</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          icon="people"
          title="Total Users"
          value={(stats?.totalUsers ?? 0).toLocaleString()}
          color="#6C5CE7"
        />
        <StatCard
          icon="business"
          title="Groups"
          value={stats?.totalGroups ?? 0}
          color="#00B894"
        />
        <StatCard
          icon="home"
          title="Active Listings"
          value={(stats?.activeListings ?? 0).toLocaleString()}
          color="#FD79A8"
        />
        <StatCard
          icon="time"
          title="Pending"
          value={stats?.pendingApprovals ?? 0}
          color="#F39C12"
        />
        <StatCard
          icon="checkmark-circle"
          title="Sold"
          value={stats?.soldProperties ?? 0}
          color="#27AE60"
        />
        <StatCard
          icon="person-add"
          title="New This Month"
          value={stats?.newUsersThisMonth ?? 0}
          color="#0984E3"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <MenuItem
          icon="business-outline"
          title="Manage Groups"
          onPress={() => navigation.navigate('ManageGroups')}
          badge={stats?.pendingApprovals ?? undefined}
        />
        <MenuItem
          icon="people-outline"
          title="Manage Users"
          onPress={() => navigation.navigate('ManageUsers')}
        />
        <MenuItem
          icon="bar-chart-outline"
          title="Platform Analytics"
          onPress={() => navigation.navigate('PlatformAnalytics')}
        />
        <MenuItem
          icon="layers-outline"
          title="Property Type Config"
          onPress={() => navigation.navigate('PropertyConfig')}
        />
        <MenuItem
          icon="location-outline"
          title="Location Bootstrap"
          onPress={() => navigation.navigate('LocationBootstrap')}
        />
        <MenuItem
          icon="settings-outline"
          title="System Settings"
          onPress={() => navigation.navigate('SystemSettings')}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  heading: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  refreshText: { fontSize: typography.fontSize.sm, color: colors.primary, fontWeight: '600' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
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
  statTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.white,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.md },
  menuTitle: { fontSize: typography.fontSize.md, color: colors.text },
  badge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: spacing.sm,
  },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: 'bold' },
});

export default AdminDashboardScreen;
