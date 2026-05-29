import axiosClient from '../client/axiosClient';
import type { ApiResponse } from '../types/auth.types';
import type { PageResponse } from '../types/property.types';
import type { NotificationDTO } from '../types/notification.types';

/** In-app notifications (gap analysis RF-06). */
export const NotificationService = {
  list: (page = 0, size = 20) =>
    axiosClient.get<ApiResponse<PageResponse<NotificationDTO>>>('/api/notifications', {
      params: { page, size },
      skipErrorToast: true,  // NotificationsScreen handles its own empty/error state
    } as any),

  unreadCount: () =>
    axiosClient.get<ApiResponse<{ count: number }>>('/api/notifications/unread-count', {
      skipGlobalLoader: true,
      skipErrorToast: true,  // badge silently shows 0 on error — no toast needed
    } as any),

  markRead: (id: number) =>
    axiosClient.patch<ApiResponse<NotificationDTO>>(`/api/notifications/${id}/read`, undefined, {
      skipSuccessToast: true,
    } as any),

  markAllRead: () =>
    axiosClient.post<ApiResponse<{ updated: number }>>('/api/notifications/mark-all-read', undefined, {
      skipSuccessToast: true,
    } as any),
};
