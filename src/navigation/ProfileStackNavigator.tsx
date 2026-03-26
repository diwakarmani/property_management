import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { withLayout } from '@/utils/withLayout';

import ProfileScreen from '@/screens/profile/ProfileScreen';
import EditProfileScreen from '@/screens/profile/EditProfileScreen';
import NotificationsScreen from '@/screens/profile/NotificationsScreen';
import ChangePasswordScreen from '@/screens/profile/ChangePasswordScreen';
import AddressesScreen from '@/screens/profile/AddressesScreen';

const Stack = createStackNavigator();

const ProfileStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={withLayout(ProfileScreen)} />
    <Stack.Screen name="EditProfile" component={withLayout(EditProfileScreen)} />
    <Stack.Screen name="Notifications" component={withLayout(NotificationsScreen)} />
    <Stack.Screen name="ChangePassword" component={withLayout(ChangePasswordScreen)} />
    <Stack.Screen name="Addresses" component={withLayout(AddressesScreen)} />
  </Stack.Navigator>
);

export default ProfileStackNavigator;
