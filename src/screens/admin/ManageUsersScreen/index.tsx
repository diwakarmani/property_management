import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { AdminService, type AdminUserDTO } from '@/api/services/admin.service';
import type { RootState } from '@/store';

const ALL_ROLES = ['BUYER', 'SELLER', 'REALTOR', 'SUPER_ADMIN'] as const;
type RoleKey = typeof ALL_ROLES[number];

const ROLE_CONFIG: Record<RoleKey, {
  label: string;
  description: string;
  icon: string;
  color: string;
}> = {
  BUYER:      { label: 'Buyer',      description: 'Browse & favourite properties',           icon: 'person',           color: '#F39C12' },
  SELLER:     { label: 'Seller',     description: 'List own properties, manage inquiries',    icon: 'home',             color: '#27AE60' },
  REALTOR:    { label: 'Realtor',    description: 'Create listings, manage client inquiries', icon: 'briefcase',        color: '#2980B9' },
  SUPER_ADMIN:{ label: 'Super Admin',description: 'Full platform access & admin controls',    icon: 'shield-checkmark', color: '#E74C3C' },
};

const roleOf = (role: string) =>
  ROLE_CONFIG[role as RoleKey] ?? { label: role, description: '', icon: 'person', color: colors.primary };

const RoleAssignSheet = ({
  user,
  selectedRoles,
  onToggle,
  onSave,
  onClose,
  saving,
  currentUserId,
}: {
  user: AdminUserDTO;
  selectedRoles: string[];
  onToggle: (role: string) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
  currentUserId?: number;
}) => {
  const insets = useSafeAreaInsets();
  const visibleRoles = (user.roles ?? []).filter(r => ALL_ROLES.includes(r as RoleKey));
  const primaryCfg = roleOf(visibleRoles[0] ?? 'BUYER');
  const isSelf = currentUserId !== undefined && user.id === currentUserId;

  return (
    <View style={sheet.overlay}>

      <TouchableOpacity style={sheet.backdrop} activeOpacity={1} onPress={onClose} />

      <View style={[sheet.panel, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>

        <View style={sheet.handle} />

        <View style={sheet.headerRow}>
          <Text style={sheet.title}>Assign Roles</Text>
          <TouchableOpacity style={sheet.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={[sheet.userCard, { borderLeftColor: primaryCfg.color }]}>
          <View style={[sheet.userAvatar, { backgroundColor: primaryCfg.color + '22' }]}>
            <Text style={[sheet.userAvatarText, { color: primaryCfg.color }]}>
              {(user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')}
            </Text>
          </View>
          <View style={sheet.userInfo}>
            <Text style={sheet.userName} numberOfLines={1}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={sheet.userEmail} numberOfLines={1}>{user.email}</Text>
          </View>
        </View>

        <Text style={sheet.sectionLabel}>Select roles for this user</Text>

        <View style={sheet.roleList}>
          {ALL_ROLES.map(role => {
            const cfg    = roleOf(role);
            const active = selectedRoles.includes(role);
            const locked = isSelf && role === 'SUPER_ADMIN';
            return (
              <TouchableOpacity
                key={role}
                style={[
                  sheet.roleRow,
                  active && !locked && { borderColor: cfg.color, backgroundColor: cfg.color + '0C' },
                  locked && sheet.roleRowLocked,
                ]}
                onPress={() => !locked && onToggle(role)}
                activeOpacity={locked ? 1 : 0.72}
              >

                <View style={[sheet.roleIcon, { backgroundColor: (locked ? colors.textLight : cfg.color) + '1E' }]}>
                  <Ionicons name={cfg.icon as any} size={20} color={locked ? colors.textLight : cfg.color} />
                </View>

                <View style={sheet.roleText}>
                  <Text style={[
                    sheet.roleLabel,
                    active && !locked && { color: cfg.color, fontWeight: typography.fontWeight.bold },
                    locked && { color: colors.textSecondary },
                  ]}>
                    {cfg.label}
                    {locked && '  🔒'}
                  </Text>
                  <Text style={sheet.roleDesc} numberOfLines={1}>
                    {locked ? 'Cannot remove your own admin role' : cfg.description}
                  </Text>
                </View>

                <View style={[
                  sheet.checkbox,
                  locked
                    ? { backgroundColor: colors.border, borderColor: colors.border }
                    : active
                      ? { backgroundColor: cfg.color, borderColor: cfg.color }
                      : { borderColor: colors.border },
                ]}>
                  {(active || locked) && <Ionicons name="checkmark" size={13} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[sheet.saveBtn, saving && { opacity: 0.55 }]}
          onPress={onSave}
          disabled={saving}
          activeOpacity={0.82}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={sheet.saveBtnText}>Update Roles</Text>
            </>
          )}
        </TouchableOpacity>

      </View>
    </View>
  );
};

const sheet = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  panel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 28,
  },

  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 18,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderLeftWidth: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userAvatarText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  userEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },

  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },

  roleList: { gap: 10 },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 66,
  },
  roleRowLocked: {
    backgroundColor: colors.backgroundSecondary,
    borderColor: colors.borderLight,
    opacity: 0.75,
  },
  roleIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  roleText: { flex: 1, minWidth: 0 },
  roleLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  roleDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 3,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 16,
    marginTop: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});

const ManageUsersScreen = ({ route }: any) => {
  const roleFilter: string | null = route?.params?.roleFilter ?? null;
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);

  const [users, setUsers]             = useState<AdminUserDTO[]>([]);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [searching, setSearching]     = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [page, setPage]               = useState(0);
  const [hasMore, setHasMore]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [roleModalUser, setRoleModalUser] = useState<AdminUserDTO | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [savingRoles, setSavingRoles]     = useState(false);

  const fetchUsers = useCallback((reset = false) => {
    const currentPage = reset ? 0 : page;
    if (reset) { setLoading(true); setPage(0); }
    AdminService.getUsers(currentPage, 20, roleFilter)
      .then(res => {
        const data = res.data.data;
        setUsers(prev => reset ? (data?.content ?? []) : [...prev, ...(data?.content ?? [])]);
        setHasMore(!(data?.last ?? true));
        if (!reset) setPage(p => p + 1);
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setRefreshing(false); setLoadingMore(false); });
  }, [page, roleFilter]);

  useEffect(() => { fetchUsers(true); }, [roleFilter]);

  const handleSearch = useCallback(() => {
    if (!search.trim()) { fetchUsers(true); return; }
    setSearching(true);
    AdminService.searchUsers(search.trim())
      .then(res => setUsers(res.data.data?.content ?? []))
      .catch(() => {})
      .finally(() => setSearching(false));
  }, [search]);

  const openRoleModal = (user: AdminUserDTO) => {
    setRoleModalUser(user);
    setSelectedRoles((user.roles ?? []).filter(r => ALL_ROLES.includes(r as RoleKey)));
  };

  const toggleRole = (role: string) =>
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );

  const handleSaveRoles = () => {
    if (!roleModalUser) return;
    if (selectedRoles.length === 0) {
      Alert.alert('Validation', 'User must have at least one role.');
      return;
    }
    setSavingRoles(true);
    AdminService.assignRoles(roleModalUser.id, selectedRoles)
      .then(() => {
        setUsers(prev =>
          prev.map(u => u.id === roleModalUser.id ? { ...u, roles: selectedRoles } : u)
        );
        setRoleModalUser(null);
      })
      .catch(err => Alert.alert('Error', err?.response?.data?.message ?? 'Failed to update roles'))
      .finally(() => setSavingRoles(false));
  };

  const handleDelete = (user: AdminUserDTO) =>
    Alert.alert(
      'Delete User',
      `Delete account for ${user.firstName} ${user.lastName}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () =>
            AdminService.deleteUser(user.id)
              .then(() => setUsers(prev => prev.filter(u => u.id !== user.id)))
              .catch(() => Alert.alert('Error', 'Failed to delete user')),
        },
      ]
    );

  const handleToggleActive = (user: AdminUserDTO) => {
    const action = user.isActive ? 'Deactivate' : 'Activate';
    Alert.alert(
      `${action} User`,
      `${action} account for ${user.firstName} ${user.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          onPress: () => {
            const call = user.isActive
              ? AdminService.deactivateUser(user.id)
              : AdminService.activateUser(user.id);
            call
              .then(res => {
                const updated = res.data?.data;
                if (updated) {
                  setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
                }
              })
              .catch(() => Alert.alert('Error', `Failed to ${action.toLowerCase()} user`));
          },
        },
      ]
    );
  };

  const UserCard = ({ user }: { user: AdminUserDTO }) => {
    const visibleRoles = (user.roles ?? []).filter(r => ALL_ROLES.includes(r as RoleKey));
    const primaryCfg   = roleOf(visibleRoles[0] ?? 'BUYER');

    return (
      <View style={[styles.card, !user.isActive && styles.cardInactive]}>

        <View style={styles.cardRow}>
          <View style={[styles.avatar, { backgroundColor: primaryCfg.color + '20' }]}>
            <Text style={[styles.avatarText, { color: primaryCfg.color }]}>
              {(user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.firstName} {user.lastName}
              </Text>
              {user.emailVerified && (
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              )}
              {!user.isActive && (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveBadgeText}>Inactive</Text>
                </View>
              )}
            </View>
            <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
            {!!user.phone && (
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={11} color={colors.textLight} />
                <Text style={styles.userPhone}>{user.phone}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.chipRow}>
            {visibleRoles.length === 0 ? (
              <Text style={styles.noRoleText}>No role</Text>
            ) : (
              visibleRoles.map(role => {
                const cfg = roleOf(role);
                return (
                  <View
                    key={role}
                    style={[styles.chip, { backgroundColor: cfg.color + '15', borderColor: cfg.color + '55' }]}
                  >
                    <Ionicons name={cfg.icon as any} size={11} color={cfg.color} />
                    <Text style={[styles.chipText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                );
              })
            )}
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.editRoleBtn}
              onPress={() => openRoleModal(user)}
              activeOpacity={0.78}
            >
              <Ionicons name="shield-half-outline" size={15} color={colors.primary} />
              <Text style={styles.editRoleBtnText}>Roles</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                user.isActive
                  ? { backgroundColor: colors.warningSurface, borderColor: colors.warning + '50' }
                  : { backgroundColor: colors.successSurface, borderColor: colors.success + '50' },
              ]}
              onPress={() => handleToggleActive(user)}
              activeOpacity={0.78}
            >
              <Ionicons
                name={user.isActive ? 'lock-closed-outline' : 'checkmark-circle-outline'}
                size={15}
                color={user.isActive ? colors.warning : colors.success}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(user)}
              activeOpacity={0.78}
            >
              <Ionicons name="trash-outline" size={15} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email…"
          placeholderTextColor={colors.textLight}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searching ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : search.length > 0 ? (
          <TouchableOpacity onPress={() => { setSearch(''); fetchUsers(true); }}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading users…</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <UserCard user={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchUsers(true); }}
              tintColor={colors.primary}
            />
          }
          onEndReached={() => {
            if (hasMore && !loadingMore && !loading) {
              setLoadingMore(true);
              fetchUsers(false);
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator style={styles.listFooter} color={colors.primary} />
              : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={52} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No users found</Text>
              <Text style={styles.emptySubtitle}>Try a different search term</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={!!roleModalUser}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setRoleModalUser(null)}
      >
        {roleModalUser && (
          <RoleAssignSheet
            user={roleModalUser}
            selectedRoles={selectedRoles}
            onToggle={toggleRole}
            onSave={handleSaveRoles}
            onClose={() => setRoleModalUser(null)}
            saving={savingRoles}
            currentUserId={currentUserId}
          />
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  loadingText: { fontSize: typography.fontSize.sm, color: colors.textSecondary },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    height: 48,
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },

  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  listFooter: { paddingVertical: spacing.lg },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardInactive: {
    opacity: 0.65,
    borderColor: colors.error + '40',
    borderStyle: 'dashed',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  userInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  userName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    flexShrink: 1,
  },
  inactiveBadge: {
    backgroundColor: colors.error + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.error + '35',
  },
  inactiveBadgeText: { fontSize: 10, color: colors.error, fontWeight: typography.fontWeight.bold },
  userEmail: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  userPhone: { fontSize: typography.fontSize.xs, color: colors.textLight },
  divider: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: spacing.md },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 11, fontWeight: typography.fontWeight.semibold },
  noRoleText: { fontSize: typography.fontSize.xs, color: colors.textLight, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  editRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primary + '35',
  },
  editRoleBtnText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  toggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.errorSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.error + '30',
  },

  empty: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});

export default ManageUsersScreen;
