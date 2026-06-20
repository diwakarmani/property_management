import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RatingService } from '@/api/services/rating.service';
import { queryKeys, STALE_TIME } from '@/api/queryClient';
import type { CreateRatingRequest, RatingDTO } from '@/api/types/rating.types';

export const useMyRatingQuery = (
  realtorId: number | null | undefined,
  propertyId: number | null | undefined,
) =>
  useQuery({
    queryKey:
      realtorId != null && propertyId != null
        ? queryKeys.myRating(realtorId, propertyId)
        : ['rating', 'my', 'none'],
    queryFn: async () => {
      const res = await RatingService.getMyRating(realtorId as number, propertyId as number);
      return (res.data.data ?? null) as RatingDTO | null;
    },
    enabled: realtorId != null && propertyId != null,
    staleTime: 0,
    retry: false,
  });

export const useRatingsInfiniteQuery = (realtorId: number | null | undefined) =>
  useInfiniteQuery({
    queryKey: realtorId != null ? queryKeys.realtorRatings(realtorId) : ['rating', 'list', 'none'],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const res = await RatingService.getRatings(realtorId as number, pageParam as number, 10);
      return res.data.data;
    },
    getNextPageParam: (last) => (!last || last.last ? undefined : (last.pageNumber ?? 0) + 1),
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      items: data.pages.flatMap((p) => p?.content ?? []) as RatingDTO[],
      hasMore: !(data.pages[data.pages.length - 1]?.last ?? true),
      totalElements: data.pages[0]?.totalElements ?? 0,
    }),
    enabled: realtorId != null,
    staleTime: STALE_TIME.MEDIUM,
  });

export const useSubmitRatingMutation = (realtorId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRatingRequest) => RatingService.submit(realtorId, data),
    onSuccess: () => {

      qc.invalidateQueries({ queryKey: ['realtor', 'ratings', realtorId] });
      qc.invalidateQueries({ queryKey: queryKeys.realtorProfile(realtorId) });
    },
  });
};
