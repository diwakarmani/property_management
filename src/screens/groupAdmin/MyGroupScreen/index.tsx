import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { GroupService } from '@/api/services/group.service';
import type { RealtorGroupDTO } from '@/api/types/group.types';

type GroupStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';

const STATUS_CONFIG: Record<GroupStatus, { color: string; bg: string; icon: string; label: string }> = {
  ACTIVE: { color: '#27AE60', bg: '#27AE6015', icon: 'checkmark-circle', label: 'Active' },
  PENDING_APPROVAL: { color: '#F39C12', bg: '#F39C1215', icon: 'time', label: 'Pending Approval' },
  REJECTED: { color: '#E74C3C', bg: '#E74C3C15', icon: 'close-circle', label: 'Rejected' },
  SUSPENDED: { color: '#7F8C8D', bg: '#7F8C8D15', icon: 'ban', label: 'Suspended' },
};

const MyGroupScreen = ({ navigation }: any) => {
  const [group, setGroup] = useState<RealtorGroupDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noGroup, setNoGroup] = useState(false);

  const loadGroup = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    GroupService.getMyGroup()
      .then(res => {
        setGroup(res.data.data);
        setNoGroup(false);
      })
      .catch(err => {
        const status = err?.response?.status;
        if (status === 404 || status === 400) {
          setNoGroup(true);
          setGroup(null);
        } else {
          console.error('Failed to load group', err);
        }
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    loadGroup();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (noGroup) {
    return (
      <View style={styles.centered}>
        <Ionicons name="business-outline" size={64} color={colors.textSecondary} />
        <Text style={styles.noGroupTitle}>No Group Yet</Text>
        <Text style={styles.noGroupSubtitle}>
          Create a group to start managing realtors and listings.
        </Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateGroup')}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.white} />
          <Text style={styles.createBtnText}>Create Group</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!group) return null;

  const statusKey = group.status as GroupStatus;
  const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.PENDING_APPROVAL;

  const InfoRow = ({ icon, label, value }: { icon: string; label: string; value?: string | null }) => {
    if (!value) return null;
    return (
      <View style={styles.infoRow}>
        <Ionicons name={icon as any} size={18} color={colors.textSecondary} style={styles.infoIcon} />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadGroup(true)} />}
    >
      {/* Header card */}
      <View style={styles.headerCard}>
        <View style={styles.groupIconWrapper}>
          <Ionicons name="business" size={36} color={colors.primary} />
        </View>
        <Text style={styles.groupName}>{group.name}</Text>
        {group.companyName ? (
          <Text style={styles.companyName}>{group.companyName}</Text>
        ) : null}

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg, borderColor: statusCfg.color }]}>
          <Ionicons name={statusCfg.icon as any} size={14} color={statusCfg.color} />
          <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>

        {/* Status-specific messages */}
        {statusKey === 'PENDING_APPROVAL' && (
          <View style={styles.infoAlert}>
            <Ionicons name="information-circle-outline" size={16} color="#F39C12" />
            <Text style={styles.infoAlertText}>
              Your group is under review by the admin. You will be notified once approved.
            </Text>
          </View>
        )}
        {(statusKey === 'REJECTED' || statusKey === 'SUSPENDED') && group.rejectionReason && (
          <View style={[styles.infoAlert, styles.errorAlert]}>
            <Ionicons name="alert-circle-outline" size={16} color="#E74C3C" />
            <Text style={[styles.infoAlertText, styles.errorAlertText]}>
              {group.rejectionReason}
            </Text>
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Group Details</Text>

        <InfoRow icon="person-outline" label="Admin" value={group.groupAdminName} />
        <InfoRow icon="mail-outline" label="Admin Email" value={group.groupAdminEmail} />
        <InfoRow icon="document-text-outline" label="Business License" value={group.businessLicense} />
        <InfoRow icon="location-outline" label="Address" value={group.address} />
        {group.website ? (
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => group.website && Linking.openURL(
              group.website!.startsWith('http') ? group.website! : `https://${group.website}`
            )}
          >
            <Ionicons name="globe-outline" size={18} color={colors.textSecondary} style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Website</Text>
              <Text style={[styles.infoValue, styles.linkText]}>{group.website}</Text>
            </View>
            <Ionicons name="open-outline" size={14} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
        <InfoRow icon="people-outline" label="Members" value={String(group.memberCount ?? 0)} />
        {group.description ? (
          <View style={styles.descriptionBlock}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={styles.descriptionText}>{group.description}</Text>
          </View>
        ) : null}
      </View>

      {/* Actions */}
      <View style={styles.actionsCard}>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditGroup')}>
          <Ionicons name="create-outline" size={20} color={colors.white} />
          <Text style={styles.editBtnText}>Edit Group Info</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  noGroupTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.sm,
  },
  noGroupSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 10,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  createBtnText: { color: colors.white, fontWeight: '700', fontSize: typography.fontSize.md },

  headerCard: {
    backgroundColor: colors.white,
    margin: spacing.md,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  groupIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  companyName: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  statusText: { fontSize: typography.fontSize.sm, fontWeight: '700' },
  infoAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF9E7',
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.xs,
  },
  infoAlertText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: '#F39C12',
    lineHeight: 18,
  },
  errorAlert: { backgroundColor: '#FDEDEC' },
  errorAlertText: { color: '#E74C3C' },

  detailsCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    borderRadius: 16,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoIcon: { marginRight: spacing.md },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: typography.fontSize.md, color: colors.text, marginTop: 2 },
  linkText: { color: colors.primary },
  descriptionBlock: { paddingVertical: spacing.md },
  descriptionText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 22,
    marginTop: spacing.xs,
  },

  actionsCard: {
    margin: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 10,
    gap: spacing.sm,
  },
  editBtnText: { color: colors.white, fontWeight: '700', fontSize: typography.fontSize.md },
});

export default MyGroupScreen;
