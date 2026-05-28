import React, { useEffect, useState, useRef } from 'react';
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

const ApproveListingsScreen = ({ navigation }: any) => {
  const [listings, setListings] = useState<PropertyCardDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noGroup, setNoGroup] = useState(false);
  const [noMembers, setNoMembers] = useState(false);

  // Per-card loading state for approve/reject buttons
  const [actioning, setActioning] = useState<Record<number, 'approve' | 'reject' | null>>({});

  // Reject modal state
  const [rejectModal, setRejectModal] = useState<{ visible: boolean; listingId: number | null }>({
    visible: false,
    listingId: null,
  });
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const loadListings = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    // First check if there are members — no members means pending will always be empty
    GroupService.getMembers(0, 1)
      .then(membersRes => {
        const total = membersRes.data.data?.totalElements ?? 0;
        if (total === 0) {
          setNoMembers(true);
          setListings([]);
          return;
        }
        setNoMembers(false);
        return GroupService.getPendingListings();
      })
      .then(res => {
        if (res) setListings(res.data.data.content);
      })
      .catch(err => {
        const status = err?.response?.status;
        if (status === 404 || status === 400) {
          setNoGroup(true);
        } else {
          Alert.alert('Error', 'Failed to load pending listings. Pull down to retry.');
        }
      })
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { loadListings(); }, []);

  const handleApprove = (id: number) => {
    Alert.alert(
      'Approve Listing',
      'Approve this listing? It will go live immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            setActioning(prev => ({ ...prev, [id]: 'approve' }));
            GroupService.approveListing(id)
              .then(() => {
                setListings(prev => prev.filter(l => l.id !== id));
              })
              .catch(err => {
                const msg = err?.response?.data?.message ?? 'Failed to approve listing';
                Alert.alert('Error', msg);
              })
              .finally(() => setActioning(prev => ({ ...prev, [id]: null })));
          },
        },
      ]
    );
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
        setListings(prev => prev.filter(l => l.id !== id));
        setRejectModal({ visible: false, listingId: null });
      })
      .catch(err => {
        const msg = err?.response?.data?.message ?? 'Failed to reject listing';
        Alert.alert('Error', msg);
      })
      .finally(() => setRejecting(false));
  };

  const formatPrice = (price: number) => {
    if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
    if (price >= 1_000) return `$${(price / 1_000).toFixed(0)}K`;
    return `$${price.toLocaleString('en-US')}`;
  };

  const ListingCard = ({ listing }: { listing: PropertyCardDTO }) => {
    const isApproving = actioning[listing.id] === 'approve';
    const isRejecting = actioning[listing.id] === 'reject';
    const busy = isApproving || isRejecting;

    return (
      <View style={styles.card}>
        {listing.primaryImageUrl ? (
          <Image source={{ uri: listing.primaryImageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={48} color={colors.border} />
          </View>
        )}
        <View style={styles.cardContent}>
          {(listing as any).ownerName ? (
            <View style={styles.ownerRow}>
              <Ionicons name="person-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.ownerText}>by {(listing as any).ownerName}</Text>
            </View>
          ) : null}
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>{formatPrice(listing.price)}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.locationText}>
              {[listing.locality, listing.city].filter(Boolean).join(', ')}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.approveButton, busy && styles.buttonBusy]}
              onPress={() => handleApprove(listing.id)}
              disabled={busy}
            >
              {isApproving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color={colors.white} />
                  <Text style={styles.buttonText}>Approve</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton, busy && styles.buttonBusy]}
              onPress={() => openRejectModal(listing.id)}
              disabled={busy}
            >
              {isRejecting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="close" size={18} color={colors.white} />
                  <Text style={styles.buttonText}>Reject</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
        <Text style={styles.stateSubtext}>Create a group first to review listings from your realtors.</Text>
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
        <Text style={styles.stateSubtext}>
          Add realtors to your group first. When they submit listings, they'll appear here for review.
        </Text>
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
      {/* Reject reason modal */}
      <Modal
        visible={rejectModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModal({ visible: false, listingId: null })}
      >
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
                style={[styles.modalRejectBtn, rejecting && styles.buttonBusy]}
                onPress={submitReject}
                disabled={rejecting}
              >
                {rejecting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.modalRejectText}>Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FlatList
        data={listings}
        renderItem={({ item }) => <ListingCard listing={item} />}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={listings.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadListings(true)} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-circle" size={64} color={colors.success} />
            <Text style={styles.stateTitle}>All caught up!</Text>
            <Text style={styles.stateSubtext}>No pending listings to review right now.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  list: { padding: spacing.md },
  emptyContainer: { flex: 1 },

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
  image: { width: '100%', height: 180 },
  imagePlaceholder: {
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: { padding: spacing.md },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  ownerText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  price: {
    fontSize: typography.fontSize.xl,
    color: colors.primary,
    fontWeight: typography.fontWeight.extrabold,
    marginTop: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  locationText: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  button: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  buttonBusy: { opacity: 0.55 },
  approveButton: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rejectButton: {
    backgroundColor: colors.error,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { color: colors.white, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.sm },

  stateTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  stateSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    marginTop: 80,
  },
  ctaBtn: {
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
  ctaBtnText: { color: colors.white, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.md },

  // Reject modal
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
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
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
  modalCancelText: {
    color: colors.text,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.md,
  },
  modalRejectBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalRejectText: {
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.md,
  },
});

export default ApproveListingsScreen;
