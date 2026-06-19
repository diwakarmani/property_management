import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, typography, spacing } from '@/theme';
import { AdminService } from '@/api/services/admin.service';
import type { PropertyDTO } from '@/api/types/property.types';
import { formatPrice } from '@/utils/helpers/formatPrice';

// ── Status tabs config ────────────────────────────────────────────────────────

const TABS = [
  { key: 'ALL',              label: 'All',     icon: 'apps-outline', color: colors.textSecondary },
  { key: 'PENDING_APPROVAL', label: 'Pending', icon: 'time-outline', color: colors.warning },
  { key: 'ACTIVE',           label: 'Active',  icon: 'checkmark-circle-outline', color: colors.success },
  { key: 'REJECTED',         label: 'Rejected',icon: 'close-circle-outline', color: colors.error },
  { key: 'SOLD',             label: 'Sold',    icon: 'cash-outline', color: colors.info },
  { key: 'RENTED',           label: 'Rented',  icon: 'key-outline', color: colors.primary },
] as const;

type TabKey = typeof TABS[number]['key'];

export const normalizeAdminListingStatus = (status?: string): TabKey =>
  TABS.some((tab) => tab.key === status) ? status as TabKey : 'PENDING_APPROVAL';

// ── Status badge ──────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; bg: string; fg: string }> = {
  PENDING_APPROVAL: { label: 'Pending',  bg: colors.warningSurface,  fg: colors.warning },
  ACTIVE:           { label: 'Active',   bg: colors.successSurface,  fg: colors.success },
  REJECTED:         { label: 'Rejected', bg: colors.errorSurface,    fg: colors.error   },
  DRAFT:            { label: 'Draft',    bg: colors.backgroundSecondary, fg: colors.textSecondary },
  SOLD:             { label: 'Sold',     bg: colors.infoSurface,     fg: colors.info    },
  RENTED:           { label: 'Rented',   bg: colors.primarySurface,  fg: colors.primary },
  INACTIVE:         { label: 'Inactive', bg: colors.backgroundSecondary, fg: colors.textLight },
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = statusConfig[status] ?? { label: status, bg: colors.backgroundSecondary, fg: colors.textSecondary };
  return (
    <View style={[badgeStyles.wrap, { backgroundColor: cfg.bg }]}>
      <Text style={[badgeStyles.text, { color: cfg.fg }]}>{cfg.label}</Text>
    </View>
  );
};

const badgeStyles = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  text: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold },
});

// ── Reject reason modal ───────────────────────────────────────────────────────

const RejectModal = ({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason.trim());
    setReason('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <Text style={modalStyles.title}>Reject Listing</Text>
          <Text style={modalStyles.subtitle}>Provide a reason for the owner/realtor (optional)</Text>
          <TextInput
            style={modalStyles.input}
            placeholder="e.g. Incomplete details, unclear photos..."
            placeholderTextColor={colors.textLight}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <View style={modalStyles.btnRow}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onCancel}>
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modalStyles.confirmBtn} onPress={handleConfirm}>
              <Text style={modalStyles.confirmText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnRow: { flexDirection: 'row', gap: spacing.md },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
  },
  cancelText: { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontWeight: typography.fontWeight.semibold },
  confirmBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  confirmText: { fontSize: typography.fontSize.sm, color: colors.white, fontWeight: typography.fontWeight.semibold },
});

// ── Property card ─────────────────────────────────────────────────────────────

