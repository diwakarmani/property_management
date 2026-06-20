import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { NotificationTokenService } from '@/api/services/notificationToken.service';
import type { RootState } from '@/store';

export const usePushTokenRegistration = (
  expoPushToken: string | null | undefined,
  options?: { enabled?: boolean }
) => {
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const enabled = options?.enabled ?? true;

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

      });
  }, [expoPushToken, isAuthenticated, enabled]);
};
