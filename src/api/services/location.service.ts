import axiosClient from '../client/axiosClient';
import type { ApiResponse } from '../types/auth.types';
import type { City, Locality } from '../types/location.type';

export const LocationService = {
  getCities: () =>
    axiosClient.get<ApiResponse<City[]>>('/api/locations/cities'),

  getLocalities: (cityId: number, keyword?: string) =>
    axiosClient.get<ApiResponse<Locality[]>>('/api/locations/localities', {
      params: keyword ? { cityId, keyword } : { cityId },
    }),
};