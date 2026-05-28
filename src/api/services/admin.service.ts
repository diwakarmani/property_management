import axiosClient from '../client/axiosClient';
import type { ApiResponse } from '../types/auth.types';
import type { PageResponse, PropertyTypeDTO, PropertySubTypeDTO, PropertyAmenityDTO } from '../types/property.types';
import type { RealtorGroupDTO } from '../types/group.types';

export interface AdminCountryDTO { id: number; name: string; isoCode?: string; }
export interface AdminStateDTO { id: number; name: string; countryId?: number; }
export interface AdminCityDTO { id: number; name: string; stateId?: number; isActive?: boolean; }

// UserDTO from admin perspective
export interface AdminUserDTO {
  id: number;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  emailVerified: boolean;
  roles: string[];
  locked: boolean;
  isActive: boolean;
  createdAt?: string;
}

export const AdminService = {
  // Users
  getUsers: (page = 0, size = 20) =>
    axiosClient.get<ApiResponse<PageResponse<AdminUserDTO>>>('/api/users', {
      params: { page, size, sortBy: 'id', sortDirection: 'DESC' },
    }),

  searchUsers: (query: string, page = 0, size = 20) =>
    axiosClient.get<ApiResponse<PageResponse<AdminUserDTO>>>('/api/users/search', {
      params: { query, page, size },
    }),

  deleteUser: (id: number) =>
    axiosClient.delete<ApiResponse<void>>(`/api/users/${id}`),

  assignRoles: (id: number, roles: string[]) =>
    axiosClient.post<ApiResponse<void>>(`/api/users/${id}/roles`, roles),

  activateUser: (id: number) =>
    axiosClient.post<ApiResponse<AdminUserDTO>>(`/api/users/${id}/activate`),

  deactivateUser: (id: number) =>
    axiosClient.post<ApiResponse<AdminUserDTO>>(`/api/users/${id}/deactivate`),

  getPendingGroupAdmins: (page = 0, size = 20) =>
    axiosClient.get<ApiResponse<PageResponse<AdminUserDTO>>>('/api/users/pending-group-admins', {
      params: { page, size },
    }),

  // Groups
  getGroups: (status?: string, page = 0, size = 20) =>
    axiosClient.get<ApiResponse<PageResponse<RealtorGroupDTO>>>('/api/admin/groups', {
      params: { status, page, size },
    }),

  getGroupById: (id: number) =>
    axiosClient.get<ApiResponse<RealtorGroupDTO>>(`/api/admin/groups/${id}`),

  approveGroup: (id: number) =>
    axiosClient.post<ApiResponse<void>>(`/api/admin/groups/${id}/approve`),

  rejectGroup: (id: number, reason: string) =>
    axiosClient.post<ApiResponse<void>>(`/api/admin/groups/${id}/reject`, { reason }),

  suspendGroup: (id: number, reason: string) =>
    axiosClient.post<ApiResponse<void>>(`/api/admin/groups/${id}/suspend`, { reason }),

  deleteGroup: (id: number) =>
    axiosClient.delete<ApiResponse<void>>(`/api/admin/groups/${id}`),

  // Discovery
  refreshDiscoveryCache: () =>
    axiosClient.post<ApiResponse<void>>('/api/admin/discovery/refresh'),

  // Property Config
  createPropertyType: (dto: { name: string; description?: string; isActive?: boolean }) =>
    axiosClient.post<ApiResponse<PropertyTypeDTO>>('/api/admin/property-config/types', dto),

  updatePropertyType: (id: number, dto: { name: string; description?: string; isActive?: boolean }) =>
    axiosClient.put<ApiResponse<PropertyTypeDTO>>(`/api/admin/property-config/types/${id}`, dto),

  createSubType: (dto: { name: string; description?: string; propertyTypeId: number; isActive?: boolean }) =>
    axiosClient.post<ApiResponse<PropertySubTypeDTO>>('/api/admin/property-config/sub-types', dto),

  createAmenity: (dto: { name: string; category?: string; iconClass?: string; isActive?: boolean }) =>
    axiosClient.post<ApiResponse<PropertyAmenityDTO>>('/api/admin/property-config/amenities', dto),

  // Location Bootstrap
  getAdminCountries: () =>
    axiosClient.get<AdminCountryDTO[]>('/api/admin/locations/countries'),

  getAdminStates: (countryId: number) =>
    axiosClient.get<AdminStateDTO[]>(`/api/admin/locations/countries/${countryId}/states`),

  getAdminCities: (stateId: number) =>
    axiosClient.get<AdminCityDTO[]>(`/api/admin/locations/states/${stateId}/cities`),

  importCountry: (name: string) =>
    axiosClient.post<void>('/api/admin/locations/bootstrap/country', null, { params: { name } }),

  importStates: (countryId: number) =>
    axiosClient.post<void>(`/api/admin/locations/bootstrap/${countryId}/states`),

  importCities: (stateId: number) =>
    axiosClient.post<void>(`/api/admin/locations/bootstrap/${stateId}/cities`),

  activateCity: (cityId: number) =>
    axiosClient.post<void>(`/api/admin/locations/cities/${cityId}/activate`),
};
