import axiosClient from '@/api/client/axiosClient';
import type { ApiResponse } from '@/api/types/auth.types';
import type { PropertyDTO } from '@/api/types/property.types';

export interface FavoritesPageResponse {
  content: PropertyDTO[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

export const FavoriteService = {
  getFavorites: (page = 0, size = 20) =>
    axiosClient.get<ApiResponse<FavoritesPageResponse>>('/api/favorites', {
      params: { page, size },
    }),

  addFavorite: (propertyId: number) =>
    axiosClient.post<ApiResponse<void>>(`/api/favorites/${propertyId}`),

  removeFavorite: (propertyId: number) =>
    axiosClient.delete<ApiResponse<void>>(`/api/favorites/${propertyId}`),

  checkFavorite: (propertyId: number) =>
    axiosClient.get<ApiResponse<boolean>>(`/api/favorites/${propertyId}/check`),
};
