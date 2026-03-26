import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { GroupService } from '@/api/services/group.service';
import type { GroupMemberDTO } from '@/api/types/group.types';

const ManageRealtorsScreen = ({ navigation }: any) => {
  const [members, setMembers] = useState<GroupMemberDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMembers = () => {
    GroupService.getMembers()
      .then(res => setMembers(res.data.data.content))
      .catch(err => console.error('Failed to load members', err))
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: 'bold' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderRadius: 8,
  },
  addBtnText: { color: colors.white, fontSize: typography.fontSize.sm, fontWeight: '600' },
  center: { justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.md },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.md, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  realtorInfo: { flex: 1 },
  name: { fontSize: typography.fontSize.md, fontWeight: '600' },
  email: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 4 },
  stats: { flexDirection: 'row', gap: spacing.xl },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  statValue: { fontSize: typography.fontSize.lg, fontWeight: 'bold', marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', paddingTop: spacing.xl * 3 },
  emptyText: { fontSize: typography.fontSize.lg, color: colors.textSecondary, marginTop: spacing.md },
});

export default ManageRealtorsScreen;
