import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RealtorService } from '@/api/services/realtor.service';
import { queryKeys, STALE_TIME } from '@/api/queryClient';
import type { ConnectRealtorRequest, RealtorStatsDTO } from '@/api/types/property.types';

/** Realtor's KPI stats — used by the Realtor dashboard + PerformanceScreen. */
export const useRealtorStatsQuery = () =>
  useQuery({
    queryKey: queryKeys.realtorStats,
    queryFn: async () => {
      const res = await RealtorService.getStats();
      return res.data.data as RealtorStatsDTO;
    },
    staleTime: STALE_TIME.MEDIUM,
  });

export const useRealtorProfileQuery = (realtorId: number | null | undefined) =>
  useQuery({
    queryKey: realtorId != null ? queryKeys.realtorProfile(realtorId) : ['realtor', 'profile', 'none'],
    queryFn: async () => {
      const res = await RealtorService.getProfile(realtorId as number);
      return res.data.data;
    },
    enabled: realtorId != null,
    staleTime: 0,         // always considered stale — refetch on every mount so errors recover fast
    retry: false,         // axiosClient already retries once internally; TQ retry adds delay
    gcTime: 60_000,       // keep in cache for 1 min so PropertyDetail → RealtorProfile navigation is instant
  });

export const useConnectRealtorMutation = (realtorId: number | null | undefined) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ConnectRealtorRequest) => RealtorService.connect(realtorId as number, data),
    onSuccess: () => {
      if (realtorId != null) {
        qc.invalidateQueries({ queryKey: queryKeys.realtorProfile(realtorId) });
      }
    },
  });
};