export const PropertyCard = ({
  property,
  onApprove,
  onReject,
  onToggleFeatured,
  onToggleVerified,
  onPress,
  isPending,
}: {
  property: PropertyDTO;
  onApprove: () => void;
  onReject: () => void;
  onToggleFeatured: () => void;
  onToggleVerified: () => void;
  onPress?: () => void;
  isPending: boolean;
}) => {
  const isPendingStatus = property.status === 'PENDING_APPROVAL';

  return (
    <TouchableOpacity style={cardStyles.card} activeOpacity={0.85} onPress={onPress}>
      {/* Image + status badge */}
      <View style={cardStyles.imageWrap}>
        {property.primaryImageUrl ? (
          <Image source={{ uri: property.primaryImageUrl }} style={cardStyles.image} />
        ) : (
          <View style={cardStyles.noImage}>
            <Ionicons name="image-outline" size={32} color={colors.border} />
          </View>
        )}
        <View style={cardStyles.statusBadge}>
          <StatusBadge status={property.status} />
        </View>
        {property.isFeatured && (
          <View style={cardStyles.featuredBadge}>
            <Ionicons name="star" size={10} color={colors.warning} />
            <Text style={cardStyles.featuredText}>Featured</Text>
          </View>
        )}
      </View>

      {/* Details */}
      <View style={cardStyles.body}>
        <Text style={cardStyles.price}>{formatPrice(property.price)}</Text>
        <Text style={cardStyles.title} numberOfLines={2}>{property.title}</Text>
        <View style={cardStyles.locationRow}>
          <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
          <Text style={cardStyles.location} numberOfLines={1}>
            {property.locality}, {property.city}
          </Text>
        </View>
        <View style={cardStyles.ownerRow}>
          <Ionicons name={property.ownerIsRealtor ? 'briefcase-outline' : 'person-outline'} size={12} color={colors.textSecondary} />
          <Text style={cardStyles.owner} numberOfLines={1}>
            {property.ownerName} · {property.ownerIsRealtor ? 'Realtor' : 'Owner'}
          </Text>
        </View>

        {/* Rejection reason */}
        {property.rejectionReason ? (
          <View style={cardStyles.rejectionRow}>
            <Ionicons name="alert-circle-outline" size={12} color={colors.error} />
            <Text style={cardStyles.rejectionText} numberOfLines={2}>{property.rejectionReason}</Text>
          </View>
        ) : null}

        {/* Action row */}
        <View style={cardStyles.actions}>
          {isPendingStatus && (
            <>
              <TouchableOpacity
                style={[cardStyles.actionBtn, cardStyles.approveBtn]}
                onPress={onApprove}
                disabled={isPending}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={14} color={colors.white} />
                    <Text style={cardStyles.approveBtnText}>Approve</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[cardStyles.actionBtn, cardStyles.rejectBtn]}
                onPress={onReject}
                disabled={isPending}
              >
                <Ionicons name="close" size={14} color={colors.error} />
                <Text style={cardStyles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Feature / verify toggles — always shown */}
          <TouchableOpacity
            style={[cardStyles.iconBtn, property.isFeatured && cardStyles.iconBtnActive]}
            onPress={onToggleFeatured}
            disabled={isPending}
            accessibilityRole="button"
            accessibilityLabel="Toggle featured"
            accessibilityState={{ disabled: isPending, selected: property.isFeatured }}
          >
            <Ionicons
              name={property.isFeatured ? 'star' : 'star-outline'}
              size={16}
              color={property.isFeatured ? colors.warning : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[cardStyles.iconBtn, property.isVerified && cardStyles.iconBtnActiveGreen]}
            onPress={onToggleVerified}
            disabled={isPending}
            accessibilityRole="button"
            accessibilityLabel="Toggle verified"
            accessibilityState={{ disabled: isPending, selected: property.isVerified }}
          >
            <Ionicons
              name={property.isVerified ? 'shield-checkmark' : 'shield-outline'}
              size={16}
              color={property.isVerified ? colors.success : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 160 },
  noImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: { position: 'absolute', top: spacing.sm, left: spacing.sm },
  featuredBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.warningSurface,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  featuredText: { fontSize: typography.fontSize.xs, color: colors.warning, fontWeight: typography.fontWeight.semibold },

  body: { padding: spacing.md, gap: spacing.xs },
  price: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.primary },
  title: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.text },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { fontSize: typography.fontSize.xs, color: colors.textSecondary, flex: 1 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  owner: { fontSize: typography.fontSize.xs, color: colors.textSecondary, flex: 1 },
  rejectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    backgroundColor: colors.errorSurface,
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: 2,
  },
  rejectionText: { fontSize: typography.fontSize.xs, color: colors.error, flex: 1 },

  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs, alignItems: 'center' },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: 10,
  },
  approveBtn: { backgroundColor: colors.success },
  approveBtnText: { fontSize: typography.fontSize.sm, color: colors.white, fontWeight: typography.fontWeight.semibold },
  rejectBtn: { backgroundColor: colors.errorSurface, borderWidth: 1, borderColor: colors.error },
  rejectBtnText: { fontSize: typography.fontSize.sm, color: colors.error, fontWeight: typography.fontWeight.semibold },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: { backgroundColor: colors.warningSurface },
  iconBtnActiveGreen: { backgroundColor: colors.successSurface },
});

// ── Main screen ───────────────────────────────────────────────────────────────

