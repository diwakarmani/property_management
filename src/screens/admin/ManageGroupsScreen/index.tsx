import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { AdminService } from '@/api/services/admin.service';
import type { RealtorGroupDTO } from '@/api/types/group.types';

const STATUS_TABS = ['ALL', 'PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'SUSPENDED'] as const;
type StatusTab = typeof STATUS_TABS[number];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#27AE60',
  PENDING_APPROVAL: '#F39C12',
  REJECTED: '#E74C3C',
  SUSPENDED: '#95A5A6',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: 'PENDING',
  ALL: 'ALL',
};

const ManageGroupsScreen = () => {
  const [groups, setGroups] = useState<RealtorGroupDTO[]>([]);
  const [activeTab, setActiveTab] = useState<StatusTab>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroups = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const status = activeTab === 'ALL' ? undefined : activeTab;
    AdminService.getGroups(status, 0, 50)
      .then(res => setGroups(res.data.data?.content ?? []))
      .catch(err => console.error('Failed to load groups', err))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    fetchGroups();
  }, [activeTab]);

  const promptReason = (title: string, onConfirm: (reason: string) => void) => {
    Alert.prompt(
      title,
      'Enter reason (optional)',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: reason => onConfirm(reason ?? '') },
      ],
      'plain-text'
    );
  };

  const handleApprove = (group: RealtorGroupDTO) => {
    Alert.alert(`Approve "${group.name}"?`, 'This will activate the group.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: () => {
          AdminService.approveGroup(group.id)
            .then(() => {
              setGroups(prev => prev.map(g => g.id === group.id ? { ...g, status: 'ACTIVE' } : g));
            })
            .catch(() => Alert.alert('Error', 'Failed to approve group'));
        },
      },
    ]);
  };

  const handleReject = (group: RealtorGroupDTO) => {
    promptReason('Reject Group', reason => {
      AdminService.rejectGroup(group.id, reason)
        .then(() => {
          setGroups(prev => prev.map(g => g.id === group.id ? { ...g, status: 'REJECTED' } : g));
        })
        .catch(() => Alert.alert('Error', 'Failed to reject group'));
    });
  };

  const handleSuspend = (group: RealtorGroupDTO) => {
    promptReason('Suspend Group', reason => {
      AdminService.suspendGroup(group.id, reason)
        .then(() => {
          setGroups(prev => prev.map(g => g.id === group.id ? { ...g, status: 'SUSPENDED' } : g));
        })
        .catch(() => Alert.alert('Error', 'Failed to suspend group'));
    });
  };

  const handleDelete = (group: RealtorGroupDTO) => {
    Alert.alert(
      'Delete Group',
      `Permanently delete "${group.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            AdminService.deleteGroup(group.id)
              .then(() => setGroups(prev => prev.filter(g => g.id !== group.id)))
              .catch(() => Alert.alert('Error', 'Failed to delete group'));
          },
        },
      ]
    );
  };

  const GroupCard = ({ group }: { group: RealtorGroupDTO }) => {
    const statusColor = STATUS_COLORS[group.status ?? ''] ?? colors.textSecondary;
    const statusLabel = STATUS_LABELS[group.status ?? ''] ?? group.status;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.adminName}>Admin: {group.groupAdminName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.metaText}>{group.memberCount ?? 0} members</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="mail-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>{group.groupAdminEmail}</Text>
          </View>
        </View>

        {/* Actions based on status */}
        <View style={styles.actions}>
          {group.status === 'PENDING_APPROVAL' && (
            <>
              <TouchableOpacity style={[styles.btn, styles.approveBtn]} onPress={() => handleApprove(group)}>
                <Ionicons name="checkmark" size={16} color={colors.white} />
                <Text style={styles.btnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => handleReject(group)}>
                <Ionicons name="close" size={16} color={colors.white} />
                <Text style={styles.btnText}>Reject</Text>
              </TouchableOpacity>
            </>
          )}
          {group.status === 'ACTIVE' && (
            <TouchableOpacity style={[styles.btn, styles.suspendBtn]} onPress={() => handleSuspend(group)}>
              <Ionicons name="pause" size={16} color={colors.white} />
              <Text style={styles.btnText}>Suspend</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.btn, styles.deleteBtn]} onPress={() => handleDelete(group)}>
            <Ionicons name="trash-outline" size={15} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Status tabs */}
      <FlatList
        horizontal
        data={STATUS_TABS}
        keyExtractor={t => t}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        renderItem={({ item: tab }) => (
          <TouchableOpacity
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {STATUS_LABELS[tab] ?? tab}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={groups}
        renderItem={({ item }) => <GroupCard group={item} />}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchGroups(true)} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="business-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No groups found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabs: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: typography.fontSize.sm, color: colors.text },
  tabTextActive: { color: colors.white, fontWeight: '600' },
  list: { padding: spacing.md, gap: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  cardHeaderLeft: { flex: 1 },
  groupName: { fontSize: typography.fontSize.md, fontWeight: 'bold' },
  adminName: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardMeta: { gap: spacing.xs, marginBottom: spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    gap: 4,
  },
  approveBtn: { backgroundColor: colors.success },
  rejectBtn: { backgroundColor: colors.error },
  suspendBtn: { backgroundColor: '#95A5A6' },
  deleteBtn: { borderWidth: 1, borderColor: colors.error, paddingHorizontal: spacing.sm },
  btnText: { color: colors.white, fontSize: typography.fontSize.sm, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  emptyText: { fontSize: typography.fontSize.md, color: colors.textSecondary },
});

export default ManageGroupsScreen;
