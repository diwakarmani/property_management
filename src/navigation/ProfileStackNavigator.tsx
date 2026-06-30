import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { withLayout } from '@/utils/withLayout';

import ProfileScreen from '@/screens/profile/ProfileScreen';
import EditProfileScreen from '@/screens/profile/EditProfileScreen';
import ChangePasswordScreen from '@/screens/profile/ChangePasswordScreen';
import ChangeContactScreen from '@/screens/profile/ChangeContactScreen';
import AddressesScreen from '@/screens/profile/AddressesScreen';
import SentInquiriesScreen from '@/screens/inquiry/SentInquiriesScreen';
import RateRealtorScreen from '@/screens/inquiry/RateRealtorScreen';
import PropertyDetailScreen from '@/screens/property/PropertyDetailsScreen';
import ContactAgentScreen from '@/screens/property/ContactAgentScreen';
import RealtorProfileScreen from '@/screens/realtor/RealtorProfileScreen';

const Stack = createStackNavigator();

const ProfileMainWrapped     = withLayout(ProfileScreen);
const EditProfileWrapped     = withLayout(EditProfileScreen);
const ChangePasswordWrapped  = withLayout(ChangePasswordScreen);
const ChangeContactWrapped   = withLayout(ChangeContactScreen);
const AddressesWrapped       = withLayout(AddressesScreen);
const SentInquiriesWrapped   = withLayout(SentInquiriesScreen);
const RateRealtorWrapped     = withLayout(RateRealtorScreen);

const ProfileStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileMainWrapped} />
    <Stack.Screen name="EditProfile" component={EditProfileWrapped} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordWrapped} />
    <Stack.Screen name="ChangeContact" component={ChangeContactWrapped} />
    <Stack.Screen name="Addresses" component={AddressesWrapped} />
    <Stack.Screen name="SentInquiries"  component={SentInquiriesWrapped} />
    <Stack.Screen name="RateRealtor"    component={RateRealtorWrapped} />
    <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
    <Stack.Screen name="ContactAgent"   component={ContactAgentScreen} />
    <Stack.Screen name="RealtorProfile" component={RealtorProfileScreen} />
  </Stack.Navigator>
);

export default ProfileStackNavigator;
