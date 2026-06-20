import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import type { PropertyDTO } from '@/api/types/property.types';
import { useFavoritesInfiniteQuery, useRemoveFavoriteMutation } from '@/api/hooks/useFavorites';
import OptimizedImage from '@/components/common/OptimizedImage';
import AsyncBoundary from '@/components/common/AsyncBoundary';
import { LinearGradient } from 'expo-linear-gradient';
import { formatPrice } from '@/utils/helpers/formatPrice';

const MAX_COMPARE = 3;

const FavoritesScreen = () => {
  const navigation = useNavigation<any>();
  const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFavoritesInfiniteQuery();
  const favorites = data?.items ?? [];
  const removeFavorite = useRemoveFavoriteMutation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleRemove = (property: PropertyDTO) => {
    Alert.alert(
      'Remove from Saved',
      `Remove "${property.title}" from your saved properties?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFavorite.mutate(property.id) },
      ]
    );
  };

  const toggleCompareMode = () => {
    setCompareMode(prev => !prev);
    setSelectedIds(new Set());
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_COMPARE) {
        next.add(id);
      }
      return next;
    });
  };

  const handleCompare = () => {
    navigation.navigate('CompareProperties', { ids: Array.from(selectedIds) });
  };

  const errorMessage = isError
    ? (error as any)?.response?.data?.message ?? 'Could not load saved properties.'
    : null;

  const renderItem = ({ item }: { item: PropertyDTO }) => {
    const isSelected = selectedIds.has(item.id);
    const isDisabled = compareMode && !isSelected && selectedIds.size >= MAX_COMPARE;

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected, isDisabled && styles.cardDisabled]}
        onPress={() => {
          if (compareMode) {
            if (!isDisabled) toggleSelection(item.id);
          } else {
            navigation.navigate('PropertyDetail', { id: item.id });
          }
        }}
        activeOpacity={0.92}
      >
        {/* Image */}
        <View style={styles.imageWrap}>
          <OptimizedImage uri={item.primaryImageUrl ?? ''} style={styles.image} />
          <LinearGradient
            colors={['transparent', 'rgba(26,26,46,0.7)']}
            style={styles.imageGradient}
          />
          {item.listingType && (
            <View style={[
              styles.typeBadge,
              item.listingType === 'RENT' ? styles.rentBadge : styles.saleBadge,
            ]}>
              <Text style={styles.typeBadgeText}>{item.listingType}</Text>
            </View>
          )}
          <View style={styles.priceOnImage}>
            <Text style={styles.priceOnImageText}>{formatPrice(item.price)}</Text>
            {item.listingType === 'RENT' && <Text style={styles.pricePerMonth}>/mo</Text>}
          </View>

          {/* Compare selection overlay */}
          {compareMode && (
            <View style={[styles.selectCircle, isSelected && styles.selectCircleActive]}>
              {isSelected && <Ionicons name="checkmark" size={16} color={colors.white} />}
            </View>
          )}
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={styles.cardInfo}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={12} color={colors.primary} />
                <Text style={styles.location} numberOfLines={1}>
                  {item.locality}, {item.city}
                </Text>
              </View>
            </View>

            {!compareMode && (
              <TouchableOpacity
                style={styles.heartBtn}
                onPress={() => handleRemove(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={styles.heartBtnInner}>
                  <Ionicons name="heart" size={18} color={colors.error} />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {(item.bedrooms || item.bathrooms || item.carpetArea) ? (
            <View style={styles.meta}>
              {item.bedrooms ? (
                <View style={styles.metaItem}>
                  <Ionicons name="bed-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{item.bedrooms} BHK</Text>
                </View>
              ) : null}
              {item.bathrooms ? (
                <View style={styles.metaItem}>
                  <Ionicons name="water-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{item.bathrooms} Bath</Text>
                </View>
              ) : null}
              {item.carpetArea ? (
                <View style={styles.metaItem}>
                  <Ionicons name="resize-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{item.carpetArea} sqft</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Ionicons name={compareMode ? 'git-compare-outline' : 'heart'} size={18} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{compareMode ? 'Select to Compare' : 'Saved Properties'}</Text>
          {!isLoading && (
            <Text style={styles.headerSubtitle}>
              {compareMode
                ? `${selectedIds.size} of ${MAX_COMPARE} selected`
                : favorites.length > 0
                  ? `${favorites.length} propert${favorites.length === 1 ? 'y' : 'ies'} saved`
                  : 'Start saving properties you like'}
            </Text>
          )}
        </View>

        {/* Compare toggle — only show when ≥2 favorites */}
        {!compareMode && favorites.length >= 2 && (
          <TouchableOpacity style={styles.compareToggleBtn} onPress={toggleCompareMode} activeOpacity={0.8}>
            <Ionicons name="git-compare-outline" size={15} color={colors.primary} />
            <Text style={styles.compareToggleText}>Compare</Text>
          </TouchableOpacity>
        )}
        {compareMode && (
          <TouchableOpacity onPress={toggleCompareMode} activeOpacity={0.8}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Compare action bar — appears when ≥2 selected */}
      {compareMode && (
        <View style={styles.compareBar}>
          <View style={styles.compareBarDots}>
            {Array.from({ length: MAX_COMPARE }).map((_, i) => {
              const filled = i < selectedIds.size;
              return (
                <View key={i} style={[styles.dot, filled && styles.dotFilled]} />
              );
            })}
          </View>
          <Text style={styles.compareBarHint}>
            {selectedIds.size < 2
              ? `Select ${2 - selectedIds.size} more to compare`
              : `${selectedIds.size} selected — ready to compare`}
          </Text>
          <TouchableOpacity
            style={[styles.compareBtn, selectedIds.size < 2 && styles.compareBtnDisabled]}
            onPress={handleCompare}
            disabled={selectedIds.size < 2}
            activeOpacity={0.85}
          >
            <Ionicons name="git-compare-outline" size={15} color={colors.white} />
            <Text style={styles.compareBtnText}>Compare ({selectedIds.size})</Text>
          </TouchableOpacity>
        </View>
      )}

      <AsyncBoundary loading={isLoading} error={errorMessage} onRetry={() => refetch()}>
        <FlatList
          style={styles.container}
          data={favorites}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={styles.loadMoreSpinner} color={colors.primary} /> : null}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="heart-outline" size={40} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No saved properties</Text>
              <Text style={styles.emptySubtext}>
                Tap the heart icon on any property listing to save it here for later.
              </Text>
            </View>
          }
        />
      </AsyncBoundary>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },

  compareToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  compareToggleText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  cancelText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    paddingHorizontal: 4,
  },

  compareBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  compareBarDots: { flexDirection: 'row', gap: 5 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.borderLight,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  dotFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
  compareBarHint: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  compareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  compareBtnDisabled: { backgroundColor: colors.textLight },
  compareBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },

  list: { padding: spacing.md, gap: spacing.md },
  loadMoreSpinner: { paddingVertical: spacing.lg },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    shadowOpacity: 0.2,
  },
  cardDisabled: { opacity: 0.45 },

  imageWrap: { position: 'relative', height: 180 },
  image: { width: '100%', height: '100%' },
  imageGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
  },
  typeBadge: {
    position: 'absolute', top: spacing.sm, left: spacing.sm,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  saleBadge: { backgroundColor: colors.primary },
  rentBadge: { backgroundColor: '#2980B9' },
  typeBadgeText: { color: colors.white, fontSize: 9, fontWeight: typography.fontWeight.bold, letterSpacing: 0.5 },
  priceOnImage: {
    position: 'absolute', bottom: spacing.sm, left: spacing.sm,
    flexDirection: 'row', alignItems: 'baseline', gap: 2,
  },
  priceOnImageText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.extrabold,
    color: colors.white,
  },
  pricePerMonth: { fontSize: typography.fontSize.xs, color: 'rgba(255,255,255,0.85)' },

  selectCircle: {
    position: 'absolute', top: spacing.sm, right: spacing.sm,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 2, borderColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  selectCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },

  cardBody: { padding: spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1, marginRight: spacing.sm },
  title: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.text },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  location: { fontSize: typography.fontSize.xs, color: colors.textSecondary, flex: 1 },
  heartBtn: { padding: 2 },
  heartBtnInner: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: colors.errorSurface,
    alignItems: 'center', justifyContent: 'center',
  },
  meta: {
    flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm,
    paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: typography.fontSize.xs, color: colors.textSecondary },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: spacing.xl, gap: spacing.md },
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: colors.primarySurface,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs,
  },
  emptyTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text },
  emptySubtext: { fontSize: typography.fontSize.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});

export default FavoritesScreen;
