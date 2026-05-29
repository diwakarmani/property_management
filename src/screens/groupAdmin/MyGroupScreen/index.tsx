import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { GroupService } from '@/api/services/group.service';
import type { RealtorGroupDTO } from '@/api/types/group.types';

type GroupStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';

const STATUS_CONFIG: Record<GroupStatus, { color: string; bg: string; icon: string; label: string }> = {
  ACTIVE:           { color: colors.success,  bg: colors.successSurface,  icon: 'checkmark-circle', label: 'Active' },
  PENDING_APPROVAL: { color: colors.warning,  bg: colors.warningSurface,  icon: 'time',             label: 'Pending Approval' },
  REJECTED:         { color: colors.error,    bg: colors.errorSurface,    icon: 'close-circle',     label: 'Rejected' },
  SUSPENDED:        { color: colors.textSecondary, bg: colors.backgroundSecondary, icon: 'ban',     label: 'Suspended' },
};

const MyGroupScreen = ({ navigation }: any) => {
  const [groups, setGroups] = useState<RealtorGroupDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGroups = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    GroupService.getMyGroups()
      .then(res => setGroups(res.data.data ?? []))
      .catch(err => console.error('Failed to load groups', err))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  // Refresh when screen comes back into focus (e.g. after creating/editing)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => loadGroups());
    return unsubscribe;
  }, [navigation, loadGroups]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const GroupCard = ({ group }: { group: RealtorGroupDTO }) => {
    const statusKey = (group.status ?? 'PENDING_APPROVAL') as GroupStatus;
    const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.PENDING_APPROVAL;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('EditGroup', { groupId: group.id, group })}
      >
        {/* Card header row */}
        <View style={styles.cardHeader}>
          <View style={styles.groupIcon}>
            <Ionicons name="business" size={24} color={colors.primary} />
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
            {group.companyName ? (
              <Text style={styles.companyName} numberOfLines={1}>{group.companyName}</Text>
            ) : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.statChipText}>{group.memberCount ?? 0} members</Text>
          </View>
          {group.rejectionReason ? (
            <View style={[styles.statChip, { backgroundColor: colors.errorSurface }]}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
              <Text style={[styles.statChipText, { color: colors.error }]} numberOfLines={1}>
                {group.rejectionReason}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Action row */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionChip}
            onPress={() => navigation.navigate('EditGroup', { groupId: group.id, group })}
          >
            <Ionicons name="create-outline" size={14} color={colors.primary} />
            <Text style={styles.actionChipText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionChip}
            onPress={() => navigation.navigate('Team', {
              screen: 'ManageRealtors',
              params: { groupId: group.id, groupName: group.name },
            })}
          >
            <Ionicons name="people-outline" size={14} color={colors.primary} />
            <Text style={styles.actionChipText}>Team</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionChip}
            onPress={() => navigation.navigate('Listings', { groupId: group.id, groupName: group.name })}
          >
            <Ionicons name="list-outline" size={14} color={colors.primary} />
            <Text style={styles.actionChipText}>Listings</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Hero */}
      <LinearGradient
        colors={[colors.primary, colors.gradientMid, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroLeft}>
          <Text style={styles.heroLabel}>Manage</Text>
          <Text style={styles.heroTitle}>My Groups</Text>
          <Text style={styles.heroSub}>
            {groups.length === 0
              ? 'No groups yet — create one below'
              : `${groups.length} group${groups.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.createHeroBtn}
          onPress={() => navigation.navigate('CreateGroup')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={22} color={colors.primary} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadGroups(true)} tintColor={colors.primary} />
        }
      >
        {groups.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="business-outline" size={72} color={colors.border} />
            <Text style={styles.emptyTitle}>No Groups Yet</Text>
            <Text style={styles.emptySub}>Create a group to start managing realtors and listings.</Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('CreateGroup')}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.white} />
              <Text style={styles.createBtnText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {groups.map(g => <GroupCard key={g.id} group={g} />)}
            <TouchableOpacity
              style={styles.addMoreBtn}
              onPress={() => navigation.navigate('CreateGroup')}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.addMoreText}>Create Another Group</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  heroLeft: { flex: 1 },
  heroLabel: { fontSize: typography.fontSize.sm, color: 'rgba(255,255,255,0.75)', fontWeight: typography.fontWeight.medium },
  heroTitle: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.extrabold, color: colors.white, letterSpacing: -0.3 },
  heroSub: { fontSize: typography.fontSize.xs, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  createHeroBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },

  list: { padding: spacing.md, paddingBottom: spacing.xl },

  // Group card
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  groupIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardMeta: { flex: 1 },
  groupName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  companyName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexShrink: 0,
  },
  statusText: { fontSize: 11, fontWeight: typography.fontWeight.bold },

  statsRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', marginBottom: spacing.sm },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    maxWidth: '100%',
  },
  statChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: typography.fontWeight.medium },

  cardActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  actionChipText: { fontSize: 13, color: colors.primary, fontWeight: typography.fontWeight.semibold },

  // Empty state
  empty: { alignItems: 'center', paddingTop: spacing.xl * 2, gap: spacing.md },
  emptyTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text },
  emptySub: { fontSize: typography.fontSize.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
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

  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  addMoreText: { color: colors.primary, fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.md },
});

export default MyGroupScreen;
