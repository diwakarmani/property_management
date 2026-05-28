import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { GroupService } from '@/api/services/group.service';
import type { GroupDashboardStatsDTO, GroupMemberDTO } from '@/api/types/group.types';

const GroupDashboardScreen = ({ navigation }: any) => {
  const [stats, setStats] = useState<GroupDashboardStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noGroup, setNoGroup] = useState(false);

  const loadStats = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    GroupService.getDashboardStats()
      .then(res => { setStats(res.data.data); setNoGroup(false); })
      .catch(err => {
        const status = err?.response?.status;
        if (status === 404 || status === 400) {
          setNoGroup(true);
        } else {
          console.error('Failed to load group stats', err);
        }
      })
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { loadStats(); }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (noGroup) {
    return (
      <View style={styles.centered}>
        <Ionicons name="business-outline" size={64} color={colors.textSecondary} />
        <Text style={styles.noGroupTitle}>No Group Yet</Text>
        <Text style={styles.noGroupSubtitle}>
          Create a group to start managing realtors and listings.
        </Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateGroup')}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.white} />
          <Text style={styles.createBtnText}>Create Group</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statItems = [
    { icon: 'people', label: 'Members', value: stats?.totalMembers ?? 0, color: colors.primary, bg: colors.primarySurface },
    { icon: 'home', label: 'Active Listings', value: stats?.activeListings ?? 0, color: colors.success, bg: colors.successSurface },
    { icon: 'time', label: 'Pending', value: stats?.pendingApprovals ?? 0, color: colors.warning, bg: colors.warningSurface },
    { icon: 'checkmark-circle', label: 'Sold', value: stats?.soldThisMonth ?? 0, color: colors.info, bg: colors.infoSurface },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadStats(true)} />}
    >
      {/* Hero */}
      <LinearGradient
        colors={[colors.primary, colors.gradientMid, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroLeft}>
          <Text style={styles.heroLabel}>Group Overview</Text>
          <Text style={styles.heroTitle}>Dashboard</Text>
          <Text style={styles.heroSubtitle}>Track your team's performance</Text>
        </View>
        <View style={styles.heroIconWrap}>
          <Ionicons name="people-circle-outline" size={36} color={colors.primary} />
        </View>
      </LinearGradient>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        {statItems.map(item => (
          <View key={item.label} style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon as any} size={22} color={item.color} />
            </View>
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Top Performers */}
      {stats?.topPerformers && stats.topPerformers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Performers</Text>
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => navigation.navigate('Team', { screen: 'ManageRealtors' })}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {stats.topPerformers.slice(0, 3).map((member: GroupMemberDTO, idx: number) => (
            <View key={member.userId} style={styles.performerRow}>
              <View style={styles.performerRank}>
                <Text style={styles.rankText}>{idx + 1}</Text>
              </View>
              <View style={styles.performerAvatar}>
                <Text style={styles.performerAvatarText}>
                  {member.firstName?.[0]}{member.lastName?.[0]}
                </Text>
              </View>
              <View style={styles.performerInfo}>
                <Text style={styles.performerName}>{member.firstName} {member.lastName}</Text>
                <Text style={styles.performerEmail}>{member.email}</Text>
              </View>
              <View style={styles.performerStats}>
                <View style={styles.achieveBadge}>
                  <Ionicons name="trending-up" size={12} color={colors.success} />
                  <Text style={styles.achieveText}>{member.soldThisMonth} sold</Text>
                </View>
                <Text style={styles.activeListingsText}>{member.activeListings} active</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Team', { screen: 'ManageRealtors' })}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: colors.primarySurface }]}>
              <Ionicons name="person-add" size={22} color={colors.primary} />
            </View>
            <Text style={styles.actionTitle}>Manage Realtors</Text>
            <Text style={styles.actionSub}>View & manage team</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Listings')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: colors.successSurface }]}>
              <Ionicons name="checkmark-done" size={22} color={colors.success} />
            </View>
            <Text style={styles.actionTitle}>Approve Listings</Text>
            <Text style={styles.actionSub}>Review pending</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('MyGroup')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: colors.infoSurface }]}>
              <Ionicons name="business-outline" size={22} color={colors.info} />
            </View>
            <Text style={styles.actionTitle}>My Group</Text>
            <Text style={styles.actionSub}>Group details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('EditGroup')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: colors.warningSurface }]}>
              <Ionicons name="create-outline" size={22} color={colors.warning} />
            </View>
            <Text style={styles.actionTitle}>Edit Group</Text>
            <Text style={styles.actionSub}>Update info</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.md },
  noGroupTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  noGroupSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 14,
    gap: spacing.sm,
    marginTop: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  createBtnText: { color: colors.white, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.md },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  heroLeft: { flex: 1 },
  heroLabel: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: typography.fontWeight.medium,
  },
  heroTitle: {
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
    width: 72,
    height: 72,
    borderRadius: 22,
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
    width: '47%',
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
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.text,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },

  section: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  seeAllText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },

  performerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  performerRank: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  performerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  performerAvatarText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  performerInfo: { flex: 1 },
  performerName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  performerEmail: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  performerStats: { alignItems: 'flex-end', gap: 4 },
  achieveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.successSurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  achieveText: { fontSize: 11, color: colors.success, fontWeight: typography.fontWeight.bold },
  activeListingsText: { fontSize: 11, color: colors.textSecondary },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: -spacing.xs,
  },
  actionCard: {
    width: '47%',
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.xs,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  actionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  actionSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default GroupDashboardScreen;
