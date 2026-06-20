import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PropertyService } from '@/api/services/property.service';
import { queryKeys, STALE_TIME } from '@/api/queryClient';
import type { ContactRevealResponse, PropertyDTO } from '@/api/types/property.types';

/**
 * Infinite-scroll property search. The query key includes the filters so two
 * different searches don't share a cache. Pass `enabled: false` to defer the
 * first request until the user actually hits Search.
 */
export const useSearchInfiniteQuery = (
  filters: Record<string, any>,
  options?: { enabled?: boolean; pageSize?: number }
) => {
  const pageSize = options?.pageSize ?? 20;
  return useInfiniteQuery({
    queryKey: ['property', 'search', filters, pageSize] as const,
    enabled: options?.enabled ?? true,
    staleTime: 0,        // search results are always re-fetched — never serve stale cache
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const res = await PropertyService.search({
        ...filters,
        page: pageParam as number,
        size: pageSize,
      });
      return res.data.data;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.last) return undefined;
      return (lastPage.pageNumber ?? 0) + 1;
    },
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      items: data.pages.flatMap((p) => p?.content ?? []) as PropertyDTO[],
      hasMore: data.pages[data.pages.length - 1] ? !data.pages[data.pages.length - 1]!.last : false,
    }),
  });
};

/** Property types for the search filter (Apartment, Villa, …). Near-static reference data. */
export const usePropertyTypesQuery = () =>
  useQuery({
    queryKey: ['property', 'types'] as const,
    queryFn: async () => {
      const res = await PropertyService.getPropertyTypes();
      return res.data.data ?? [];
    },
    staleTime: STALE_TIME.STATIC,
  });

export const usePropertyQuery = (id: number | null | undefined) =>
  useQuery({
    queryKey: id != null ? queryKeys.property(id) : ['property', 'none'],
    queryFn: async () => {
      const res = await PropertyService.getById(id as number);
      return res.data.data;
    },
    enabled: id != null,
    staleTime: STALE_TIME.MEDIUM,
  });

export const useMyListingsQuery = (page = 0, size = 50) =>
  useQuery({
    queryKey: [...queryKeys.myListings, page, size] as const,
    queryFn: async () => {
      const res = await PropertyService.getMyListings(page, size);
      return res.data.data?.content ?? ([] as PropertyDTO[]);
    },
    staleTime: STALE_TIME.MEDIUM,
  });

export const useMyListingsInfiniteQuery = (pageSize = 20) =>
  useInfiniteQuery({
    queryKey: [...queryKeys.myListings, 'infinite', pageSize] as const,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const res = await PropertyService.getMyListings(pageParam as number, pageSize);
      return res.data.data;
    },
    getNextPageParam: (lastPage) =>
      !lastPage || lastPage.last ? undefined : (lastPage.pageNumber ?? 0) + 1,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      items: data.pages.flatMap((p) => p?.content ?? []) as PropertyDTO[],
      hasMore: !(data.pages[data.pages.length - 1]?.last ?? true),
    }),
    staleTime: STALE_TIME.MEDIUM,
  });

export const useRequestDeletionMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => PropertyService.requestDeletion(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myListings });
    },
  });
};

export const usePublishPropertyMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => PropertyService.publishProperty(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myListings });
    },
  });
};

export const useRevealContactMutation = () =>
  useMutation<ContactRevealResponse, Error, number>({
    mutationFn: async (propertyId: number) => {
      const res = await PropertyService.revealContact(propertyId);
      return res.data.data as ContactRevealResponse;
    },
  });
