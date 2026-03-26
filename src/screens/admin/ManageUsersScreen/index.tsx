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
  const [users, setUsers] = useState<AdminUserDTO[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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

  useEffect(() => {
    fetchUsers(true);
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

    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={[styles.avatar, { backgroundColor: roleColor + '20' }]}>
            <Text style={[styles.avatarText, { color: roleColor }]}>
              {user.firstName?.[0]}{user.lastName?.[0]}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
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

      {/* Role Assignment Modal */}
      <Modal
        visible={!!roleModalUser}
        animationType="slide"
        transparent
        onRequestClose={() => setRoleModalUser(null)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSheet}>
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm, fontSize: typography.fontSize.md },
  list: { padding: spacing.md, gap: spacing.sm },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
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
  avatarText: { fontSize: typography.fontSize.md, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  userName: { fontSize: typography.fontSize.md, fontWeight: '600' },
  userEmail: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  userPhone: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  roleBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleText: { fontSize: 10, fontWeight: '600' },
  roleBtn: { padding: spacing.xs },
  deleteBtn: { padding: spacing.xs },
  footer: { paddingVertical: spacing.lg },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  emptyText: { fontSize: typography.fontSize.md, color: colors.textSecondary },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { fontSize: typography.fontSize.xl, fontWeight: 'bold' },
  modalSubtitle: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: -spacing.sm },
  rolesList: { gap: spacing.sm },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
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
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveRolesBtnText: { color: colors.white, fontWeight: '700', fontSize: typography.fontSize.md },
});

export default ManageUsersScreen;
