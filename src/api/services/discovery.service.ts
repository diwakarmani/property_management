import axiosClient from '../client/axiosClient';
import { MOCK_PROPERTIES } from '@/utils/mockData';
import type { ApiResponse } from '../types/auth.types';
import type { HomeDiscoveryResponse, PropertyCardDTO, ViewMoreRequest } from '../types/discovery.types';

export const DiscoveryService = {
  getHomeFeed: async (city?: string, lat?: number, lng?: number) => {
    try {
      return await axiosClient.get<ApiResponse<HomeDiscoveryResponse>>('/api/discovery/home', {
        params: { city, lat, lng },
      });
    } catch (error) {
      console.warn('Discovery API failed, using mock data');
      return {
        data: {
          success: true,
          data: {
            popular: MOCK_PROPERTIES.slice(0, 10),
            recommended: MOCK_PROPERTIES.slice(0, 10),
            nearest: MOCK_PROPERTIES.slice(0, 10),
          },
        },
      } as any;
    }
  },

  viewMore: async (params: ViewMoreRequest) => {
    try {
      return await axiosClient.get<ApiResponse<{ content: PropertyCardDTO[] }>>('/api/discovery/home/view-more', {
        params,
      });
    } catch (error) {
      console.warn('ViewMore API failed, using mock data');
      return {
        data: {
          success: true,
          data: {
            content: MOCK_PROPERTIES,
          },
        },
      } as any;
    }
  },

  trackInteraction: async (propertyId: number, type: string) => {
    try {
      return await axiosClient.post(`/api/discovery/track/${propertyId}`, null, { params: { type } });
    } catch (error) {
      console.warn('Track API failed, ignoring');
      return { data: { success: true } };
    }
  },
};