import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { NotificationTokenService } from '@/api/services/notificationToken.service';
import type { RootState } from '@/store';

/**
 * Optional hook that registers the device's Expo push token with the backend
 * whenever the user becomes authenticated (RF-06 device side).
 *
 * <p>Caller is responsible for actually obtaining the Expo token via
 * {@code expo-notifications.getExpoPushTokenAsync()} and passing it in.
 * Decoupling that step keeps this hook test-friendly and lets the native
 * permission/token flow live in a thin wrapper at the app boundary.
 *
 * @example
 *   const expoToken = ... // from expo-notifications
 *   usePushTokenRegistration(expoToken);
 */
export const usePushTokenRegistration = (
  expoPushToken: string | null | undefined,
  options?: { enabled?: boolean }
) => {
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const enabled = options?.enabled ?? true;
  // Track what we last sent so we don't spam the backend on every render.
  const lastRegisteredRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !isAuthenticated) return;
    if (!expoPushToken || !expoPushToken.trim()) return;
    if (expoPushToken === lastRegisteredRef.current) return;

    const platform: 'ios' | 'android' | 'web' =
      Platform.OS === 'ios' ? 'ios'
        : Platform.OS === 'android' ? 'android'
          : 'web';

    NotificationTokenService.register(expoPushToken, platform)
      .then(() => {
        lastRegisteredRef.current = expoPushToken;
      })
      .catch(() => {
        // Best-effort — failure here doesn't degrade the rest of the app.
      });
  }, [expoPushToken, isAuthenticated, enabled]);
};
