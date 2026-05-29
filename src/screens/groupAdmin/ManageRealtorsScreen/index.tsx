import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { GroupService } from '@/api/services/group.service';
import type { GroupMemberDTO, RealtorGroupDTO } from '@/api/types/group.types';

const ManageRealtorsScreen = ({ navigation, route }: any) => {
  // groupId and groupName can be passed from MyGroupScreen (multi-group flow)
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(route?.params?.groupId);
  const [selectedGroupName, setSelectedGroupName] = useState<string>(route?.params?.groupName ?? '');

  const [groups, setGroups] = useState<RealtorGroupDTO[]>([]);
  const [members, setMembers] = useState<GroupMemberDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noGroup, setNoGroup] = useState(false);
  const [groupPickerVisible, setGroupPickerVisible] = useState(false);

  // Edit settings modal
  const [editModal, setEditModal] = useState<{ visible: boolean; member: GroupMemberDTO | null }>({
    visible: false,
    member: null,
  });
  const [editCommission, setEditCommission] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [saving, setSaving] = useState(false);

  // Load groups list (to show picker if multiple)
  const loadGroups = useCallback(() => {
    GroupService.getMyGroups()
      .then(res => {
        const gs = res.data.data ?? [];
        setGroups(gs);
        // Auto-select the only group if there's just one and no groupId passed via params
        if (!selectedGroupId && gs.length === 1) {
          setSelectedGroupId(gs[0].id);
          setSelectedGroupName(gs[0].name);
        }
      })
      .catch(() => {});
  }, []);

  const loadMembers = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    GroupService.getMembers(0, 50, true, selectedGroupId)
      .then(res => {
        setMembers(res.data.data.content);
        setNoGroup(false);
      })
      .catch(err => {
        const status = err?.response?.status;
        if (status === 404 || status === 400) setNoGroup(true);
      })
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, [selectedGroupId]);

  useEffect(() => { loadGroups(); }, [loadGroups]);
  useEffect(() => { loadMembers(); }, [loadMembers]);

  const openEdit = (member: GroupMemberDTO) => {
    setEditCommission(member.commissionPercent?.toString() ?? '');
    setEditTarget(member.monthlyTarget?.toString() ?? '');
    setEditModal({ visible: true, member });
  };

  const saveEdit = () => {
    if (!editModal.member) return;
    setSaving(true);
    GroupService.updateMemberSettings(editModal.member.userId, {
      commissionPercent: editCommission ? parseFloat(editCommission) : undefined,
      monthlyTarget: editTarget ? parseInt(editTarget, 10) : undefined,
    }, selectedGroupId)
      .then(res => {
        setMembers(prev =>
          prev.map(m => m.userId === res.data.data.userId ? res.data.data : m)
        );
        setEditModal({ visible: false, member: null });
      })
      .catch(err => Alert.alert('Error', err?.response?.data?.message ?? 'Failed to update settings'))
      .finally(() => setSaving(false));
  };

  const handleDeactivate = (member: GroupMemberDTO) => {
    Alert.alert(
      'Deactivate Agent',
      `Deactivate ${member.firstName} ${member.lastName}? They won't be able to submit listings under your group.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => {
            GroupService.removeMember(member.userId, selectedGroupId)
              .then(() => loadMembers())
              .catch(err => Alert.alert('Error', err?.response?.data?.message ?? 'Failed to deactivate'));
          },
        },
      ],
    );
  };

  const handleActivate = (member: GroupMemberDTO) => {
    Alert.alert(
      'Reactivate Agent',
      `Reactivate ${member.firstName} ${member.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reactivate',
          onPress: () => {
            GroupService.activateMember(member.userId, selectedGroupId)
              .then(() => loadMembers())
              .catch(err => Alert.alert('Error', err?.response?.data?.message ?? 'Failed to reactivate'));
          },
        },
      ],
    );
  };

  const MemberCard = ({ member }: { member: GroupMemberDTO }) => (
    <View style={[styles.card, !member.isActive && styles.cardInactive]}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {member.firstName?.[0]}{member.lastName?.[0]}
          </Text>
        </View>
        <View style={styles.agentInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{member.firstName} {member.lastName}</Text>
            {!member.isActive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Inactive</Text>
              </View>
            )}
          </View>
          <Text style={styles.email}>{member.email}</Text>
          {member.phone ? <Text style={styles.phone}>{member.phone}</Text> : null}
        </View>
        <View style={styles.actions}>
          {member.isActive ? (
            <>
              <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(member)}>
                <Ionicons name="create-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeactivate(member)}>
                <Ionicons name="person-remove-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleActivate(member)}>
              <Ionicons name="person-add-outline" size={20} color={colors.success} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.stats}>
        {member.commissionPercent != null && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Commission</Text>
            <Text style={styles.statValue}>{member.commissionPercent}%</Text>
          </View>
        )}
        {member.monthlyTarget != null && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Target</Text>
            <Text style={styles.statValue}>{member.monthlyTarget}</Text>
          </View>
        )}
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Sold</Text>
          <Text style={styles.statValue}>{member.soldThisMonth ?? 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Active</Text>
          <Text style={styles.statValue}>{member.activeListings ?? 0}</Text>
        </View>
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

  if (noGroup) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="business-outline" size={64} color={colors.textSecondary} />
        <Text style={styles.stateTitle}>No Group Yet</Text>
        <Text style={styles.stateSubtitle}>Create a group first to start adding agents.</Text>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => navigation.navigate('Dashboard', { screen: 'CreateGroup' })}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.white} />
          <Text style={styles.ctaBtnText}>Create Group</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Edit Settings Modal */}
      <Modal
        visible={editModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModal({ visible: false, member: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Settings</Text>
            <Text style={styles.modalDesc}>{editModal.member?.firstName} {editModal.member?.lastName}</Text>

            <Text style={styles.fieldLabel}>Commission (%)</Text>
            <TextInput
              style={styles.fieldInput}
              value={editCommission}
              onChangeText={setEditCommission}
              placeholder="e.g. 2.5"
              keyboardType="decimal-pad"
            />
            <Text style={styles.fieldLabel}>Monthly Target</Text>
            <TextInput
              style={styles.fieldInput}
              value={editTarget}
              onChangeText={setEditTarget}
              placeholder="e.g. 3 (properties)"
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModal({ visible: false, member: null })}
                disabled={saving}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, saving && styles.btnDisabled]}
                onPress={saveEdit}
                disabled={saving}
              >
                {saving ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.modalSaveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Group picker modal */}
      {groups.length > 1 && (
        <Modal
          visible={groupPickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setGroupPickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Group</Text>
              {groups.map(g => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.groupPickerRow, selectedGroupId === g.id && styles.groupPickerRowActive]}
                  onPress={() => {
                    setSelectedGroupId(g.id);
                    setSelectedGroupName(g.name);
                    setGroupPickerVisible(false);
                    setLoading(true);
                  }}
                >
                  <Ionicons
                    name={selectedGroupId === g.id ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={selectedGroupId === g.id ? colors.primary : colors.textSecondary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.groupPickerName, selectedGroupId === g.id && { color: colors.primary }]}>
                      {g.name}
                    </Text>
                    <Text style={styles.groupPickerSub}>{g.memberCount ?? 0} agents</Text>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setGroupPickerVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>
            {selectedGroupName ? `${selectedGroupName} — Agents` : 'Agents'}
          </Text>
          {groups.length > 1 && (
            <TouchableOpacity style={styles.groupSwitchBtn} onPress={() => setGroupPickerVisible(true)}>
              <Text style={styles.groupSwitchText}>Switch group</Text>
              <Ionicons name="chevron-down" size={14} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.addBtn, styles.addBtnSecondary]}
            onPress={() => navigation.navigate('AddMember', { mode: 'search', groupId: selectedGroupId, groupName: selectedGroupName })}
          >
            <Ionicons name="search-outline" size={18} color={colors.primary} />
            <Text style={styles.addBtnSecondaryText}>Find</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddMember', { mode: 'create', groupId: selectedGroupId, groupName: selectedGroupName })}
          >
            <Ionicons name="person-add-outline" size={18} color={colors.white} />
            <Text style={styles.addBtnText}>Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={members}
        renderItem={({ item }) => <MemberCard member={item} />}
        keyExtractor={item => item.userId.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadMembers(true)} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={64} color={colors.border} />
            <Text style={styles.emptyText}>No agents yet</Text>
            <Text style={styles.emptySubtext}>Add agents to grow your team.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text },
  groupSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  groupSwitchText: { fontSize: typography.fontSize.xs, color: colors.primary, fontWeight: typography.fontWeight.semibold },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  addBtnSecondary: { backgroundColor: colors.primarySurface, shadowOpacity: 0, elevation: 0 },
  addBtnText: { color: colors.white, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  addBtnSecondaryText: { color: colors.primary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  list: { padding: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardInactive: { opacity: 0.65, borderColor: colors.borderLight },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.primary },
  agentInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  name: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.text },
  inactiveBadge: { backgroundColor: colors.backgroundSecondary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  inactiveBadgeText: { fontSize: 11, color: colors.textSecondary, fontWeight: typography.fontWeight.semibold },
  email: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  phone: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 1 },
  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
  },
  stats: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  statItem: {
    alignItems: 'center', backgroundColor: colors.background,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 12, minWidth: 64,
  },
  statLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: typography.fontWeight.medium },
  statValue: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyText: { fontSize: typography.fontSize.lg, color: colors.textSecondary, marginTop: spacing.md },
  emptySubtext: { fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
  stateTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text },
  stateSubtitle: { fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 14, gap: spacing.sm,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  ctaBtnText: { color: colors.white, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.md },
  // Group picker modal rows
  groupPickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  groupPickerRowActive: { backgroundColor: colors.primarySurface, borderRadius: 10, paddingHorizontal: spacing.sm },
  groupPickerName: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.text },
  groupPickerSub: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center', padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.surface, borderRadius: 20, padding: spacing.xl, width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  modalTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text },
  modalDesc: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginBottom: spacing.md, marginTop: 2 },
  fieldLabel: {
    fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary, marginBottom: 6, marginTop: spacing.md,
  },
  fieldInput: {
    backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: spacing.md, height: 50,
    fontSize: typography.fontSize.md, color: colors.text,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  modalCancelBtn: {
    flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border, marginTop: spacing.md,
  },
  modalCancelText: { color: colors.text, fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.md },
  modalSaveBtn: {
    flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.55 },
  modalSaveText: { color: colors.white, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.md },
});

export default ManageRealtorsScreen;
