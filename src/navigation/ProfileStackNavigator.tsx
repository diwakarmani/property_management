import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { withLayout } from '@/utils/withLayout';

import ProfileScreen from '@/screens/profile/ProfileScreen';
import EditProfileScreen from '@/screens/profile/EditProfileScreen';
import ChangePasswordScreen from '@/screens/profile/ChangePasswordScreen';
import AddressesScreen from '@/screens/profile/AddressesScreen';
import SentInquiriesScreen from '@/screens/inquiry/SentInquiriesScreen';

const Stack = createStackNavigator();

// withLayout() applied once at module scope for stable component identity
// (Gap analysis KB-04 / NV-01).
const ProfileMainWrapped = withLayout(ProfileScreen);
const EditProfileWrapped = withLayout(EditProfileScreen);
const ChangePasswordWrapped = withLayout(ChangePasswordScreen);
const AddressesWrapped = withLayout(AddressesScreen);
const SentInquiriesWrapped = withLayout(SentInquiriesScreen);

// Notifications is registered ONLY at the root AppNavigator level so that
// every entry point (header bell, profile menu) resolves to the same screen.
const ProfileStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileMainWrapped} />
    <Stack.Screen name="EditProfile" component={EditProfileWrapped} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordWrapped} />
    <Stack.Screen name="Addresses" component={AddressesWrapped} />
    <Stack.Screen name="SentInquiries" component={SentInquiriesWrapped} />
  </Stack.Navigator>
);

export default ProfileStackNavigator;
