import axiosClient from '../client/axiosClient';
import { MOCK_CITIES, MOCK_LOCALITIES } from '@/utils/mockData';
import type { ApiResponse } from '../types/auth.types';
import type { City, Locality, LocationSearchRequest } from '../types/location.types';

export const LocationService = {
  getCities: async () => {
    try {
      return await axiosClient.get<ApiResponse<City[]>>('/api/locations/cities');
    } catch (error) {
      console.warn('Cities API failed, using mock data');
      return {
        data: {
          success: true,
          message: 'Mock cities loaded',
          data: MOCK_CITIES,
        },
      } as any;
    }
  },

  searchLocalities: async (params: LocationSearchRequest) => {
    try {
      return await axiosClient.get<ApiResponse<Locality[]>>('/api/locations/localities', { params });
    } catch (error) {
      console.warn('Localities API failed, using mock data');
      const mockData = MOCK_LOCALITIES[params.cityId] || [];
      const filtered = mockData.filter(loc => 
        loc.name.toLowerCase().includes(params.keyword.toLowerCase())
      );
      return {
        data: {
          success: true,
          message: 'Mock localities loaded',
          data: filtered,
        },
      } as any;
    }
  },
};