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
    axiosClient.post<ApiResponse<void>>(`/api/favorites/${propertyId}`, undefined, {
      skipSuccessToast: true,
    } as any),

  removeFavorite: (propertyId: number) =>
    axiosClient.delete<ApiResponse<void>>(`/api/favorites/${propertyId}`, {
      skipSuccessToast: true,
    } as any),

  checkFavorite: (propertyId: number) =>
    axiosClient.get<ApiResponse<boolean>>(`/api/favorites/${propertyId}/check`, {
      skipErrorToast: true,  // heart defaults to false on error; PropertyDetailsScreen shows no inline state for this
    }),
};
