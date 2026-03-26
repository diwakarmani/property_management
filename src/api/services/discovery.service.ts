import axiosClient from '../client/axiosClient';
import type { ApiResponse } from '../types/auth.types';
import type { HomeDiscoveryResponse, PropertyCardDTO, ViewMoreRequest } from '../types/discovery.types';

export const DiscoveryService = {
  getHomeFeed: (city?: string, lat?: number, lng?: number) =>
    axiosClient.get<ApiResponse<HomeDiscoveryResponse>>('/api/discovery/home', {
      params: { city, lat, lng },
    }),

  viewMore: (params: ViewMoreRequest) =>
    axiosClient.get<ApiResponse<{ content: PropertyCardDTO[] }>>('/api/discovery/home/view-more', {
      params,
    }),

  trackInteraction: async (propertyId: number, type: string) => {
    try {
      return await axiosClient.post(`/api/discovery/track/${propertyId}`, null, { params: { type } });
    } catch {
      // fire-and-forget — silently ignore
    }
  },
};