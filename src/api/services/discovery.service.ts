import axiosClient from '../client/axiosClient';
import type { ApiResponse } from '../types/auth.types';
import type { HomeDiscoveryResponse, PropertyCardDTO, ViewMoreRequest } from '../types/discovery.types';
import type { PageResponse } from '../types/property.types';

export const DiscoveryService = {
  getHomeFeed: (city?: string, lat?: number, lng?: number) =>
    axiosClient.get<ApiResponse<HomeDiscoveryResponse>>('/api/discovery/home', {
      params: { city, lat, lng },
    }),

  getCityListingCount: (city: string) =>
    axiosClient.get<ApiResponse<PageResponse<any>>>('/api/properties', {
      params: { city, status: 'ACTIVE', page: 0, size: 1 },
    }),

  viewMore: (params: ViewMoreRequest) =>
    axiosClient.get<ApiResponse<PageResponse<PropertyCardDTO>>>('/api/discovery/home/view-more', {
      params,
    }),

  trackInteraction: async (propertyId: number, type: string) => {
    try {
      return await axiosClient.post(`/api/discovery/track/${propertyId}`, null, {
        params: { type },
        skipGlobalLoader: true,
        skipSuccessToast: true,
      } as any);
    } catch {

    }
  },
};