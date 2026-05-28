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
import type { GroupMemberDTO } from '@/api/types/group.types';

const ManageRealtorsScreen = ({ navigation }: any) => {
  const [members, setMembers] = useState<GroupMemberDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noGroup, setNoGroup] = useState(false);

  // Edit settings modal
  const [editModal, setEditModal] = useState<{ visible: boolean; member: GroupMemberDTO | null }>({
    visible: false,
    member: null,
  });
  const [editCommission, setEditCommission] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [saving, setSaving] = useState(false);

  const loadMembers = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    GroupService.getMembers(0, 50)
      .then(res => {
        setMembers(res.data.data.content);
        setNoGroup(false);
      })
      .catch(err => {
        const status = err?.response?.status;
        if (status === 404 || status === 400) {
          setNoGroup(true);
        }
      })
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

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
    })
      .then(res => {
        setMembers(prev =>
          prev.map(m => m.userId === res.data.data.userId ? res.data.data : m)
        );
        setEditModal({ visible: false, member: null });
      })
      .catch(err => {
        Alert.alert('Error', err?.response?.data?.message ?? 'Failed to update settings');
      })
      .finally(() => setSaving(false));
  };

  const handleDeactivate = (member: GroupMemberDTO) => {
    Alert.alert(
      'Deactivate Member',
      `Deactivate ${member.firstName} ${member.lastName}? They won't be able to submit listings under your group.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => {
            GroupService.removeMember(member.userId)
              .then(() => loadMembers())
              .catch(err => Alert.alert('Error', err?.response?.data?.message ?? 'Failed to deactivate'));
          },
        },
      ],
    );
  };

  const handleActivate = (member: GroupMemberDTO) => {
    Alert.alert(
      'Reactivate Member',
      `Reactivate ${member.firstName} ${member.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reactivate',
          onPress: () => {
            GroupService.activateMember(member.userId)
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
        <View style={styles.realtorInfo}>
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
          <Text style={styles.statValue}>{member.soldThisMonth}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Active</Text>
          <Text style={styles.statValue}>{member.activeListings}</Text>
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
        <Text style={styles.stateSubtitle}>Create a group first to start adding realtors.</Text>
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
            <Text style={styles.modalDesc}>
              {editModal.member?.firstName} {editModal.member?.lastName}
            </Text>

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
                {saving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Team Members</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.addBtn, styles.addBtnSecondary]}
            onPress={() => navigation.navigate('AddMember', { mode: 'search' })}
          >
            <Ionicons name="search-outline" size={18} color={colors.primary} />
            <Text style={styles.addBtnSecondaryText}>Find</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddMember', { mode: 'create' })}
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
            <Text style={styles.emptyText}>No members yet</Text>
            <Text style={styles.emptySubtext}>Add realtors to grow your team.</Text>
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
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
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
  addBtnSecondary: {
    backgroundColor: colors.primarySurface,
    shadowOpacity: 0,
    elevation: 0,
  },
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
  avatarText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  realtorInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  name: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  inactiveBadge: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  inactiveBadgeText: { fontSize: 11, color: colors.textSecondary, fontWeight: typography.fontWeight.semibold },
  email: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  phone: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 1 },
  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  statItem: {
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    minWidth: 64,
  },
  statLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: typography.fontWeight.medium },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: 2,
  },
  empty: { flex: 1, alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyText: { fontSize: typography.fontSize.lg, color: colors.textSecondary, marginTop: spacing.md },
  emptySubtext: { fontSize: typography.fontSize.sm, color: colors.textTertiary ?? colors.textSecondary, textAlign: 'center' },

  stateTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text },
  stateSubtitle: { fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 14,
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaBtnText: { color: colors.white, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.md },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text },
  modalDesc: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginBottom: spacing.md, marginTop: 2 },
  fieldLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: spacing.md,
  },
  fieldInput: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 50,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: { color: colors.text, fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.md },
  modalSaveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.55 },
  modalSaveText: { color: colors.white, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.md },
});

export default ManageRealtorsScreen;
