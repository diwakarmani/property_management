import axiosClient from '../client/axiosClient';
import type { ApiResponse } from '../types/auth.types';

export const NotificationTokenService = {
  register: (token: string, platform: 'ios' | 'android' | 'web') =>
    axiosClient.post<ApiResponse<null>>('/api/notification-tokens', { token, platform }),

  unregister: (token: string) =>
    axiosClient.delete<ApiResponse<null>>(
      `/api/notification-tokens/${encodeURIComponent(token)}`
    ),
};
