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
    staleTime: STALE_TIME.MEDIUM,
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
