import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { PropertyService } from '@/api/services/property.service';
import type { PropertyDTO } from '@/api/types/property.types';
import OptimizedImage from '@/components/common/OptimizedImage';

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
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
};

const MyListingsScreen = ({ navigation }: any) => {
  const [allListings, setAllListings] = useState<PropertyDTO[]>([]);
  const [activeTab, setActiveTab] = useState<StatusTab>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchListings = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    PropertyService.getMyListings(0, 50)
      .then(res => setAllListings(res.data.data?.content ?? []))
      .catch(err => console.error('Failed to load listings', err))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

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
          onPress: () => {
            PropertyService.deleteProperty(property.id)
              .then(() => {
                setAllListings(prev => prev.filter(p => p.id !== property.id));
              })
              .catch(() => Alert.alert('Error', 'Failed to delete listing'));
          },
        },
      ]
    );
  };

  const handlePublish = (property: PropertyDTO) => {
    PropertyService.publishProperty(property.id)
      .then(res => {
        setAllListings(prev =>
          prev.map(p => (p.id === property.id ? res.data.data : p))
        );
      })
      .catch(() => Alert.alert('Error', 'Failed to publish listing'));
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
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
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchListings(true)} />
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
    backgroundColor: colors.white,
  },
  headerTitle: { fontSize: typography.fontSize.xl, fontWeight: 'bold' },
  headerCount: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  tabs: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm, backgroundColor: colors.white },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: typography.fontSize.sm, color: colors.text },
  tabTextActive: { color: colors.white, fontWeight: '600' },
  tabBadge: {
    backgroundColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabBadgeText: { fontSize: 10, color: colors.text },
  tabBadgeTextActive: { color: colors.white },
  list: { padding: spacing.md, gap: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardImageWrap: { position: 'relative', height: 160 },
  cardImage: { width: '100%', height: '100%' },
  statusBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  cardBody: { padding: spacing.md },
  cardTitle: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text },
  cardPrice: { fontSize: typography.fontSize.lg, fontWeight: 'bold', color: colors.primary, marginTop: 2 },
  cardLocation: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  cardMeta: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtn: { backgroundColor: colors.primary },
  imagesBtn: { borderWidth: 1, borderColor: colors.primary, paddingHorizontal: spacing.sm },
  editBtn: { borderWidth: 1, borderColor: colors.primary, paddingHorizontal: spacing.sm },
  deleteBtn: { borderWidth: 1, borderColor: colors.error, paddingHorizontal: spacing.sm },
  actionBtnText: { color: colors.white, fontSize: typography.fontSize.sm, fontWeight: '600' },
  empty: { alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  emptyText: { fontSize: typography.fontSize.md, color: colors.textSecondary },
  createBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 8, marginTop: spacing.sm },
  createBtnText: { color: colors.white, fontWeight: '600' },
});

export default MyListingsScreen;
