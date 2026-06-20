import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { DiscoveryService } from '@/api/services/discovery.service';
import { queryKeys, STALE_TIME } from '@/api/queryClient';
import type { HomeDiscoveryResponse, PropertyCardDTO, ViewMoreRequest } from '@/api/types/discovery.types';

export const useCityListingCountQuery = (city?: string) =>
  useQuery({
    queryKey: queryKeys.listingCount(city ?? ''),
    queryFn: async () => {
      const res = await DiscoveryService.getCityListingCount(city!);
      return res.data.data?.totalElements ?? 0;
    },
    enabled: !!city,
    staleTime: STALE_TIME.MEDIUM,
    retry: false,
  });

export const useHomeFeedQuery = (city?: string, lat?: number, lng?: number) =>
  useQuery({
    queryKey: ['discovery', 'home', city, lat, lng] as const,
    queryFn: async () => {
      const res = await DiscoveryService.getHomeFeed(city, lat, lng);
      return res.data.data as HomeDiscoveryResponse;
    },
    enabled: !!city || (lat != null && lng != null),
    staleTime: STALE_TIME.MEDIUM,
  });

export const useViewMoreInfiniteQuery = (
  params: Omit<ViewMoreRequest, 'page'>
) =>
  useInfiniteQuery({
    queryKey: ['discovery', 'view-more', params.category, params.city, params.lat, params.lng] as const,
    initialPageParam: 0,
    staleTime: STALE_TIME.MEDIUM,
    queryFn: async ({ pageParam }) => {
      const res = await DiscoveryService.viewMore({ ...params, page: pageParam as number });
      return res.data.data;
    },
    getNextPageParam: (lastPage) => {

      if (!lastPage || lastPage.last) return undefined;
      return (lastPage.pageNumber ?? 0) + 1;
    },
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,

      items: data.pages.flatMap((p) => p?.content ?? []) as PropertyCardDTO[],
      hasMore: data.pages[data.pages.length - 1] ? !data.pages[data.pages.length - 1]!.last : false,
    }),
  });
