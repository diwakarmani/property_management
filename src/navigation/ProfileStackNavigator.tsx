import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { withLayout } from '@/utils/withLayout';

import ProfileScreen from '@/screens/profile/ProfileScreen';
import EditProfileScreen from '@/screens/profile/EditProfileScreen';
import ChangePasswordScreen from '@/screens/profile/ChangePasswordScreen';
import AddressesScreen from '@/screens/profile/AddressesScreen';
import NotificationsScreen from '@/screens/profile/NotificationsScreen';

const Stack = createStackNavigator();

// withLayout() applied once at module scope for stable component identity
// (Gap analysis KB-04 / NV-01).
const ProfileMainWrapped = withLayout(ProfileScreen);
const EditProfileWrapped = withLayout(EditProfileScreen);
const ChangePasswordWrapped = withLayout(ChangePasswordScreen);
const AddressesWrapped = withLayout(AddressesScreen);

const ProfileStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileMainWrapped} />
    <Stack.Screen name="EditProfile" component={EditProfileWrapped} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordWrapped} />
    <Stack.Screen name="Addresses" component={AddressesWrapped} />
    {/* Notifications is a profile-stack screen so the tab bar stays visible
        for all roles when navigating from the Header bell icon. */}
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
  </Stack.Navigator>
);

export default ProfileStackNavigator;
