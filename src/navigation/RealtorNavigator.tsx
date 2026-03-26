import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { withLayout } from '@/utils/withLayout';

import RealtorDashboardScreen from '@/screens/realtor/RealtorDashboardScreen';
import MyListingsScreen from '@/screens/realtor/MyListingsScreen';
import EditListingScreen from '@/screens/realtor/EditListingScreen';
import PropertyImagesScreen from '@/screens/realtor/PropertyImagesScreen';
import CreateListingScreen from '@/screens/realtor/CreateListingScreen';
import ProfileStackNavigator from './ProfileStackNavigator';

const Tab = createBottomTabNavigator();
const ListingsStack = createStackNavigator();

const MyListingsStackScreen = () => (
  <ListingsStack.Navigator screenOptions={{ headerShown: false }}>
    <ListingsStack.Screen name="MyListingsMain" component={withLayout(MyListingsScreen)} />
    <ListingsStack.Screen name="EditListing" component={withLayout(EditListingScreen)} />
    <ListingsStack.Screen name="PropertyImages" component={withLayout(PropertyImagesScreen)} />
  </ListingsStack.Navigator>
);

const RealtorNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: any;
        if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
        else if (route.name === 'MyListings') iconName = focused ? 'list' : 'list-outline';
        else if (route.name === 'Create') iconName = focused ? 'add-circle' : 'add-circle-outline';
        else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
    })}
  >
    <Tab.Screen name="Dashboard" component={withLayout(RealtorDashboardScreen)} />
    <Tab.Screen name="MyListings" component={MyListingsStackScreen} />
    <Tab.Screen name="Create" component={withLayout(CreateListingScreen)} />
    <Tab.Screen name="Profile" component={ProfileStackNavigator} />
  </Tab.Navigator>
);

export default RealtorNavigator;