const AdminListingsScreen = ({ route }: any) => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>(() =>
    normalizeAdminListingStatus(route?.params?.status)
  );
  const [page, setPage] = useState(0);
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);

  useEffect(() => {
    if (!route?.params?.status) return;
    setActiveTab(normalizeAdminListingStatus(route.params.status));
    setPage(0);
  }, [route?.params?.status]);

  const queryKey = ['admin', 'properties', activeTab, page];

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () => AdminService.getAdminProperties(activeTab, page, 20),
    select: (res) => res.data.data,
    staleTime: 30_000,
  });

  const onMutationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'properties'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
  };

  const approveMutation = useMutation({
    mutationFn: (id: number) => AdminService.approveProperty(id),
    onSuccess: () => {
      Alert.alert('Approved', 'Listing is now live.');
      onMutationSuccess();
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not approve listing.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      AdminService.rejectProperty(id, reason),
    onSuccess: () => {
      Alert.alert('Rejected', 'Listing has been rejected.');
      setRejectTargetId(null);
      onMutationSuccess();
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not reject listing.');
    },
  });

  const featuredMutation = useMutation({
    mutationFn: (id: number) => AdminService.toggleFeatured(id),
    onSuccess: () => onMutationSuccess(),
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not update featured status.');
    },
  });

  const verifiedMutation = useMutation({
    mutationFn: (id: number) => AdminService.toggleVerified(id),
    onSuccess: () => onMutationSuccess(),
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not update verified status.');
    },
  });

  const handleApprove = useCallback((id: number) => {
    Alert.alert('Approve Listing', 'Set this listing as active and visible to buyers?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => approveMutation.mutate(id) },
    ]);
  }, [approveMutation]);

  const properties: PropertyDTO[] = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const isMutating =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    featuredMutation.isPending ||
    verifiedMutation.isPending;

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    setPage(0);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Listings</Text>
          {totalElements > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{totalElements}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => refetch()} style={styles.headerBtn}>
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => handleTabChange(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={14}
              color={activeTab === tab.key ? tab.color : colors.textLight}
            />
            <Text style={[styles.tabLabel, activeTab === tab.key && { color: tab.color }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading listings...</Text>
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>Could not load listings</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : properties.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="document-outline" size={48} color={colors.border} />
          <Text style={styles.emptyTitle}>No listings</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'PENDING_APPROVAL'
              ? 'No listings waiting for review.'
              : `No ${activeTab.toLowerCase().replace('_', ' ')} listings.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onApprove={() => handleApprove(item.id)}
              onReject={() => setRejectTargetId(item.id)}
              onToggleFeatured={() => featuredMutation.mutate(item.id)}
              onToggleVerified={() => verifiedMutation.mutate(item.id)}
              onPress={() => (navigation as any).navigate('PropertyDetail', { id: item.id })}
              isPending={isMutating}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => refetch()} />
          }
          contentContainerStyle={styles.list}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
                  disabled={page === 0}
                  onPress={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <Ionicons name="chevron-back" size={16} color={page === 0 ? colors.textLight : colors.primary} />
                </TouchableOpacity>
                <Text style={styles.pageInfo}>Page {page + 1} of {totalPages}</Text>
                <TouchableOpacity
                  style={[styles.pageBtn, page >= totalPages - 1 && styles.pageBtnDisabled]}
                  disabled={page >= totalPages - 1}
                  onPress={() => setPage((p) => p + 1)}
                >
                  <Ionicons name="chevron-forward" size={16} color={page >= totalPages - 1 ? colors.textLight : colors.primary} />
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      {/* Reject modal */}
      <RejectModal
        visible={rejectTargetId !== null}
        onCancel={() => setRejectTargetId(null)}
        onConfirm={(reason) => {
          if (rejectTargetId !== null) {
            rejectMutation.mutate({ id: rejectTargetId, reason });
          }
        }}
      />
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  countText: { fontSize: typography.fontSize.xs, color: colors.white, fontWeight: typography.fontWeight.bold },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingHorizontal: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textLight,
  },

  list: { paddingTop: spacing.md, paddingBottom: 32 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  loadingText: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  errorText: { fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primarySurface,
    borderRadius: 12,
  },
  retryText: { fontSize: typography.fontSize.sm, color: colors.primary, fontWeight: typography.fontWeight.semibold },
  emptyTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.text },
  emptySubtitle: { fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center' },

  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBtnDisabled: { backgroundColor: colors.backgroundSecondary },
  pageInfo: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
});

export default AdminListingsScreen;
