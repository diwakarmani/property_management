import axiosClient from '../client/axiosClient';
import type { ApiResponse } from '../types/auth.types';
import type {
  ConnectRealtorRequest,
  ConnectRealtorResponse,
  RealtorProfileDTO,
  RealtorStatsDTO,
} from '../types/property.types';

export const RealtorService = {
  getStats: () =>
    axiosClient.get<ApiResponse<RealtorStatsDTO>>('/api/realtor/stats'),

  getProfile: (realtorId: number) =>
    axiosClient.get<ApiResponse<RealtorProfileDTO>>(`/api/realtors/${realtorId}`, {
      skipErrorToast: true,
    }),

  connect: (realtorId: number, data: ConnectRealtorRequest) =>
    axiosClient.post<ApiResponse<ConnectRealtorResponse>>(`/api/realtors/${realtorId}/connect`, data),
};
