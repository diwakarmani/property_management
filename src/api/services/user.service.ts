import axiosClient from '../client/axiosClient';
import type { ApiResponse } from '../types/auth.types';

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  profileImageUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  occupation?: string;
  website?: string;
}

export interface UserAddressDTO {
  id?: number;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  addressType?: string;
  isDefault?: boolean;
}

export const UserService = {
  getMe: () =>
    axiosClient.get<ApiResponse<any>>('/api/users/me'),

  updateMe: (data: UpdateProfileRequest) =>
    axiosClient.put<ApiResponse<any>>('/api/users/me', data),

  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) =>
    axiosClient.post<ApiResponse<void>>('/api/users/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    }),

  addAddress: (data: Omit<UserAddressDTO, 'id'>) =>
    axiosClient.post<ApiResponse<UserAddressDTO>>('/api/users/me/addresses', data),

  deleteAddress: (addressId: number) =>
    axiosClient.delete<ApiResponse<void>>(`/api/users/me/addresses/${addressId}`),
};
