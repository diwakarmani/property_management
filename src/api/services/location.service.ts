import axiosClient from '../client/axiosClient';
import type { ApiResponse } from '../types/auth.types';
import type { City, Locality } from '../types/location.type';

export const LocationService = {
  getCities: () =>
    axiosClient.get<ApiResponse<City[]>>('/api/locations/cities'),

  /**
   * Localities of a city. Omit `keyword` to get every area of the city
   * (the "pick your areas" list); pass it for type-ahead filtering.
   */
  getLocalities: (cityId: number, keyword?: string) =>
    axiosClient.get<ApiResponse<Locality[]>>('/api/locations/localities', {
      params: keyword ? { cityId, keyword } : { cityId },
    }),
};