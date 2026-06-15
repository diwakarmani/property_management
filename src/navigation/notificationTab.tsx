import React from 'react';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import NotificationsScreen from '@/screens/profile/NotificationsScreen';

export const NotificationTabScreen = NotificationsScreen;

export const hiddenNotificationTabOptions: BottomTabNavigationOptions = {
  tabBarButton: () => null,
  tabBarItemStyle: { display: 'none' },
};
