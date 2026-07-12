import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { colors } from '@/theme';
import { withLayout } from '@/utils/withLayout';
import { useNewInquiryCount } from '@/api/hooks/useInquiries';
import type { RootState } from '@/store';

import RealtorDashboardScreen from '@/screens/realtor/RealtorDashboardScreen';
import MyListingsScreen from '@/screens/realtor/MyListingsScreen';
import EditListingScreen from '@/screens/realtor/EditListingScreen';
import PropertyImagesScreen from '@/screens/realtor/PropertyImagesScreen';
import CreateListingScreen from '@/screens/realtor/CreateListingScreen';
import PropertyDetailScreen from '@/screens/property/PropertyDetailsScreen';
import ContactAgentScreen from '@/screens/property/ContactAgentScreen';
import RealtorProfileScreen from '@/screens/realtor/RealtorProfileScreen';
import ReceivedInquiriesScreen from '@/screens/inquiry/ReceivedInquiriesScreen';
import ProfileStackNavigator from './ProfileStackNavigator';

const Tab = createBottomTabNavigator();
const ListingsStack = createStackNavigator();

const DashboardWrapped = withLayout(RealtorDashboardScreen);
const MyListingsWrapped = withLayout(MyListingsScreen);
const EditListingWrapped = withLayout(EditListingScreen);
const PropertyImagesWrapped = withLayout(PropertyImagesScreen);
const CreateListingWrapped = withLayout(CreateListingScreen);
const PropertyDetailWrapped = PropertyDetailScreen;
const RealtorProfileWrapped = withLayout(RealtorProfileScreen);
const InquiriesWrapped = withLayout(ReceivedInquiriesScreen);

export const REALTOR_TAB_REGISTERED_ROUTES = [
  'Dashboard', 'MyListings', 'Create', 'Inquiries', 'Profile',
] as const;

const MyListingsStackScreen = () => (
  <ListingsStack.Navigator screenOptions={{ headerShown: false }}>
    <ListingsStack.Screen name="MyListingsMain" component={MyListingsWrapped} />
    <ListingsStack.Screen name="PropertyDetail" component={PropertyDetailWrapped} />
    <ListingsStack.Screen name="EditListing" component={EditListingWrapped} />
    <ListingsStack.Screen name="PropertyImages" component={PropertyImagesWrapped} />
    <ListingsStack.Screen name="RealtorProfile" component={RealtorProfileWrapped} />
    {/* NN-4: realtors can now message other realtors' listings (Send Enquiry -> ContactAgent).
        Without this, PropertyDetailScreen's navigate('ContactAgent', ...) would hit React
        Navigation's unhandled-action path — same class of bug as Bug 13's RealtorProfile gap. */}
    <ListingsStack.Screen name="ContactAgent" component={ContactAgentScreen} />
  </ListingsStack.Navigator>
);

const RealtorNavigator = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const newInquiryCount = useNewInquiryCount(isAuthenticated);
  return (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: any;
        if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
        else if (route.name === 'MyListings') iconName = focused ? 'list' : 'list-outline';
        else if (route.name === 'Create') iconName = focused ? 'add-circle' : 'add-circle-outline';
        else if (route.name === 'Inquiries') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
        else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
        else return null;
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardWrapped} />
    <Tab.Screen name="MyListings" component={MyListingsStackScreen} />
    <Tab.Screen name="Create" component={CreateListingWrapped} />
    <Tab.Screen
      name="Inquiries"
      component={InquiriesWrapped}
      options={{ tabBarBadge: newInquiryCount > 0 ? newInquiryCount : undefined }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileStackNavigator}
      listeners={({ navigation }) => ({
        tabPress: (e) => {
          e.preventDefault();
          navigation.navigate('Profile', { screen: 'ProfileMain' });
        },
      })}
    />
  </Tab.Navigator>
  );
};

export default RealtorNavigator;
