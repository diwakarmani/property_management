import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { withLayout } from '@/utils/withLayout';

import ProfileScreen from '@/screens/profile/ProfileScreen';
import EditProfileScreen from '@/screens/profile/EditProfileScreen';
import NotificationsScreen from '@/screens/profile/NotificationsScreen';
import ChangePasswordScreen from '@/screens/profile/ChangePasswordScreen';
import AddressesScreen from '@/screens/profile/AddressesScreen';

const Stack = createStackNavigator();

// withLayout() applied once at module scope for stable component identity
// (Gap analysis KB-04 / NV-01).
const ProfileMainWrapped = withLayout(ProfileScreen);
const EditProfileWrapped = withLayout(EditProfileScreen);
const NotificationsWrapped = withLayout(NotificationsScreen);
const ChangePasswordWrapped = withLayout(ChangePasswordScreen);
const AddressesWrapped = withLayout(AddressesScreen);

const ProfileStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileMainWrapped} />
    <Stack.Screen name="EditProfile" component={EditProfileWrapped} />
    <Stack.Screen name="Notifications" component={NotificationsWrapped} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordWrapped} />
    <Stack.Screen name="Addresses" component={AddressesWrapped} />
  </Stack.Navigator>
);

export default ProfileStackNavigator;
