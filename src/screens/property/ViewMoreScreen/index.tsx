import React from 'react';
import { FlatList, StyleSheet, ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useViewMoreInfiniteQuery } from '@/api/hooks/useDiscovery';
import { useFavoriteIdsSet, useAddFavoriteMutation, useRemoveFavoriteMutation } from '@/api/hooks/useFavorites';
import PropertyCard from '@/components/property/PropertyCard';
import AsyncBoundary from '@/components/common/AsyncBoundary';
import { colors, typography, spacing } from '@/theme';
import type { RootState } from '@/store';
import { isBuyerExperience } from '@/utils/rbac/permissions';

const CATEGORY_LABELS: Record<string, string> = {
  popular: 'Popular Properties',
  recommended: 'Recommended for You',
  nearest: 'Near You',
};

const ViewMoreScreen = ({ navigation }: any) => {
  const route = useRoute();
  const { category, city } = route.params as any;
  const { coordinates } = useSelector((state: RootState) => state.location);
  const isBuyer = useSelector((state: RootState) =>
    isBuyerExperience(state.auth.user?.roles, state.auth.activeRole)
  );

  const { ids: favoriteIds, isLoading: idsLoading } = useFavoriteIdsSet(isBuyer);
  const addFavorite = useAddFavoriteMutation();
  const removeFavorite = useRemoveFavoriteMutation();

  const toggleFavorite = (id: number) => {
    if (idsLoading) return;
    if (favoriteIds.has(id)) removeFavorite.mutate(id);
    else addFavorite.mutate(id);
  };

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useViewMoreInfiniteQuery({
    category,
    city: city || undefined,
    lat: coordinates.latitude || undefined,
    lng: coordinates.longitude || undefined,
    size: 20,
  });

  const items = data?.items ?? [];
  const errorMessage = isError ? (error as any)?.response?.data?.message ?? 'Could not load properties.' : null;
  const title = CATEGORY_LABELS[category] ?? 'Properties';

  return (
    <View style={styles.root}>
      <AsyncBoundary loading={isLoading} error={errorMessage} onRetry={() => refetch()}>
        <FlatList
          data={items}
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
              style={styles.card}
              isFavorited={isBuyer ? favoriteIds.has(item.id) : undefined}
              onFavoriteToggle={isBuyer ? () => toggleFavorite(item.id) : undefined}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={styles.backRow}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                  <Ionicons name="chevron-back" size={18} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.pageTitle} numberOfLines={1}>{title}</Text>
                {items.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{items.length}</Text>
                  </View>
                )}
              </View>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.footerText}>Loading more…</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="home-outline" size={64} color={colors.border} />
              <Text style={styles.emptyTitle}>No properties found</Text>
              <Text style={styles.emptySubtext}>Check back later for new listings</Text>
            </View>
          }
        />
      </AsyncBoundary>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  listHeader: { marginBottom: spacing.sm },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  countBadge: {
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  countText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  row: { justifyContent: 'space-between', marginBottom: spacing.md },
  card: { width: '48%' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  footerText: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});

export default ViewMoreScreen;
