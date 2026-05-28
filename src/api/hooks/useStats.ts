import { useQuery } from '@tanstack/react-query';
import { RealtorService } from '@/api/services/realtor.service';
import { GroupService } from '@/api/services/group.service';
import { queryKeys, STALE_TIME } from '@/api/queryClient';
import type { RealtorStatsDTO } from '@/api/types/property.types';
import type { GroupDashboardStatsDTO } from '@/api/types/group.types';

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

/** Group admin dashboard stats. */
export const useGroupStatsQuery = () =>
  useQuery({
    queryKey: queryKeys.groupStats,
    queryFn: async () => {
      const res = await GroupService.getDashboardStats();
      return res.data.data as GroupDashboardStatsDTO;
    },
    staleTime: STALE_TIME.MEDIUM,
  });
