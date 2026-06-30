import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import type { PropertyDTO } from '@/api/types/property.types';
import {
  useMyListingsInfiniteQuery,
  useRequestDeletionMutation,
  usePublishPropertyMutation,
} from '@/api/hooks/useProperties';
import OptimizedImage from '@/components/common/OptimizedImage';
import AsyncBoundary from '@/components/common/AsyncBoundary';
import { formatPrice } from '@/utils/helpers/formatPrice';

const STATUS_TABS = [
  { key: 'ALL',                label: 'All',       icon: 'apps-outline',             color: colors.textSecondary },
  { key: 'ACTIVE',             label: 'Active',    icon: 'checkmark-circle-outline', color: '#27AE60' },
  { key: 'DRAFT',              label: 'Draft',     icon: 'document-outline',         color: '#95A5A6' },
  { key: 'PENDING_APPROVAL',   label: 'Pending',   icon: 'time-outline',             color: '#F39C12' },
  { key: 'DELETION_REQUESTED', label: 'Delete Req.', icon: 'hourglass-outline',      color: '#E67E22' },
  { key: 'SOLD',               label: 'Sold',      icon: 'cash-outline',             color: '#2980B9' },
  { key: 'RENTED',             label: 'Rented',    icon: 'key-outline',              color: '#8E44AD' },
  { key: 'INACTIVE',           label: 'Removed',   icon: 'archive-outline',          color: '#C0392B' },
] as const;

type StatusTab = typeof STATUS_TABS[number]['key'];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#27AE60',
  DRAFT: '#95A5A6',
  PENDING_APPROVAL: '#F39C12',
  DELETION_REQUESTED: '#E67E22',
  SOLD: '#2980B9',
  RENTED: '#8E44AD',
  INACTIVE: '#C0392B',
};

type ChipBarProps = {
  activeTab: StatusTab;
  onSelect: (k: StatusTab) => void;
  counts: Record<string, number>;
};

