import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { GroupService } from '@/api/services/group.service';
import type { GroupDashboardStatsDTO, GroupMemberDTO } from '@/api/types/group.types';

const GroupDashboardScreen = ({ navigation }: any) => {
  const [stats, setStats] = useState<GroupDashboardStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    GroupService.getDashboardStats()
      .then(res => setStats(res.data.data))
      .catch(err => console.error('Failed to load group stats', err))
      .finally(() => setLoading(false));
  }, []);

  const StatCard = ({ icon, title, value, trend }: any) => (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={32} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {trend != null && <Text style={styles.trend}>↑ {trend}% this month</Text>}
    </View>
  );

  const MemberCard = ({ member }: { member: GroupMemberDTO }) => (
    <View style={styles.realtorCard}>
      <View style={styles.realtorHeader}>
        <View>
          <Text style={styles.realtorName}>{member.firstName} {member.lastName}</Text>
          <Text style={styles.realtorEmail}>{member.email}</Text>
        </View>
        <View style={styles.achievementBadge}>
          <Text style={styles.achievementText}>{member.soldThisMonth} sold</Text>
        </View>
      </View>
      <View style={styles.realtorStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Active</Text>
          <Text style={styles.statNumber}>{member.activeListings}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Sold</Text>
          <Text style={styles.statNumber}>{member.soldThisMonth}</Text>
        </View>
        {member.commissionPercent != null && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Commission</Text>
            <Text style={styles.statNumber}>{member.commissionPercent}%</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Group Dashboard</Text>

      {stats && (
        <View style={styles.statsGrid}>
          <StatCard icon="people" title="Members" value={stats.totalMembers} />
          <StatCard icon="home" title="Active Listings" value={stats.activeListings} />
          <StatCard icon="time" title="Pending" value={stats.pendingApprovals} />
          <StatCard icon="checkmark-circle" title="Sold" value={stats.soldThisMonth} />
        </View>
      )}

      {stats?.topPerformers && stats.topPerformers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Performers</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ManageRealtors')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {stats.topPerformers.slice(0, 3).map(member => (
            <MemberCard key={member.userId} member={member} />
          ))}
        </View>
      )}

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ManageRealtors')}>
          <Ionicons name="person-add" size={24} color={colors.white} />
          <Text style={styles.actionText}>Manage Realtors</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ApproveListings')}>
          <Ionicons name="checkmark-done" size={24} color={colors.white} />
          <Text style={styles.actionText}>Approve Listings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]} onPress={() => navigation.navigate('MyGroup')}>
          <Ionicons name="business-outline" size={24} color={colors.primary} />
          <Text style={[styles.actionText, styles.secondaryActionText]}>My Group</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]} onPress={() => navigation.navigate('EditGroup')}>
          <Ionicons name="create-outline" size={24} color={colors.primary} />
          <Text style={[styles.actionText, styles.secondaryActionText]}>Edit Group Info</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: typography.fontSize['2xl'], fontWeight: 'bold', padding: spacing.lg },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.md, gap: spacing.md },
  statCard: {
    width: '47%',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: { fontSize: typography.fontSize['2xl'], fontWeight: 'bold', marginTop: spacing.xs },
  statTitle: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 4 },
  trend: { fontSize: 12, color: colors.success, marginTop: 4 },
  section: { backgroundColor: colors.white, padding: spacing.md, marginTop: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitle: { fontSize: typography.fontSize.lg, fontWeight: 'bold' },
  seeAll: { fontSize: typography.fontSize.sm, color: colors.primary },
  realtorCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  realtorHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  realtorName: { fontSize: typography.fontSize.md, fontWeight: '600' },
  realtorEmail: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  achievementBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  achievementText: { color: colors.success, fontWeight: 'bold', fontSize: typography.fontSize.sm },
  realtorStats: { flexDirection: 'row', gap: spacing.xl },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  statNumber: { fontSize: typography.fontSize.lg, fontWeight: 'bold', marginTop: 4 },
  quickActions: { padding: spacing.md, gap: spacing.sm },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  actionText: { color: colors.white, fontWeight: '600' },
  secondaryAction: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.primary },
  secondaryActionText: { color: colors.primary },
});

export default GroupDashboardScreen;
