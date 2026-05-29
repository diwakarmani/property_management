import axiosClient from '../client/axiosClient';
import type { ApiResponse } from '../types/auth.types';
import type { GroupDashboardStatsDTO, GroupMemberDTO, RealtorGroupDTO, AddMemberRequest, CreateGroupRequest, CreateRealtorRequest } from '../types/group.types';
import type { PageResponse } from '../types/property.types';
import type { PropertyCardDTO } from '../types/discovery.types';

// GETs pass skipErrorToast because every screen shows its own inline error state
// (e.g. "No Group Yet" empty state, Alert dialogs). The global toast would be noise.
const SILENT = { skipErrorToast: true } as const;

export const GroupService = {
  // ── Group ───────────────────────────────────────────────────────────────
  getMyGroup: () =>
    axiosClient.get<ApiResponse<RealtorGroupDTO>>('/api/group-admin/groups/mine', SILENT),

  getMyGroups: () =>
    axiosClient.get<ApiResponse<RealtorGroupDTO[]>>('/api/group-admin/groups', SILENT),

  createGroup: (data: CreateGroupRequest) =>
    axiosClient.post<ApiResponse<RealtorGroupDTO>>('/api/group-admin/groups', data),

  updateGroup: (id: number, data: Partial<CreateGroupRequest>) =>
    axiosClient.put<ApiResponse<RealtorGroupDTO>>(`/api/group-admin/groups/${id}`, data),

  // ── Dashboard ───────────────────────────────────────────────────────────
  getDashboardStats: (groupId?: number) =>
    axiosClient.get<ApiResponse<GroupDashboardStatsDTO>>('/api/group-admin/dashboard/stats', {
      ...SILENT,
      params: groupId ? { groupId } : undefined,
    }),

  // ── Members ─────────────────────────────────────────────────────────────
  getMembers: (page = 0, size = 20, includeInactive = false, groupId?: number) =>
    axiosClient.get<ApiResponse<PageResponse<GroupMemberDTO>>>('/api/group-admin/members', {
      ...SILENT,
      params: { page, size, includeInactive, ...(groupId ? { groupId } : {}) },
    }),

  lookupRealtor: (email: string) =>
    axiosClient.get<ApiResponse<GroupMemberDTO>>('/api/group-admin/realtors/search', {
      ...SILENT,
      params: { email },
    }),

  addMember: (request: AddMemberRequest, groupId?: number) =>
    axiosClient.post<ApiResponse<GroupMemberDTO>>('/api/group-admin/members', request, {
      params: groupId ? { groupId } : undefined,
    }),

  removeMember: (userId: number, groupId?: number) =>
    axiosClient.delete<ApiResponse<string>>(`/api/group-admin/members/${userId}`, {
      params: groupId ? { groupId } : undefined,
    }),

  updateMemberSettings: (userId: number, request: Partial<AddMemberRequest>, groupId?: number) =>
    axiosClient.patch<ApiResponse<GroupMemberDTO>>(`/api/group-admin/members/${userId}/settings`, request, {
      params: groupId ? { groupId } : undefined,
    }),

  createRealtor: (request: CreateRealtorRequest, groupId?: number) =>
    axiosClient.post<ApiResponse<GroupMemberDTO>>('/api/group-admin/realtors', request, {
      params: groupId ? { groupId } : undefined,
    }),

  activateMember: (userId: number, groupId?: number) =>
    axiosClient.patch<ApiResponse<GroupMemberDTO>>(`/api/group-admin/members/${userId}/activate`, null, {
      params: groupId ? { groupId } : undefined,
    }),

  // ── Listings ────────────────────────────────────────────────────────────
  getPendingListings: (page = 0, size = 20, groupId?: number) =>
    axiosClient.get<ApiResponse<PageResponse<PropertyCardDTO>>>('/api/group-admin/listings/pending', {
      ...SILENT,
      params: { page, size, ...(groupId ? { groupId } : {}) },
    }),

  getAllListings: (page = 0, size = 20, groupId?: number) =>
    axiosClient.get<ApiResponse<PageResponse<PropertyCardDTO>>>('/api/group-admin/listings', {
      ...SILENT,
      params: { page, size, ...(groupId ? { groupId } : {}) },
    }),

  approveListing: (propertyId: number) =>
    axiosClient.post<ApiResponse<string>>(`/api/group-admin/listings/${propertyId}/approve`),

  rejectListing: (propertyId: number, reason: string) =>
    axiosClient.post<ApiResponse<string>>(`/api/group-admin/listings/${propertyId}/reject`, { reason }),
};
