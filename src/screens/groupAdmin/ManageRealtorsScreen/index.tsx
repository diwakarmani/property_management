import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { GroupService } from '@/api/services/group.service';
import type { GroupMemberDTO } from '@/api/types/group.types';

const ManageRealtorsScreen = ({ navigation }: any) => {
  const [members, setMembers] = useState<GroupMemberDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [noGroup, setNoGroup] = useState(false);

  const loadMembers = () => {
    GroupService.getMembers()
      .then(res => { setMembers(res.data.data.content); setNoGroup(false); })
      .catch(err => {
        const status = err?.response?.status;
        if (status === 404 || status === 400) {
          setNoGroup(true);
        } else {
          console.error('Failed to load members', err);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadMembers(); }, []);

  const handleRemove = (member: GroupMemberDTO) => {
    Alert.alert(
      'Remove Member',
      `Remove ${member.firstName} ${member.lastName} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            GroupService.removeMember(member.userId)
              .then(() => setMembers(prev => prev.filter(m => m.userId !== member.userId)))
              .catch(err => console.error('Failed to remove member', err));
          },
        },
      ],
    );
  };

  const MemberCard = ({ member }: { member: GroupMemberDTO }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.realtorInfo}>
          <Text style={styles.name}>{member.firstName} {member.lastName}</Text>
          <Text style={styles.email}>{member.email}</Text>
        </View>
        <TouchableOpacity onPress={() => handleRemove(member)}>
          <Ionicons name="trash-outline" size={24} color={colors.error} />
        </TouchableOpacity>
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
      <View style={[styles.container, styles.center, styles.noGroupWrap]}>
        <Ionicons name="business-outline" size={64} color={colors.textSecondary} />
        <Text style={styles.noGroupTitle}>No Group Yet</Text>
        <Text style={styles.noGroupSubtitle}>Create a group first to start adding realtors.</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('Dashboard', { screen: 'CreateGroup' })}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.white} />
          <Text style={styles.createBtnText}>Create Group</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Team Members</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddMember')}
        >
          <Ionicons name="person-add-outline" size={18} color={colors.white} />
          <Text style={styles.addBtnText}>Add Member</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={members}
        renderItem={({ item }) => <MemberCard member={item} />}
        keyExtractor={item => item.userId.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={64} color={colors.border} />
            <Text style={styles.emptyText}>No members yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
  addBtnText: { color: colors.white, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  center: { justifyContent: 'center', alignItems: 'center' },
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  realtorInfo: { flex: 1 },
  name: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  email: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 4 },
  stats: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  statItem: {
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    flex: 1,
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
  noGroupWrap: { paddingHorizontal: spacing.xl, gap: spacing.md },
  noGroupTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text, marginTop: spacing.sm },
  noGroupSubtitle: { fontSize: typography.fontSize.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
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
});

export default ManageRealtorsScreen;