const ChipBar = ({ activeTab, onSelect, counts }: ChipBarProps) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={chipStyles.scroll}
    contentContainerStyle={chipStyles.row}
  >
    {STATUS_TABS.map((tab) => {
      const active = activeTab === tab.key;
      const count = counts[tab.key] ?? 0;
      return (
        <TouchableOpacity
          key={tab.key}
          style={[
            chipStyles.chip,
            active && { backgroundColor: tab.color + '18', borderColor: tab.color },
          ]}
          onPress={() => onSelect(tab.key)}
          activeOpacity={0.75}
        >
          <Ionicons
            name={tab.icon as any}
            size={13}
            color={active ? tab.color : colors.textLight}
          />
          <Text style={[chipStyles.label, active && { color: tab.color }]}>
            {tab.label}
          </Text>
          {count > 0 && (
            <View style={[chipStyles.badge, active && { backgroundColor: tab.color }]}>
              <Text style={[chipStyles.badgeText, active && { color: colors.white }]}>
                {count}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

const chipStyles = StyleSheet.create({
  scroll: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    flexGrow: 0,
    flexShrink: 0,
  },
  row: {
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    gap: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    backgroundColor: colors.backgroundSecondary,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textLight,
  },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
});

type BannerCfg = { icon: string; color: string; bg: string; text: string };

const STATUS_BANNERS: Record<string, BannerCfg> = {
  PENDING_APPROVAL:   { icon: 'time-outline',      color: '#F39C12', bg: '#FEF9E7', text: 'Under review — awaiting listing approval' },
  DELETION_REQUESTED: { icon: 'hourglass-outline', color: '#E67E22', bg: '#FDF2E9', text: 'Deletion request submitted — awaiting admin approval' },
  SOLD:               { icon: 'cash-outline',      color: '#2980B9', bg: '#EBF5FB', text: 'This property has been sold' },
  RENTED:             { icon: 'key-outline',       color: '#8E44AD', bg: '#F5EEF8', text: 'This property is currently rented' },
  INACTIVE:           { icon: 'archive-outline',   color: '#C0392B', bg: '#FDEDEC', text: 'Removed — deletion approved by admin' },
};

const StatusBanner = ({ status }: { status: string }) => {
  const cfg = STATUS_BANNERS[status];
  if (!cfg) return null;
  return (
    <View style={[bannerStyles.wrap, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
      <Text style={[bannerStyles.text, { color: cfg.color }]}>{cfg.text}</Text>
    </View>
  );
};

const bannerStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: spacing.sm,
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  text: { fontSize: 12, fontWeight: '600' as const, flex: 1 },
});

type ListingCardProps = {
  item: PropertyDTO;
  navigation: any;
  onRequestDelete: (p: PropertyDTO) => void;
  onPublish: (p: PropertyDTO) => void;
};

const EDITABLE_STATUSES = new Set(['ACTIVE', 'DRAFT', 'PENDING_APPROVAL']);
const IMAGE_ACCESSIBLE_STATUSES = new Set(['ACTIVE', 'DRAFT', 'PENDING_APPROVAL']);

const ListingCard = ({ item, navigation, onRequestDelete, onPublish }: ListingCardProps) => {
  const statusColor = STATUS_COLORS[item.status] ?? colors.textSecondary;
  const statusLabel = STATUS_TABS.find(t => t.key === item.status)?.label ?? item.status;
  const showActions = EDITABLE_STATUSES.has(item.status);
  const showImageBtn = IMAGE_ACCESSIBLE_STATUSES.has(item.status);
  const showBanner = !!STATUS_BANNERS[item.status];

  return (
    <TouchableOpacity
      style={[
        cardStyles.card,
        item.status === 'INACTIVE' && cardStyles.cardInactive,
        item.status === 'DELETION_REQUESTED' && cardStyles.cardDeletion,
      ]}
      onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
      activeOpacity={0.88}
    >

      <View style={cardStyles.imageWrap}>
        <OptimizedImage uri={item.primaryImageUrl ?? ''} style={cardStyles.image} />

        <View style={[cardStyles.statusPill, { backgroundColor: statusColor }]}>
          <Text style={cardStyles.statusPillText}>{statusLabel}</Text>
        </View>

        {item.status === 'INACTIVE' && <View style={cardStyles.inactiveOverlay} />}
      </View>

      <View style={cardStyles.body}>
        <Text style={[cardStyles.title, item.status === 'INACTIVE' && cardStyles.titleDim]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={cardStyles.price}>{formatPrice(item.price)}</Text>
        <Text style={cardStyles.location} numberOfLines={1}>
          {item.locality}, {item.city}
        </Text>

        <View style={cardStyles.meta}>
          {item.bedrooms ? (
            <View style={cardStyles.metaItem}>
              <Ionicons name="bed-outline" size={13} color={colors.textSecondary} />
              <Text style={cardStyles.metaText}>{item.bedrooms} BHK</Text>
            </View>
          ) : null}
          <View style={cardStyles.metaItem}>
            <Ionicons name="eye-outline" size={13} color={colors.textSecondary} />
            <Text style={cardStyles.metaText}>{item.viewCount ?? 0} views</Text>
          </View>
        </View>

        {showBanner && <StatusBanner status={item.status} />}

        {(showActions || showImageBtn) && (
          <View style={cardStyles.actions}>
            {item.status === 'DRAFT' && showActions && (
              <TouchableOpacity
                style={[cardStyles.actionBtn, cardStyles.publishBtn]}
                onPress={() => onPublish(item)}
              >
                <Ionicons name="send-outline" size={13} color={colors.white} />
                <Text style={cardStyles.publishBtnText}>Publish</Text>
              </TouchableOpacity>
            )}
            <View style={cardStyles.iconActions}>
              {showImageBtn && (
                <TouchableOpacity
                  style={cardStyles.iconBtn}
                  onPress={() => navigation.navigate('PropertyImages', { propertyId: item.id, propertyTitle: item.title })}
                  accessibilityLabel="Manage images"
                >
                  <Ionicons name="images-outline" size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
              {showActions && (
                <>
                  <TouchableOpacity
                    style={cardStyles.iconBtn}
                    onPress={() => navigation.navigate('EditListing', { propertyId: item.id })}
                    accessibilityLabel="Edit listing"
                  >
                    <Ionicons name="create-outline" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[cardStyles.iconBtn, cardStyles.deleteIconBtn]}
                    onPress={() => onRequestDelete(item)}
                    accessibilityLabel="Request deletion"
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const cardStyles = StyleSheet.create({
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
  cardInactive: { borderColor: '#C0392B', borderWidth: 1.5, opacity: 0.85 },
  cardDeletion: { borderColor: '#E67E22', borderWidth: 1.5 },
  imageWrap: { position: 'relative', height: 150 },
  image: { width: '100%', height: '100%' },
  inactiveOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  statusPill: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusPillText: { color: '#fff', fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.3 },
  body: { padding: spacing.md },
  title: { fontSize: 15, fontWeight: '600' as const, color: colors.text },
  titleDim: { color: colors.textSecondary },
  price: { fontSize: 17, fontWeight: '800' as const, color: colors.primary, marginTop: 2 },
  location: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  meta: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.textSecondary },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  iconActions: { flexDirection: 'row', gap: 8, marginLeft: 'auto' as any },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
  },
  publishBtn: { backgroundColor: colors.primary },
  publishBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' as const },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    backgroundColor: colors.backgroundSecondary,
  },
  deleteIconBtn: { borderColor: colors.error, backgroundColor: colors.errorSurface ?? '#FDECEA' },
});

const MyListingsScreen = ({ navigation, route }: any) => {
  const [activeTab, setActiveTab] = useState<StatusTab>(route?.params?.initialTab ?? 'ALL');

  useEffect(() => {
    if (route?.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route?.params?.initialTab]);
  const { data, isLoading, isError, error, refetch, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMyListingsInfiniteQuery();
  const allListings = data?.items ?? [];
  const requestDeletion = useRequestDeletionMutation();
  const publishListing = usePublishPropertyMutation();

  const errorMessage = isError ? (error as any)?.response?.data?.message ?? 'Could not load your listings.' : null;

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: allListings.length };
    for (const p of allListings) {
      c[p.status] = (c[p.status] ?? 0) + 1;
    }
    return c;
  }, [allListings]);

  const filtered = useMemo(
    () => activeTab === 'ALL' ? allListings : allListings.filter(p => p.status === activeTab),
    [allListings, activeTab],
  );

  const activeTabCfg = STATUS_TABS.find(t => t.key === activeTab) ?? STATUS_TABS[0];

  const handleRequestDelete = (property: PropertyDTO) => {
    Alert.alert(
      'Request Deletion',
      `Submit a deletion request for "${property.title}"?\n\nAn admin will review and either approve (property becomes inactive) or reject it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Request',
          style: 'destructive',
          onPress: () =>
            requestDeletion.mutate(property.id, {
              onSuccess: () => Alert.alert('Request Submitted', 'Awaiting admin approval. You can track it in the "Del. Req." tab.'),
              onError: (e: any) => Alert.alert('Error', e?.response?.data?.message ?? 'Failed to submit deletion request.'),
            }),
        },
      ]
    );
  };

  const handlePublish = (property: PropertyDTO) => {
    publishListing.mutate(property.id, {
      onSuccess: () => Alert.alert('Submitted for Review', 'Your listing has been submitted for admin approval. You can track it in the "Pending" tab.'),
      onError: (e: any) => Alert.alert('Error', e?.response?.data?.message ?? 'Failed to submit listing.'),
    });
  };

  return (
    <AsyncBoundary loading={isLoading} error={errorMessage} onRetry={() => refetch()}>
      <View style={styles.container}>

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {navigation.canGoBack() && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
            <View>
              <Text style={styles.headerTitle}>My Listings</Text>
              <Text style={styles.headerSub}>{allListings.length} total properties</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate('Create')}
          >
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.createBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        <ChipBar
          activeTab={activeTab}
          onSelect={setActiveTab}
          counts={counts}
        />

        <FlatList
          style={styles.listFlex}
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <ListingCard
              item={item}
              navigation={navigation}
              onRequestDelete={handleRequestDelete}
              onPublish={handlePublish}
            />
          )}
          contentContainerStyle={styles.list}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage
              ? <ActivityIndicator style={styles.loadMoreSpinner} color={colors.primary} />
              : null
          }
          refreshControl={
            <RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => refetch()} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name={activeTab === 'INACTIVE' ? 'archive-outline' : 'document-text-outline'}
                size={52}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyTitle}>
                {activeTab === 'ALL' ? 'No listings yet' :
                 activeTab === 'INACTIVE' ? 'No removed properties' :
                 `No ${activeTabCfg.label.toLowerCase()} listings`}
              </Text>
              {activeTab === 'INACTIVE' && (
                <Text style={styles.emptySub}>
                  Properties removed after admin approval will appear here as history.
                </Text>
              )}
              {activeTab === 'ALL' && (
                <TouchableOpacity
                  style={styles.emptyCreateBtn}
                  onPress={() => navigation.navigate('Create')}
                >
                  <Text style={styles.emptyCreateText}>Create Your First Listing</Text>
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
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  headerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  createBtnText: { color: colors.white, fontWeight: '700' as const, fontSize: 14 },

  listFlex: { flex: 1 },
  list: { padding: spacing.md, gap: spacing.md, paddingBottom: 32 },
  loadMoreSpinner: { paddingVertical: spacing.lg },

  empty: { alignItems: 'center', padding: spacing.xl, gap: spacing.md, paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600' as const, color: colors.textSecondary, textAlign: 'center' },
  emptySub: { fontSize: 13, color: colors.textLight, textAlign: 'center', lineHeight: 20 },
  emptyCreateBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  emptyCreateText: { color: colors.white, fontWeight: '700' as const, fontSize: 15 },
});

export default MyListingsScreen;
