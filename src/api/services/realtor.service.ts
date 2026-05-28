import axiosClient from '../client/axiosClient';
import type { ApiResponse } from '../types/auth.types';
import type { RealtorStatsDTO } from '../types/property.types';

export const RealtorService = {
  getStats: () =>
    axiosClient.get<ApiResponse<RealtorStatsDTO>>('/api/realtor/stats'),
};
