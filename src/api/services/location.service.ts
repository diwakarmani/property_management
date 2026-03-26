import axiosClient from '../client/axiosClient';
import type { ApiResponse } from '../types/auth.types';
import type { City, Locality, LocationSearchRequest } from '../types/location.type';

export const LocationService = {
  getCities: () =>
    axiosClient.get<ApiResponse<City[]>>('/api/locations/cities'),

  searchLocalities: (params: LocationSearchRequest) =>
    axiosClient.get<ApiResponse<Locality[]>>('/api/locations/localities', { params }),
};