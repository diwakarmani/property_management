import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import type { PropertyDTO } from '@/api/types/property.types';
import {
  useMyListingsQuery,
  useDeletePropertyMutation,
  usePublishPropertyMutation,
} from '@/api/hooks/useProperties';
import OptimizedImage from '@/components/common/OptimizedImage';
import AsyncBoundary from '@/components/common/AsyncBoundary';

const STATUS_TABS = ['ALL', 'DRAFT', 'ACTIVE', 'PENDING_APPROVAL', 'SOLD', 'RENTED'] as const;
type StatusTab = typeof STATUS_TABS[number];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#95A5A6',
  ACTIVE: '#27AE60',
  PENDING_APPROVAL: '#F39C12',
  SOLD: '#2980B9',
  RENTED: '#8E44AD',
  INACTIVE: '#E74C3C',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: 'PENDING',
};

const formatPrice = (price: number) => {
  if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
  if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
  return `$${price.toLocaleString('en-US')}`;
};

const MyListingsScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<StatusTab>('ALL');
  const { data: allListings = [], isLoading, isError, error, refetch, isFetching } =
    useMyListingsQuery(0, 50);
  const deleteListing = useDeletePropertyMutation();
  const publishListing = usePublishPropertyMutation();

  const errorMessage = isError ? (error as any)?.response?.data?.message ?? 'Could not load your listings.' : null;

  const filtered = activeTab === 'ALL'
    ? allListings
    : allListings.filter(p => p.status === activeTab);

  const handleDelete = (property: PropertyDTO) => {
    Alert.alert(
      'Delete Listing',
      `Are you sure you want to delete "${property.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteListing.mutate(property.id, {
              onError: () => Alert.alert('Error', 'Failed to delete listing'),
            }),
        },
      ]
    );
  };

  const handlePublish = (property: PropertyDTO) => {
    publishListing.mutate(property.id, {
      onError: () => Alert.alert('Error', 'Failed to publish listing'),
    });
  };

  const ListingCard = ({ item }: { item: PropertyDTO }) => {
    const statusColor = STATUS_COLORS[item.status] ?? colors.textSecondary;
    const statusLabel = STATUS_LABELS[item.status] ?? item.status;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
        activeOpacity={0.9}
      >
        <View style={styles.cardImageWrap}>
          <OptimizedImage uri={item.primaryImageUrl ?? ''} style={styles.cardImage} />
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
          <Text style={styles.cardLocation} numberOfLines={1}>
            {item.locality}, {item.city}
          </Text>

          <View style={styles.cardMeta}>
            {item.bedrooms ? (
              <View style={styles.metaItem}>
                <Ionicons name="bed-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>{item.bedrooms} BHK</Text>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>{item.viewCount ?? 0} views</Text>
            </View>
          </View>

          <View style={styles.cardActions}>
            {item.status === 'DRAFT' && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.publishBtn]}
                onPress={() => handlePublish(item)}
              >
                <Text style={styles.actionBtnText}>Publish</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, styles.imagesBtn]}
              onPress={() => navigation.navigate('PropertyImages', { propertyId: item.id, propertyTitle: item.title })}
            >
              <Ionicons name="images-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.editBtn]}
              onPress={() => navigation.navigate('EditListing', { propertyId: item.id })}
            >
              <Ionicons name="create-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <AsyncBoundary loading={isLoading} error={errorMessage} onRetry={() => refetch()}>
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Listings</Text>
        <Text style={styles.headerCount}>{allListings.length} total</Text>
      </View>

      {/* Status Tabs */}
      <FlatList
        horizontal
        data={STATUS_TABS}
        keyExtractor={t => t}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        renderItem={({ item: tab }) => {
          const count = tab === 'ALL'
            ? allListings.length
            : allListings.filter(p => p.status === tab).length;
          return (
            <TouchableOpacity
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {STATUS_LABELS[tab] ?? tab}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, activeTab === tab && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === tab && styles.tabBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Listings */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => <ListingCard item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => refetch()} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>
              {activeTab === 'ALL' ? 'No listings yet' : `No ${activeTab.toLowerCase()} listings`}
            </Text>
            {activeTab === 'ALL' && (
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => navigation.navigate('Create')}
              >
                <Text style={styles.createBtnText}>Create Your First Listing</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
    </AsyncBoundary>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  headerCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    fontWeight: typography.fontWeight.medium,
  },
  tabs: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 4,
    backgroundColor: colors.background,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: typography.fontSize.xs, color: colors.text, fontWeight: typography.fontWeight.medium },
  tabTextActive: { color: colors.white, fontWeight: typography.fontWeight.bold },
  tabBadge: {
    backgroundColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabBadgeText: { fontSize: 9, color: colors.textSecondary, fontWeight: typography.fontWeight.bold },
  tabBadgeTextActive: { color: colors.white },
  list: { padding: spacing.md, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardImageWrap: { position: 'relative', height: 160 },
  cardImage: { width: '100%', height: '100%' },
  statusBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: { color: colors.white, fontSize: 10, fontWeight: typography.fontWeight.bold, letterSpacing: 0.3 },
  cardBody: { padding: spacing.md },
  cardTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.text },
  cardPrice: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.extrabold, color: colors.primary, marginTop: 3 },
  cardLocation: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 3 },
  cardMeta: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtn: { backgroundColor: colors.primary },
  imagesBtn: { borderWidth: 1.5, borderColor: colors.primary, paddingHorizontal: spacing.sm },
  editBtn: { borderWidth: 1.5, borderColor: colors.primary, paddingHorizontal: spacing.sm },
  deleteBtn: { borderWidth: 1.5, borderColor: colors.error, paddingHorizontal: spacing.sm, backgroundColor: colors.errorSurface },
  actionBtnText: { color: colors.white, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  empty: { alignItems: 'center', padding: spacing.xl, gap: spacing.md, paddingTop: 60 },
  emptyText: { fontSize: typography.fontSize.md, color: colors.textSecondary },
  createBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  createBtnText: { color: colors.white, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.md },
});

export default MyListingsScreen;
