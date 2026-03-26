import axiosClient from '../client/axiosClient';
import type { ApiResponse } from '../types/auth.types';

export interface PlatformStatsDTO {
  totalUsers: number;
  totalProperties: number;
  activeListings: number;
  pendingApprovals: number;
  totalGroups: number;
  activeGroups: number;
  soldProperties: number;
  rentedProperties: number;
  newUsersThisMonth: number;
  newPropertiesThisMonth: number;
}

export const AnalyticsService = {
  getPlatformStats: () =>
    axiosClient.get<ApiResponse<PlatformStatsDTO>>('/api/admin/analytics/platform'),
};
