import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { AdminService, type AdminUserDTO } from '@/api/services/admin.service';

type Tab = 'all' | 'pending';

const ALL_ROLES = ['BUYER', 'SELLER', 'REALTOR', 'REALTOR_GROUP_ADMIN', 'SUPER_ADMIN'] as const;

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#E74C3C',
  REALTOR_GROUP_ADMIN: '#8E44AD',
  REALTOR: '#2980B9',
  SELLER: '#27AE60',
  BUYER: '#F39C12',
};

const ROLE_LABELS: Record<string, string> = {
  REALTOR_GROUP_ADMIN: 'Group Admin',
  SUPER_ADMIN: 'Super Admin',
};

const ManageUsersScreen = () => {
  const [tab, setTab] = useState<Tab>('all');

  // All users tab
  const [users, setUsers] = useState<AdminUserDTO[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Pending group admins tab
  const [pendingAdmins, setPendingAdmins] = useState<AdminUserDTO[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingRefreshing, setPendingRefreshing] = useState(false);
  const [activatingId, setActivatingId] = useState<number | null>(null);

  // Role assignment modal
  const [roleModalUser, setRoleModalUser] = useState<AdminUserDTO | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);

  const fetchUsers = useCallback((reset = false) => {
    const currentPage = reset ? 0 : page;
    if (reset) {
      setLoading(true);
      setPage(0);
    }
    AdminService.getUsers(currentPage, 20)
      .then(res => {
        const data = res.data.data;
        setUsers(prev => reset ? (data?.content ?? []) : [...prev, ...(data?.content ?? [])]);
        setHasMore(!(data?.last ?? true));
        if (!reset) setPage(p => p + 1);
      })
      .catch(err => console.error('Failed to load users', err))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      });
  }, [page]);

  const fetchPendingAdmins = useCallback((isRefresh = false) => {
    if (isRefresh) setPendingRefreshing(true);
    else setPendingLoading(true);
    AdminService.getPendingGroupAdmins()
      .then(res => setPendingAdmins(res.data.data?.content ?? []))
      .catch(err => console.error('Failed to load pending admins', err))
      .finally(() => { setPendingLoading(false); setPendingRefreshing(false); });
  }, []);

  useEffect(() => {
    fetchUsers(true);
    fetchPendingAdmins();
  }, []);

  const handleSearch = useCallback(() => {
    if (!search.trim()) { fetchUsers(true); return; }
    setSearching(true);
    AdminService.searchUsers(search.trim())
      .then(res => setUsers(res.data.data?.content ?? []))
      .catch(() => {})
      .finally(() => setSearching(false));
  }, [search]);

  const handleDelete = (user: AdminUserDTO) => {
    Alert.alert(
      'Delete User',
      `Delete account for ${user.firstName} ${user.lastName}?\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            AdminService.deleteUser(user.id)
              .then(() => setUsers(prev => prev.filter(u => u.id !== user.id)))
              .catch(() => Alert.alert('Error', 'Failed to delete user'));
          },
        },
      ]
    );
  };

  const handleActivate = (user: AdminUserDTO) => {
    Alert.alert(
      'Activate Account',
      `Activate ${user.firstName} ${user.lastName}'s Group Admin account? They will be able to log in immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: () => {
            setActivatingId(user.id);
            AdminService.activateUser(user.id)
              .then(() => {
                setPendingAdmins(prev => prev.filter(u => u.id !== user.id));
                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: true } : u));
              })
              .catch(err => Alert.alert('Error', err?.response?.data?.message ?? 'Failed to activate'))
              .finally(() => setActivatingId(null));
          },
        },
      ]
    );
  };

  const handleDeactivate = (user: AdminUserDTO) => {
    Alert.alert(
      'Deactivate Account',
      `Deactivate ${user.firstName} ${user.lastName}? They will be logged out and unable to access the app.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => {
            setActivatingId(user.id);
            AdminService.deactivateUser(user.id)
              .then(() => {
                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: false } : u));
                if (user.roles?.includes('REALTOR_GROUP_ADMIN')) {
                  fetchPendingAdmins();
                }
              })
              .catch(err => Alert.alert('Error', err?.response?.data?.message ?? 'Failed to deactivate'))
              .finally(() => setActivatingId(null));
          },
        },
      ]
    );
  };

  const openRoleModal = (user: AdminUserDTO) => {
    setRoleModalUser(user);
    setSelectedRoles([...(user.roles ?? [])]);
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSaveRoles = () => {
    if (!roleModalUser) return;
    if (selectedRoles.length === 0) {
      Alert.alert('Validation', 'User must have at least one role');
      return;
    }
    setSavingRoles(true);
    AdminService.assignRoles(roleModalUser.id, selectedRoles)
      .then(() => {
        setUsers(prev =>
          prev.map(u =>
            u.id === roleModalUser.id ? { ...u, roles: selectedRoles } : u
          )
        );
        setRoleModalUser(null);
      })
      .catch(err => {
        const msg = err?.response?.data?.message ?? 'Failed to update roles';
        Alert.alert('Error', msg);
      })
      .finally(() => setSavingRoles(false));
  };

  const loadMore = () => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    fetchUsers(false);
  };

  const UserCard = ({ user }: { user: AdminUserDTO }) => {
    const primaryRole = user.roles?.[0] ?? 'BUYER';
    const roleColor = ROLE_COLORS[primaryRole] ?? colors.primary;
    const isGroupAdmin = user.roles?.includes('REALTOR_GROUP_ADMIN');
    const isBusy = activatingId === user.id;

    return (
      <View style={[styles.card, !user.isActive && styles.cardInactive]}>
        <View style={styles.cardLeft}>
          <View style={[styles.avatar, { backgroundColor: roleColor + '20' }]}>
            <Text style={[styles.avatarText, { color: roleColor }]}>
              {user.firstName?.[0]}{user.lastName?.[0]}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
              {!user.isActive && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>Pending</Text>
                </View>
              )}
            </View>
            <Text style={styles.userEmail}>{user.email}</Text>
            {user.phone ? <Text style={styles.userPhone}>{user.phone}</Text> : null}
            <View style={styles.roleBadgeRow}>
              {user.roles?.map(role => (
                <View key={role} style={[styles.roleBadge, { backgroundColor: (ROLE_COLORS[role] ?? colors.primary) + '20' }]}>
                  <Text style={[styles.roleText, { color: ROLE_COLORS[role] ?? colors.primary }]}>
                    {ROLE_LABELS[role] ?? role.replace(/_/g, ' ')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.cardRight}>
          {user.emailVerified && (
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          )}
          {isGroupAdmin && (
            isBusy ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : user.isActive ? (
              <TouchableOpacity style={styles.deactivateBtn} onPress={() => handleDeactivate(user)}>
                <Ionicons name="pause-circle-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.activateBtn} onPress={() => handleActivate(user)}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
              </TouchableOpacity>
            )
          )}
          <TouchableOpacity style={styles.roleBtn} onPress={() => openRoleModal(user)}>
            <Ionicons name="shield-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(user)}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const PendingAdminCard = ({ user }: { user: AdminUserDTO }) => {
    const isBusy = activatingId === user.id;
    return (
      <View style={styles.pendingCard}>
        <View style={[styles.avatar, { backgroundColor: '#8E44AD20' }]}>
          <Text style={[styles.avatarText, { color: '#8E44AD' }]}>
            {user.firstName?.[0]}{user.lastName?.[0]}
          </Text>
        </View>
        <View style={styles.pendingInfo}>
          <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          {user.phone ? <Text style={styles.userPhone}>{user.phone}</Text> : null}
          <Text style={styles.pendingHint}>Registered as Group Admin — awaiting activation</Text>
        </View>
        <TouchableOpacity
          style={[styles.activatePillBtn, isBusy && { opacity: 0.6 }]}
          onPress={() => handleActivate(user)}
          disabled={isBusy}
        >
          {isBusy ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark" size={14} color={colors.white} />
              <Text style={styles.activatePillBtnText}>Activate</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'all' && styles.tabActive]}
          onPress={() => setTab('all')}
        >
          <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>All Users</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'pending' && styles.tabActive]}
          onPress={() => setTab('pending')}
        >
          <Text style={[styles.tabText, tab === 'pending' && styles.tabTextActive]}>
            Pending Admins
            {pendingAdmins.length > 0 && (
              <Text style={styles.tabBadge}> {pendingAdmins.length}</Text>
            )}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pending Group Admins Tab */}
      {tab === 'pending' && (
        pendingLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={pendingAdmins}
            renderItem={({ item }) => <PendingAdminCard user={item} />}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={pendingRefreshing} onRefresh={() => fetchPendingAdmins(true)} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="checkmark-done-circle" size={56} color={colors.success} />
                <Text style={styles.emptyTitle}>No Pending Requests</Text>
                <Text style={styles.emptyText}>All Group Admin accounts have been reviewed.</Text>
              </View>
            }
          />
        )
      )}

      {/* All Users Tab */}
      {tab === 'all' && (
        <>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email..."
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searching ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : search.length > 0 ? (
              <TouchableOpacity onPress={() => { setSearch(''); fetchUsers(true); }}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={users}
              renderItem={({ item }) => <UserCard user={item} />}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(true); }} />
              }
              onEndReached={loadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : null
              }
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyText}>No users found</Text>
                </View>
              }
            />
          )}
        </>
      )}

      {/* Role Assignment Modal */}
      <Modal
        visible={!!roleModalUser}
        animationType="slide"
        transparent
        onRequestClose={() => setRoleModalUser(null)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Roles</Text>
              <TouchableOpacity onPress={() => setRoleModalUser(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {roleModalUser && (
              <Text style={styles.modalSubtitle}>
                {roleModalUser.firstName} {roleModalUser.lastName} — {roleModalUser.email}
              </Text>
            )}

            <View style={styles.rolesList}>
              {ALL_ROLES.map(role => {
                const active = selectedRoles.includes(role);
                const color = ROLE_COLORS[role] ?? colors.primary;
                return (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleOption, active && { backgroundColor: color + '15', borderColor: color }]}
                    onPress={() => toggleRole(role)}
                  >
                    <View style={[styles.roleOptionCheck, active && { backgroundColor: color, borderColor: color }]}>
                      {active && <Ionicons name="checkmark" size={14} color={colors.white} />}
                    </View>
                    <Text style={[styles.roleOptionText, active && { color, fontWeight: '700' }]}>
                      {ROLE_LABELS[role] ?? role.replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.saveRolesBtn, savingRoles && { opacity: 0.6 }]}
              onPress={handleSaveRoles}
              disabled={savingRoles}
            >
              {savingRoles ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveRolesBtnText}>Update Roles</Text>
              )}
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  tabTextActive: { color: colors.primary },
  tabBadge: {
    color: colors.error,
    fontWeight: typography.fontWeight.bold,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    height: 48,
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: typography.fontSize.md, color: colors.text },

  list: { padding: spacing.md, gap: spacing.sm },

  // User cards
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardInactive: {
    opacity: 0.7,
    borderColor: colors.error + '40',
    borderStyle: 'dashed',
  },
  cardLeft: { flexDirection: 'row', flex: 1, alignItems: 'flex-start', gap: spacing.md },
  cardRight: { alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.text },
  pendingBadge: {
    backgroundColor: colors.error + '15',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  pendingBadgeText: { fontSize: 9, color: colors.error, fontWeight: typography.fontWeight.bold },
  userEmail: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  userPhone: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  roleBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleText: { fontSize: 10, fontWeight: typography.fontWeight.semibold },
  roleBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activateBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.successSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deactivateBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.errorSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.errorSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { paddingVertical: spacing.lg },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text },
  emptyText: { fontSize: typography.fontSize.md, color: colors.textSecondary, textAlign: 'center' },

  // Pending Admin Card
  pendingCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#8E44AD30',
    gap: spacing.md,
    shadowColor: '#8E44AD',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  pendingInfo: { flex: 1 },
  pendingHint: {
    fontSize: typography.fontSize.xs,
    color: '#8E44AD',
    marginTop: 4,
    fontStyle: 'italic',
  },
  activatePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  activatePillBtnText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text },
  modalSubtitle: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: -spacing.sm },
  rolesList: { gap: spacing.sm },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.md,
  },
  roleOptionCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleOptionText: { fontSize: typography.fontSize.md, color: colors.text },
  saveRolesBtn: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  saveRolesBtnText: { color: colors.white, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.md },
});

export default ManageUsersScreen;
