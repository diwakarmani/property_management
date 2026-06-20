import axiosClient from '../client/axiosClient';
import type { ApiResponse } from '../types/auth.types';
import type { PropertyDTO, PropertyTypeDTO, PropertyAmenityDTO, PropertyImageDTO, PageResponse, ContactRevealResponse } from '../types/property.types';

export const PropertyService = {
  getById: (id: number) =>
    axiosClient.get<ApiResponse<PropertyDTO>>(`/api/properties/${id}`),

  getMyListings: (page = 0, size = 50) =>
    axiosClient.get<ApiResponse<PageResponse<PropertyDTO>>>('/api/properties/my-listings', {
      params: { page, size },
    }),

  search: (params: Record<string, any>) =>
    axiosClient.get<ApiResponse<PageResponse<PropertyDTO>>>('/api/properties', { params }),

  getPropertyTypes: () =>
    axiosClient.get<ApiResponse<PropertyTypeDTO[]>>('/api/property-types'),

  getAmenities: () =>
    axiosClient.get<ApiResponse<PropertyAmenityDTO[]>>('/api/property-types/amenities'),

  createProperty: (data: Record<string, any>) =>
    axiosClient.post<ApiResponse<PropertyDTO>>('/api/properties', data),

  publishProperty: (id: number) =>
    axiosClient.patch<ApiResponse<PropertyDTO>>(`/api/properties/${id}/publish`),

  updateProperty: (id: number, data: Record<string, any>) =>
    axiosClient.put<ApiResponse<PropertyDTO>>(`/api/properties/${id}`, data),

  requestDeletion: (id: number) =>
    axiosClient.post<ApiResponse<PropertyDTO>>(`/api/properties/${id}/request-deletion`),

  getImages: (propertyId: number) =>
    axiosClient.get<ApiResponse<PropertyImageDTO[]>>(`/api/properties/${propertyId}/images`),

  addImage: (propertyId: number, imageUrl: string, isPrimary = false) =>
    axiosClient.post<ApiResponse<PropertyImageDTO>>(`/api/properties/${propertyId}/images`, {
      imageUrl,
      isPrimary,
    }),

  deleteImage: (propertyId: number, imageId: number) =>
    axiosClient.delete<ApiResponse<void>>(`/api/properties/${propertyId}/images/${imageId}`),

  setPrimaryImage: (propertyId: number, imageId: number) =>
    axiosClient.patch<ApiResponse<void>>(`/api/properties/${propertyId}/images/${imageId}/set-primary`),

  revealContact: (propertyId: number) =>
    axiosClient.post<ApiResponse<ContactRevealResponse>>(`/api/properties/${propertyId}/reveal-contact`, undefined, {
      skipSuccessToast: true,
    } as any),
};
