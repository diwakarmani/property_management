import axiosClient from '../client/axiosClient';
import type { ApiResponse } from '../types/auth.types';
import type { GroupDashboardStatsDTO, GroupMemberDTO, RealtorGroupDTO, AddMemberRequest, CreateGroupRequest, CreateRealtorRequest } from '../types/group.types';
import type { PageResponse } from '../types/property.types';
import type { PropertyCardDTO } from '../types/discovery.types';

export const GroupService = {
  // ── Group ───────────────────────────────────────────────────────────────
  getMyGroup: () =>
    axiosClient.get<ApiResponse<RealtorGroupDTO>>('/api/group-admin/groups/mine'),

  createGroup: (data: CreateGroupRequest) =>
    axiosClient.post<ApiResponse<RealtorGroupDTO>>('/api/group-admin/groups', data),

  updateGroup: (id: number, data: Partial<CreateGroupRequest>) =>
    axiosClient.put<ApiResponse<RealtorGroupDTO>>(`/api/group-admin/groups/${id}`, data),

  // ── Dashboard ───────────────────────────────────────────────────────────
  getDashboardStats: () =>
    axiosClient.get<ApiResponse<GroupDashboardStatsDTO>>('/api/group-admin/dashboard/stats'),

  // ── Members ─────────────────────────────────────────────────────────────
  getMembers: (page = 0, size = 20, includeInactive = false) =>
    axiosClient.get<ApiResponse<PageResponse<GroupMemberDTO>>>('/api/group-admin/members', {
      params: { page, size, includeInactive },
    }),

  lookupRealtor: (email: string) =>
    axiosClient.get<ApiResponse<GroupMemberDTO>>('/api/group-admin/realtors/search', {
      params: { email },
    }),

  addMember: (request: AddMemberRequest) =>
    axiosClient.post<ApiResponse<GroupMemberDTO>>('/api/group-admin/members', request),

  removeMember: (userId: number) =>
    axiosClient.delete<ApiResponse<string>>(`/api/group-admin/members/${userId}`),

  updateMemberSettings: (userId: number, request: Partial<AddMemberRequest>) =>
    axiosClient.patch<ApiResponse<GroupMemberDTO>>(`/api/group-admin/members/${userId}/settings`, request),

  createRealtor: (request: CreateRealtorRequest) =>
    axiosClient.post<ApiResponse<GroupMemberDTO>>('/api/group-admin/realtors', request),

  activateMember: (userId: number) =>
    axiosClient.patch<ApiResponse<GroupMemberDTO>>(`/api/group-admin/members/${userId}/activate`),

  // ── Listings ────────────────────────────────────────────────────────────
  getPendingListings: (page = 0, size = 20) =>
    axiosClient.get<ApiResponse<PageResponse<PropertyCardDTO>>>('/api/group-admin/listings/pending', {
      params: { page, size },
    }),

  getAllListings: (page = 0, size = 20) =>
    axiosClient.get<ApiResponse<PageResponse<PropertyCardDTO>>>('/api/group-admin/listings', {
      params: { page, size },
    }),

  approveListing: (propertyId: number) =>
    axiosClient.post<ApiResponse<string>>(`/api/group-admin/listings/${propertyId}/approve`),

  rejectListing: (propertyId: number, reason: string) =>
    axiosClient.post<ApiResponse<string>>(`/api/group-admin/listings/${propertyId}/reject`, { reason }),
};
