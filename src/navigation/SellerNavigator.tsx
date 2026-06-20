import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { withLayout } from '@/utils/withLayout';

import SellerDashboardScreen from '@/screens/seller/SellerDashboardScreen';
// Listing-management screens are role-agnostic and reused from the Realtor flow.
// The backend already authorises SELLER for property CRUD (PropertyController).
import MyListingsScreen from '@/screens/realtor/MyListingsScreen';
import EditListingScreen from '@/screens/realtor/EditListingScreen';
import PropertyImagesScreen from '@/screens/realtor/PropertyImagesScreen';
import CreateListingScreen from '@/screens/realtor/CreateListingScreen';
import PropertyDetailScreen from '@/screens/property/PropertyDetailsScreen';
import RealtorProfileScreen from '@/screens/realtor/RealtorProfileScreen';
import ReceivedInquiriesScreen from '@/screens/inquiry/ReceivedInquiriesScreen';
import ProfileStackNavigator from './ProfileStackNavigator';

const Tab = createBottomTabNavigator();
const ListingsStack = createStackNavigator();

// withLayout() applied once at module scope for stable component identity
// (Gap analysis KB-04 / NV-01).
const SellerDashboardWrapped = withLayout(SellerDashboardScreen);
const MyListingsWrapped = withLayout(MyListingsScreen);
const EditListingWrapped = withLayout(EditListingScreen);
const PropertyImagesWrapped = withLayout(PropertyImagesScreen);
const CreateListingWrapped = withLayout(CreateListingScreen);
const PropertyDetailWrapped = PropertyDetailScreen;
const InquiriesWrapped = withLayout(ReceivedInquiriesScreen);

export const SELLER_TAB_REGISTERED_ROUTES = [
  'Dashboard', 'MyListings', 'Create', 'Inquiries', 'Profile',
] as const;

const MyListingsStackScreen = () => (
  <ListingsStack.Navigator screenOptions={{ headerShown: false }}>
    <ListingsStack.Screen name="MyListingsMain" component={MyListingsWrapped} />
    <ListingsStack.Screen name="PropertyDetail" component={PropertyDetailWrapped} />
    <ListingsStack.Screen name="EditListing"    component={EditListingWrapped} />
    <ListingsStack.Screen name="PropertyImages" component={PropertyImagesWrapped} />
    <ListingsStack.Screen name="RealtorProfile" component={RealtorProfileScreen} />
  </ListingsStack.Navigator>
);

/**
 * Seller flow (KB-02 / RF-01). Sellers previously fell through to the Buyer
 * tab navigator and had no way to manage listings. This gives them a dedicated
 * dashboard + listing-management surface.
 */
const SellerNavigator = () => (
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
    <Tab.Screen name="Dashboard" component={SellerDashboardWrapped} />
    <Tab.Screen name="MyListings" component={MyListingsStackScreen} />
    <Tab.Screen name="Create" component={CreateListingWrapped} />
    <Tab.Screen name="Inquiries" component={InquiriesWrapped} />
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

export default SellerNavigator;
