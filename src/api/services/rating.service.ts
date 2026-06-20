import axiosClient from '../client/axiosClient';
import type { ApiResponse } from '../types/auth.types';
import type { PageResponse } from '../types/property.types';
import type { CreateRatingRequest, RatingDTO } from '../types/rating.types';

export const RatingService = {
  /** Submit or update the current user's rating for a realtor (BUYER only). */
  submit: (realtorId: number, data: CreateRatingRequest) =>
    axiosClient.post<ApiResponse<RatingDTO>>(`/api/realtors/${realtorId}/ratings`, data),

  /** Fetch the current user's existing rating for a property; null data means eligible but not yet rated. */
  getMyRating: (realtorId: number, propertyId: number) =>
    axiosClient.get<ApiResponse<RatingDTO | null>>(`/api/realtors/${realtorId}/ratings/my`, {
      params: { propertyId },
      skipErrorToast: true,
    }),

  /** Public paginated list of all ratings for a realtor. */
  getRatings: (realtorId: number, page = 0, size = 10) =>
    axiosClient.get<ApiResponse<PageResponse<RatingDTO>>>(`/api/realtors/${realtorId}/ratings`, {
      params: { page, size },
    }),
};
