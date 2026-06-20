import axiosClient from '../client/axiosClient';
import type { ApiResponse } from '../types/auth.types';
import type { PageResponse } from '../types/property.types';
import type { CreateRatingRequest, RatingDTO } from '../types/rating.types';

export const RatingService = {

  submit: (realtorId: number, data: CreateRatingRequest) =>
    axiosClient.post<ApiResponse<RatingDTO>>(`/api/realtors/${realtorId}/ratings`, data),

  getMyRating: (realtorId: number, propertyId: number) =>
    axiosClient.get<ApiResponse<RatingDTO | null>>(`/api/realtors/${realtorId}/ratings/my`, {
      params: { propertyId },
      skipErrorToast: true,
    }),

  getRatings: (realtorId: number, page = 0, size = 10) =>
    axiosClient.get<ApiResponse<PageResponse<RatingDTO>>>(`/api/realtors/${realtorId}/ratings`, {
      params: { page, size },
    }),
};
