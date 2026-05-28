import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FavoriteService } from '@/api/services/favorite.service';
import { queryKeys, STALE_TIME } from '@/api/queryClient';
import type { PropertyDTO } from '@/api/types/property.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Update the flat IDs list in cache with a new array. No-op if not yet loaded. */
const patchIds = (
  qc: ReturnType<typeof useQueryClient>,
  updater: (prev: number[]) => number[],
) => {
  const prev = qc.getQueryData<number[]>(queryKeys.favoriteIds);
  if (prev !== undefined) qc.setQueryData<number[]>(queryKeys.favoriteIds, updater(prev));
};

/** Update every cached favorites page (PropertyDTO[]). No-op on pages not yet loaded. */
const patchLists = (
  qc: ReturnType<typeof useQueryClient>,
  updater: (prev: PropertyDTO[]) => PropertyDTO[],
) => {
  qc.getQueriesData<PropertyDTO[]>({ queryKey: queryKeys.favorites }).forEach(([key, data]) => {
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
      qc.setQueryData<PropertyDTO[]>(key, updater(data as PropertyDTO[]));
    }
  });
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Paged favorites list for FavoritesScreen.
 * Seeds favoritesCheck(id)=true for every returned item so PropertyDetails
 * can read the heart state instantly from cache without a separate API call.
 */
export const useFavoritesQuery = (page = 0, size = 50) => {
  const qc = useQueryClient();
  return useQuery({
    queryKey: [...queryKeys.favorites, page, size] as const,
    queryFn: async () => {
      const res = await FavoriteService.getFavorites(page, size);
      const items = res.data.data?.content ?? ([] as PropertyDTO[]);
      items.forEach(item => qc.setQueryData(queryKeys.favoritesCheck(item.id), true));
      return items;
    },
    staleTime: STALE_TIME.MEDIUM,
    retry: false,
  });
};

/**
 * Flat Set of all favorited property IDs for card screens (HomeScreen, Search, ViewMore).
 * One API call (up to 200 items), cached per STALE_TIME.MEDIUM.
 * Also seeds favoritesCheck cache so PropertyDetails has instant heart state.
 * Non-buyer users get an empty Set (API 403 is swallowed via retry:false).
 */
export const useFavoriteIdsSet = (enabled = true) => {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: queryKeys.favoriteIds,
    queryFn: async () => {
      const res = await FavoriteService.getFavorites(0, 200);
      const items = res.data.data?.content ?? ([] as PropertyDTO[]);
      items.forEach(item => qc.setQueryData(queryKeys.favoritesCheck(item.id), true));
      return items.map(item => item.id);
    },
    staleTime: STALE_TIME.MEDIUM,
    enabled,
    retry: false,
  });
  // ids is an empty Set while loading — callers should check isLoading before
  // deciding add vs remove to avoid firing the wrong mutation during initial fetch.
  const ids = React.useMemo(() => new Set(data), [data]);
  return { ids, isLoading };
};

/** Whether a single property is favorited — seeded by useFavoritesQuery / useFavoriteIdsSet. */
export const useFavoriteCheckQuery = (propertyId: number) =>
  useQuery({
    queryKey: queryKeys.favoritesCheck(propertyId),
    queryFn: async () => {
      const res = await FavoriteService.checkFavorite(propertyId);
      return res.data.data ?? false;
    },
    staleTime: STALE_TIME.MEDIUM,
    retry: false,
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Add to favorites.
 * Optimistic: flips heart + prepends PropertyDTO to list cache + adds ID to
 * flat IDs set — all before the network round-trip.
 */
export const useAddFavoriteMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (propertyId: number) => FavoriteService.addFavorite(propertyId),

    onMutate: async (propertyId) => {
      // Cancel any in-flight refetches before applying optimistic updates to
      // prevent a stale response from overwriting the optimistic state.
      await qc.cancelQueries({ queryKey: queryKeys.favorites });
      await qc.cancelQueries({ queryKey: queryKeys.favoriteIds });

      // Flip the per-property check immediately.
      qc.setQueryData(queryKeys.favoritesCheck(propertyId), true);

      // Add to flat IDs cache (drives card hearts across all screens).
      const previousIds = qc.getQueryData<number[]>(queryKeys.favoriteIds);
      patchIds(qc, prev => (prev.includes(propertyId) ? prev : [propertyId, ...prev]));

      // Prepend full PropertyDTO to list cache if it's already in the property cache.
      const previousLists = qc.getQueriesData<PropertyDTO[]>({ queryKey: queryKeys.favorites });
      const property = qc.getQueryData<PropertyDTO>(queryKeys.property(propertyId));
      if (property) {
        patchLists(qc, prev => (prev.find(p => p.id === propertyId) ? prev : [property, ...prev]));
      }

      return { previousLists, previousIds };
    },

    onError: (_err, propertyId, context) => {
      qc.setQueryData(queryKeys.favoritesCheck(propertyId), false);
      context?.previousLists.forEach(([key, data]) => qc.setQueryData(key, data));
      if (context?.previousIds !== undefined)
        qc.setQueryData(queryKeys.favoriteIds, context.previousIds);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.favorites });
      qc.invalidateQueries({ queryKey: queryKeys.favoriteIds });
    },
  });
};

/**
 * Remove from favorites.
 * Optimistic: flips heart + removes PropertyDTO from list cache + removes ID
 * from flat IDs set — all before the network round-trip. Full rollback on error.
 */
export const useRemoveFavoriteMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (propertyId: number) => FavoriteService.removeFavorite(propertyId),

    onMutate: async (propertyId) => {
      await qc.cancelQueries({ queryKey: queryKeys.favorites });
      await qc.cancelQueries({ queryKey: queryKeys.favoriteIds });
      const previousLists = qc.getQueriesData<PropertyDTO[]>({ queryKey: queryKeys.favorites });
      const previousCheck = qc.getQueryData<boolean>(queryKeys.favoritesCheck(propertyId));
      const previousIds = qc.getQueryData<number[]>(queryKeys.favoriteIds);

      patchLists(qc, prev => prev.filter(p => p.id !== propertyId));
      qc.setQueryData(queryKeys.favoritesCheck(propertyId), false);
      patchIds(qc, prev => prev.filter(id => id !== propertyId));

      return { previousLists, previousCheck, previousIds };
    },

    onError: (_err, propertyId, context) => {
      context?.previousLists.forEach(([key, data]) => qc.setQueryData(key, data));
      qc.setQueryData(queryKeys.favoritesCheck(propertyId), context?.previousCheck ?? true);
      if (context?.previousIds !== undefined)
        qc.setQueryData(queryKeys.favoriteIds, context.previousIds);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.favorites });
      qc.invalidateQueries({ queryKey: queryKeys.favoriteIds });
    },
  });
};
