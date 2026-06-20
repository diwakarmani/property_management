import React from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FavoriteService } from '@/api/services/favorite.service';
import { queryKeys, STALE_TIME } from '@/api/queryClient';
import type { PropertyCompareDTO, PropertyDTO } from '@/api/types/property.types';

const patchIds = (
  qc: ReturnType<typeof useQueryClient>,
  updater: (prev: number[]) => number[],
) => {
  const prev = qc.getQueryData<number[]>(queryKeys.favoriteIds);
  if (prev !== undefined) qc.setQueryData<number[]>(queryKeys.favoriteIds, updater(prev));
};

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

export const useFavoritesInfiniteQuery = (pageSize = 20) => {
  const qc = useQueryClient();
  return useInfiniteQuery({
    queryKey: [...queryKeys.favorites, 'infinite', pageSize] as const,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const res = await FavoriteService.getFavorites(pageParam as number, pageSize);
      const items = res.data.data?.content ?? ([] as PropertyDTO[]);
      items.forEach(item => qc.setQueryData(queryKeys.favoritesCheck(item.id), true));
      return res.data.data;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      const { pageNumber = 0, totalPages = 1 } = lastPage;
      return pageNumber + 1 >= totalPages ? undefined : pageNumber + 1;
    },
    select: (data) => {
      const last = data.pages[data.pages.length - 1];
      const isLast = !last || (last.pageNumber ?? 0) + 1 >= (last.totalPages ?? 1);
      return {
        pages: data.pages,
        pageParams: data.pageParams,
        items: data.pages.flatMap((p) => p?.content ?? []) as PropertyDTO[],
        hasMore: !isLast,
      };
    },
    staleTime: STALE_TIME.MEDIUM,
  });
};

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

  const ids = React.useMemo(() => new Set(data), [data]);
  return { ids, isLoading };
};

export const useFavoriteCheckQuery = (propertyId: number, enabled = true) =>
  useQuery({
    queryKey: queryKeys.favoritesCheck(propertyId),
    queryFn: async () => {
      const res = await FavoriteService.checkFavorite(propertyId);
      return res.data.data ?? false;
    },
    staleTime: STALE_TIME.MEDIUM,
    enabled,
    retry: false,
  });

export const useCompareFavoritesQuery = (ids: number[]) =>
  useQuery({
    queryKey: queryKeys.compareProperties(ids),
    queryFn: async (): Promise<PropertyCompareDTO[]> => {
      const res = await FavoriteService.compareProperties(ids);
      return res.data.data ?? [];
    },
    enabled: ids.length >= 2 && ids.length <= 3,
    staleTime: STALE_TIME.MEDIUM,
    retry: false,
  });

export const useAddFavoriteMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (propertyId: number) => FavoriteService.addFavorite(propertyId),

    onMutate: async (propertyId) => {

      await qc.cancelQueries({ queryKey: queryKeys.favorites });
      await qc.cancelQueries({ queryKey: queryKeys.favoriteIds });

      qc.setQueryData(queryKeys.favoritesCheck(propertyId), true);

      const previousIds = qc.getQueryData<number[]>(queryKeys.favoriteIds);
      patchIds(qc, prev => (prev.includes(propertyId) ? prev : [propertyId, ...prev]));

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
