import axiosClient from '../client/axiosClient';
import type { ApiResponse } from '../types/auth.types';

/**
 * Push-token registration with the backend (RF-06 device side).
 *
 * <p>The Expo push token itself is obtained on the device via
 * {@code expo-notifications} (not a concern of this service). This service
 * just relays it to the backend so server-side notification-create flows can
 * fan out to all registered tokens.
 */
export const NotificationTokenService = {
  register: (token: string, platform: 'ios' | 'android' | 'web') =>
    axiosClient.post<ApiResponse<null>>('/api/notification-tokens', { token, platform }),

  unregister: (token: string) =>
    axiosClient.delete<ApiResponse<null>>(
      `/api/notification-tokens/${encodeURIComponent(token)}`
    ),
};
