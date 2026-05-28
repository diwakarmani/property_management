import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { colors, typography, spacing } from '@/theme';
import { useMyListingsQuery } from '@/api/hooks/useProperties';
import AsyncBoundary from '@/components/common/AsyncBoundary';
import type { PropertyDTO } from '@/api/types/property.types';
import type { RootState } from '@/store';

interface SellerStats {
  total: number;
  active: number;
  draft: number;
  pending: number;
  closed: number;
  views: number;
  inquiries: number;
}

const EMPTY_STATS: SellerStats = {
  total: 0, active: 0, draft: 0, pending: 0, closed: 0, views: 0, inquiries: 0,
};

const computeStats = (listings: PropertyDTO[]): SellerStats =>
  listings.reduce<SellerStats>(
    (acc, p) => {
      acc.total += 1;
      if (p.status === 'ACTIVE') acc.active += 1;
      else if (p.status === 'DRAFT') acc.draft += 1;
      else if (p.status === 'PENDING_APPROVAL') acc.pending += 1;
      else if (p.status === 'SOLD' || p.status === 'RENTED') acc.closed += 1;
      acc.views += p.viewCount ?? 0;
      acc.inquiries += p.inquiryCount ?? 0;
      return acc;
    },
    { ...EMPTY_STATS }
  );

interface StatItem {
  icon: string;
  title: string;
  value: string | number;
  color: string;
  bg: string;
}

const StatCard = ({ icon, title, value, color, bg }: StatItem) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconWrap, { backgroundColor: bg }]}>
      <Ionicons name={icon as any} size={22} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const SellerDashboardScreen = ({ navigation }: any) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: listings = [], isLoading, isError, error, refetch, isFetching } =
    useMyListingsQuery(0, 100);
  const stats = computeStats(listings);
  const errorMessage = isError ? (error as any)?.response?.data?.message ?? 'Could not load seller stats.' : null;

  const statItems: StatItem[] = [
    { icon: 'home', title: 'Total', value: stats.total, color: colors.primary, bg: colors.primarySurface },
    { icon: 'checkmark-circle', title: 'Active', value: stats.active, color: colors.success, bg: colors.successSurface },
    { icon: 'create', title: 'Drafts', value: stats.draft, color: colors.textSecondary, bg: colors.backgroundSecondary },
    { icon: 'time', title: 'Pending', value: stats.pending, color: colors.warning, bg: colors.warningSurface },
    { icon: 'pricetag', title: 'Closed', value: stats.closed, color: colors.info, bg: colors.infoSurface },
    { icon: 'eye', title: 'Views', value: stats.views, color: '#8E44AD', bg: '#F3E8FF' },
  ];

  return (
    <AsyncBoundary loading={isLoading} error={errorMessage} onRetry={() => refetch()}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => refetch()} />
        }
      >
        {/* Hero */}
        <LinearGradient
          colors={[colors.primary, colors.gradientMid, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroLeft}>
            <Text style={styles.heroGreeting}>Welcome back,</Text>
            <Text style={styles.heroName}>{user?.firstName ?? 'Seller'} 👋</Text>
            <Text style={styles.heroSubtitle}>Here's how your listings are performing</Text>
          </View>
          <View style={styles.heroIconWrap}>
            <Ionicons name="storefront-outline" size={32} color={colors.primary} />
          </View>
        </LinearGradient>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {statItems.map(item => (
            <StatCard key={item.title} {...item} />
          ))}
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => navigation.navigate('Create')}
          accessibilityRole="button"
        >
          <View style={styles.actionIconWrap}>
            <Ionicons name="add-circle" size={24} color={colors.white} />
          </View>
          <View style={styles.actionTextWrap}>
            <Text style={styles.primaryActionTitle}>Create New Listing</Text>
            <Text style={styles.primaryActionSub}>Start earning from your property</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={() => navigation.navigate('MyListings')}
          accessibilityRole="button"
        >
          <View style={[styles.actionIconWrap, styles.secondaryIconWrap]}>
            <Ionicons name="list" size={22} color={colors.primary} />
          </View>
          <View style={styles.actionTextWrap}>
            <Text style={styles.secondaryActionTitle}>Manage My Listings</Text>
            <Text style={styles.secondaryActionSub}>Edit, publish, or remove listings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {stats.total === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="home-outline" size={40} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No listings yet</Text>
            <Text style={styles.emptyText}>
              Create your first listing to start selling or renting your property.
            </Text>
          </View>
        )}
      </ScrollView>
    </AsyncBoundary>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xl },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  heroLeft: { flex: 1 },
  heroGreeting: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  heroName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.white,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    width: '31%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: spacing.xs,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.extrabold,
    color: colors.text,
  },
  statTitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: typography.fontWeight.medium,
  },

  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.3,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },

  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  actionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: { flex: 1 },
  primaryActionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  primaryActionSub: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  secondaryIconWrap: {
    backgroundColor: colors.primarySurface,
  },
  secondaryActionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  secondaryActionSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  emptyState: {
    alignItems: 'center',
    margin: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
});

export default SellerDashboardScreen;
