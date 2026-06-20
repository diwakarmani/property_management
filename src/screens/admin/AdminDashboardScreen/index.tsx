import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '@/theme';
import { AnalyticsService, type PlatformStatsDTO } from '@/api/services/analytics.service';
import { AdminService } from '@/api/services/admin.service';

const STAT_CONFIG = [
  { key: 'totalUsers',       icon: 'people',           label: 'Total Users',    color: colors.primary,  bg: colors.primarySurface },
  { key: 'totalProperties',  icon: 'business',         label: 'Properties',     color: '#8B5CF6',       bg: '#F5F3FF' },
  { key: 'activeListings',   icon: 'home',             label: 'Active',         color: colors.success,  bg: colors.successSurface },
  { key: 'pendingApprovals', icon: 'time',             label: 'Pending',        color: colors.warning,  bg: colors.warningSurface },
  { key: 'soldProperties',   icon: 'checkmark-circle', label: 'Sold',           color: '#2980B9',       bg: colors.infoSurface },
  { key: 'newUsersThisMonth',icon: 'person-add',       label: 'New / Month',    color: '#E91E8C',       bg: '#FDE8F4' },
];

const QUICK_ACTIONS: { icon: string; title: string; route: string; showPending: boolean; params?: object }[] = [
  { icon: 'list-outline',       title: 'Approve Listings',   route: 'Listings',          showPending: true },
  { icon: 'people-outline',     title: 'Manage Realtors',    route: 'Users',             showPending: false, params: { roleFilter: 'REALTOR' } },
  { icon: 'person-add-outline', title: 'Manage Users',       route: 'Users',             showPending: false, params: { roleFilter: null } },
  { icon: 'bar-chart-outline',  title: 'Platform Analytics', route: 'Analytics',         showPending: false },
  { icon: 'layers-outline',     title: 'Property Config',    route: 'PropertyConfig',    showPending: false },
  { icon: 'location-outline',   title: 'Location Bootstrap', route: 'LocationBootstrap', showPending: false },
];

const AdminDashboardScreen = ({ navigation }: any) => {
  const [stats, setStats] = useState<PlatformStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = () => {
    AnalyticsService.getPlatformStats()
      .then(res => setStats(res.data.data))
      .catch(err => console.error('Failed to load analytics', err))
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { loadStats(); }, []);

  const handleRefreshCache = () => {
    setRefreshing(true);
    AdminService.refreshDiscoveryCache()
      .then(() => { Alert.alert('Success', 'Discovery cache refreshed'); loadStats(); })
      .catch(() => { Alert.alert('Error', 'Failed to refresh cache'); setRefreshing(false); });
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading platform data…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefreshCache} tintColor={colors.primary} />
      }
    >

      <LinearGradient
        colors={[colors.primaryDark, colors.primary, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroLeft}>
          <View style={styles.heroAvatar}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.heroLabel}>Super Admin</Text>
            <Text style={styles.heroTitle}>Platform Overview</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.refreshBtn, refreshing && { opacity: 0.6 }]}
          onPress={handleRefreshCache}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="refresh" size={18} color={colors.white} />
          )}
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Platform Stats</Text>
        <View style={styles.statsGrid}>
          {STAT_CONFIG.map(({ key, icon, label, color, bg }) => {
            const val = stats?.[key as keyof typeof stats];
            const display = typeof val === 'number' && val >= 1000
              ? `${(val / 1000).toFixed(1)}K`
              : String(val ?? 0);
            return (
              <View key={key} style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: bg }]}>
                  <Ionicons name={icon as any} size={20} color={color} />
                </View>
                <Text style={[styles.statValue, { color }]}>{display}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {QUICK_ACTIONS.map(({ icon, title, route, showPending, params }) => (
          <TouchableOpacity
            key={title}
            style={styles.menuItem}
            onPress={() => navigation.navigate(route, params)}
            activeOpacity={0.75}
          >
            <View style={styles.menuIconWrap}>
              <Ionicons name={icon as any} size={20} color={colors.primary} />
            </View>
            <Text style={styles.menuTitle}>{title}</Text>
            {showPending && (stats?.pendingApprovals ?? 0) > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{stats!.pendingApprovals}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  loadingText: { fontSize: typography.fontSize.md, color: colors.textSecondary },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: { fontSize: typography.fontSize.xs, color: 'rgba(255,255,255,0.8)', fontWeight: typography.fontWeight.semibold, letterSpacing: 0.5, textTransform: 'uppercase' },
  heroTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.white, marginTop: 2 },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

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
    width: 42,
    height: 42,
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

  actionsCard: {
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  pendingBadge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pendingBadgeText: { color: colors.white, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
});

export default AdminDashboardScreen;
