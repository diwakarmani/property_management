import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { GroupService } from '@/api/services/group.service';
import type { PropertyCardDTO } from '@/api/types/discovery.types';

type Tab = 'pending' | 'all';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:           { label: 'Live',     color: colors.success,  bg: colors.successSurface },
  PENDING_APPROVAL: { label: 'Pending',  color: '#F59E0B',       bg: '#FEF3C7' },
  SOLD:             { label: 'Sold',     color: '#6366F1',       bg: '#EEF2FF' },
  RENTED:           { label: 'Rented',   color: '#0EA5E9',       bg: '#E0F2FE' },
  INACTIVE:         { label: 'Inactive', color: colors.textSecondary, bg: colors.backgroundSecondary },
  DRAFT:            { label: 'Draft',    color: colors.textSecondary, bg: colors.backgroundSecondary },
};

const ApproveListingsScreen = ({ navigation }: any) => {
  const [tab, setTab] = useState<Tab>('pending');
  const [pendingListings, setPendingListings] = useState<PropertyCardDTO[]>([]);
  const [allListings, setAllListings] = useState<PropertyCardDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noGroup, setNoGroup] = useState(false);
  const [noMembers, setNoMembers] = useState(false);

  const [actioning, setActioning] = useState<Record<number, 'approve' | 'reject' | null>>({});
  const [rejectModal, setRejectModal] = useState<{ visible: boolean; listingId: number | null }>({
    visible: false, listingId: null,
  });
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const loadAll = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    GroupService.getMembers(0, 1)
      .then(membersRes => {
        const total = membersRes.data.data?.totalElements ?? 0;
        if (total === 0) {
          setNoMembers(true);
          setPendingListings([]);
          setAllListings([]);
          return Promise.reject(null); // short-circuit
        }
        setNoMembers(false);
        return Promise.all([
          GroupService.getPendingListings(0, 50),
          GroupService.getAllListings(0, 50),
        ]);
      })
      .then(results => {
        if (!results) return;
        const [pendingRes, allRes] = results;
        setPendingListings(pendingRes.data.data?.content ?? []);
        setAllListings(allRes.data.data?.content ?? []);
      })
      .catch(err => {
        if (err === null) return; // short-circuit from noMembers
        const status = err?.response?.status;
        if (status === 404 || status === 400) {
          setNoGroup(true);
        } else {
          Alert.alert('Error', 'Failed to load listings. Pull down to retry.');
        }
      })
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleApprove = (id: number) => {
    Alert.alert('Approve Listing', 'Approve this listing? It will go live immediately.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: () => {
          setActioning(prev => ({ ...prev, [id]: 'approve' }));
          GroupService.approveListing(id)
            .then(() => {
              setPendingListings(prev => prev.filter(l => l.id !== id));
              setAllListings(prev => prev.map(l =>
                l.id === id ? { ...l, status: 'ACTIVE' } : l
              ));
            })
            .catch(err => Alert.alert('Error', err?.response?.data?.message ?? 'Failed to approve listing'))
            .finally(() => setActioning(prev => ({ ...prev, [id]: null })));
        },
      },
    ]);
  };

  const openRejectModal = (id: number) => {
    setRejectReason('');
    setRejectModal({ visible: true, listingId: id });
  };

  const submitReject = () => {
    if (!rejectModal.listingId) return;
    const reason = rejectReason.trim() || 'Rejected by group admin';
    const id = rejectModal.listingId;
    setRejecting(true);
    GroupService.rejectListing(id, reason)
      .then(() => {
        setPendingListings(prev => prev.filter(l => l.id !== id));
        setAllListings(prev => prev.map(l =>
          l.id === id ? { ...l, status: 'DRAFT' } : l
        ));
        setRejectModal({ visible: false, listingId: null });
      })
      .catch(err => Alert.alert('Error', err?.response?.data?.message ?? 'Failed to reject listing'))
      .finally(() => setRejecting(false));
  };

  const formatPrice = (price: number) => {
    if (price >= 10_000_000) return `₹${(price / 10_000_000).toFixed(1)}Cr`;
    if (price >= 100_000) return `₹${(price / 100_000).toFixed(1)}L`;
    if (price >= 1_000) return `₹${(price / 1_000).toFixed(0)}K`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const PendingCard = ({ listing }: { listing: PropertyCardDTO }) => {
    const isApproving = actioning[listing.id] === 'approve';
    const isRejecting = actioning[listing.id] === 'reject';
    const busy = isApproving || isRejecting;

    return (
      <View style={styles.card}>
        {listing.primaryImageUrl ? (
          <Image source={{ uri: listing.primaryImageUrl }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={44} color={colors.border} />
          </View>
        )}
        <View style={styles.cardContent}>
          {listing.ownerName && (
            <View style={styles.ownerRow}>
              <Ionicons name="person-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.ownerText}>by {listing.ownerName}</Text>
            </View>
          )}
          <Text style={styles.cardTitle} numberOfLines={2}>{listing.title}</Text>
          <Text style={styles.cardPrice}>{formatPrice(listing.price)}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.locationText}>
              {[listing.locality, listing.city].filter(Boolean).join(', ')}
            </Text>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.btn, styles.approveBtn, busy && styles.btnDisabled]}
              onPress={() => handleApprove(listing.id)}
              disabled={busy}
            >
              {isApproving ? <ActivityIndicator size="small" color={colors.white} /> : (
                <><Ionicons name="checkmark" size={16} color={colors.white} /><Text style={styles.btnText}>Approve</Text></>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.rejectBtn, busy && styles.btnDisabled]}
              onPress={() => openRejectModal(listing.id)}
              disabled={busy}
            >
              {isRejecting ? <ActivityIndicator size="small" color={colors.white} /> : (
                <><Ionicons name="close" size={16} color={colors.white} /><Text style={styles.btnText}>Reject</Text></>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const AllListingCard = ({ listing }: { listing: PropertyCardDTO }) => {
    const statusInfo = STATUS_LABELS[listing.status ?? ''] ?? { label: listing.status ?? '', color: colors.textSecondary, bg: colors.backgroundSecondary };
    return (
      <View style={styles.allCard}>
        {listing.primaryImageUrl ? (
          <Image source={{ uri: listing.primaryImageUrl }} style={styles.allCardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.allCardImage, styles.imagePlaceholder]}>
            <Ionicons name="home-outline" size={28} color={colors.border} />
          </View>
        )}
        <View style={styles.allCardInfo}>
          <View style={styles.allCardTopRow}>
            <Text style={styles.allCardTitle} numberOfLines={1}>{listing.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            </View>
          </View>
          <Text style={styles.allCardPrice}>{formatPrice(listing.price)}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {[listing.locality, listing.city].filter(Boolean).join(', ')}
            </Text>
          </View>
          {listing.ownerName && (
            <View style={styles.ownerRow}>
              <Ionicons name="person-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.ownerText}>{listing.ownerName}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

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
        <Text style={styles.stateSubtext}>Create a group first to manage listings.</Text>
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

  if (noMembers) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
        <Text style={styles.stateTitle}>No Realtors Yet</Text>
        <Text style={styles.stateSubtext}>Add realtors to your group first.</Text>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => navigation.navigate('Team', { screen: 'ManageRealtors' })}
        >
          <Ionicons name="person-add-outline" size={20} color={colors.white} />
          <Text style={styles.ctaBtnText}>Add Realtors</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Reject modal */}
      <Modal visible={rejectModal.visible} transparent animationType="fade"
        onRequestClose={() => setRejectModal({ visible: false, listingId: null })}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject Listing</Text>
            <Text style={styles.modalDesc}>Provide a reason so the realtor can revise and resubmit.</Text>
            <TextInput
              style={styles.modalInput}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="e.g. Missing property details..."
              multiline
              numberOfLines={3}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRejectModal({ visible: false, listingId: null })}
                disabled={rejecting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalRejectBtn, rejecting && styles.btnDisabled]}
                onPress={submitReject}
                disabled={rejecting}
              >
                {rejecting
                  ? <ActivityIndicator size="small" color={colors.white} />
                  : <Text style={styles.modalRejectText}>Reject</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabItem, tab === 'pending' && styles.tabActive]} onPress={() => setTab('pending')}>
          <Text style={[styles.tabText, tab === 'pending' && styles.tabTextActive]}>
            Pending {pendingListings.length > 0 ? `(${pendingListings.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, tab === 'all' && styles.tabActive]} onPress={() => setTab('all')}>
          <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>
            All Listings {allListings.length > 0 ? `(${allListings.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'pending' ? (
        <FlatList
          data={pendingListings}
          renderItem={({ item }) => <PendingCard listing={item} />}
          keyExtractor={item => `p-${item.id}`}
          contentContainerStyle={pendingListings.length === 0 ? styles.emptyContainer : styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAll(true)} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-circle" size={64} color={colors.success} />
              <Text style={styles.stateTitle}>All caught up!</Text>
              <Text style={styles.stateSubtext}>No pending listings to review.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={allListings}
          renderItem={({ item }) => <AllListingCard listing={item} />}
          keyExtractor={item => `a-${item.id}`}
          contentContainerStyle={allListings.length === 0 ? styles.emptyContainer : styles.allList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAll(true)} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="home-outline" size={64} color={colors.border} />
              <Text style={styles.stateTitle}>No listings yet</Text>
              <Text style={styles.stateSubtext}>Once realtors publish listings, they'll appear here.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  emptyContainer: { flex: 1 },
  list: { padding: spacing.md },
  allList: { padding: spacing.md, gap: spacing.sm },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: typography.fontWeight.bold },

  // Pending card
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardImage: { width: '100%', height: 170 },
  imagePlaceholder: { backgroundColor: colors.backgroundSecondary, justifyContent: 'center', alignItems: 'center' },
  cardContent: { padding: spacing.md },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  ownerText: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' },
  cardTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.text },
  cardPrice: { fontSize: typography.fontSize.xl, color: colors.primary, fontWeight: typography.fontWeight.extrabold, marginVertical: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: typography.fontSize.sm, color: colors.textSecondary, flex: 1 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  btn: {
    flex: 1, flexDirection: 'row', height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  btnDisabled: { opacity: 0.55 },
  approveBtn: {
    backgroundColor: colors.success,
    shadowColor: colors.success, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  rejectBtn: {
    backgroundColor: colors.error,
    shadowColor: colors.error, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnText: { color: colors.white, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.sm },

  // All listings card
  allCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  allCardImage: { width: 100, height: 100 },
  allCardInfo: { flex: 1, padding: spacing.sm, justifyContent: 'space-between' },
  allCardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  allCardTitle: { flex: 1, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: typography.fontWeight.bold },
  allCardPrice: { fontSize: typography.fontSize.md, color: colors.primary, fontWeight: typography.fontWeight.extrabold, marginVertical: 2 },

  // States
  stateTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text, textAlign: 'center' },
  stateSubtext: { fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.sm, marginTop: 60 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 14, gap: spacing.sm,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  ctaBtnText: { color: colors.white, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.md },

  // Reject modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  modalCard: {
    backgroundColor: colors.surface, borderRadius: 20, padding: spacing.xl, width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  modalTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text, marginBottom: spacing.xs },
  modalDesc: { fontSize: typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.md },
  modalInput: {
    backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    padding: spacing.md, fontSize: typography.fontSize.md, color: colors.text, minHeight: 80,
    textAlignVertical: 'top', marginBottom: spacing.lg,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
  modalCancelBtn: {
    flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border,
  },
  modalCancelText: { color: colors.text, fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.md },
  modalRejectBtn: {
    flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.error, shadowColor: colors.error, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  modalRejectText: { color: colors.white, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.md },
});

export default ApproveListingsScreen;
