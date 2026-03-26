import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { GroupService } from '@/api/services/group.service';
import type { PropertyCardDTO } from '@/api/types/discovery.types';

const ApproveListingsScreen = () => {
  const [listings, setListings] = useState<PropertyCardDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const loadListings = () => {
    GroupService.getPendingListings()
      .then(res => setListings(res.data.data.content))
      .catch(err => console.error('Failed to load pending listings', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadListings(); }, []);

  const handleApprove = (id: number) => {
    GroupService.approveListing(id)
      .then(() => setListings(prev => prev.filter(l => l.id !== id)))
      .catch(err => console.error('Failed to approve listing', err));
  };

  const handleReject = (id: number) => {
    Alert.prompt(
      'Reject Listing',
      'Please provide a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: (reason?: string) => {
            GroupService.rejectListing(id, reason || 'Rejected by group admin')
              .then(() => setListings(prev => prev.filter(l => l.id !== id)))
              .catch(err => console.error('Failed to reject listing', err));
          },
        },
      ],
      'plain-text',
    );
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)}Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const ListingCard = ({ listing }: { listing: PropertyCardDTO }) => (
    <View style={styles.card}>
      {listing.primaryImageUrl ? (
        <Image source={{ uri: listing.primaryImageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="image-outline" size={48} color={colors.border} />
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.price}>{formatPrice(listing.price)}</Text>
        <Text style={styles.location}>{listing.locality}, {listing.city}</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.approveButton]}
            onPress={() => handleApprove(listing.id)}
          >
            <Ionicons name="checkmark" size={20} color={colors.white} />
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={() => handleReject(listing.id)}
          >
            <Ionicons name="close" size={20} color={colors.white} />
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
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
      {listings.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="checkmark-done-circle" size={64} color={colors.success} />
          <Text style={styles.emptyText}>All caught up!</Text>
          <Text style={styles.emptySubtext}>No pending listings to review</Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          renderItem={({ item }) => <ListingCard listing={item} />}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.md },
  card: { backgroundColor: colors.white, borderRadius: 12, marginBottom: spacing.md, overflow: 'hidden' },
  image: { width: '100%', height: 200 },
  imagePlaceholder: { backgroundColor: colors.backgroundSecondary, justifyContent: 'center', alignItems: 'center' },
  cardContent: { padding: spacing.md },
  title: { fontSize: typography.fontSize.lg, fontWeight: 'bold' },
  price: { fontSize: typography.fontSize.xl, color: colors.primary, marginTop: spacing.xs },
  location: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  button: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  approveButton: { backgroundColor: colors.success },
  rejectButton: { backgroundColor: colors.error },
  buttonText: { color: colors.white, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyText: { fontSize: typography.fontSize.xl, fontWeight: 'bold', marginTop: spacing.md },
  emptySubtext: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
});

export default ApproveListingsScreen;
