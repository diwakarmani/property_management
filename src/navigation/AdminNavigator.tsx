import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { withLayout } from '@/utils/withLayout';

// Screens
import AdminDashboardScreen from '@/screens/admin/AdminDashboardScreen';
import ManageGroupsScreen from '@/screens/admin/ManageGroupsScreen';
import ManageUsersScreen from '@/screens/admin/ManageUsersScreen';
import PlatformAnalyticsScreen from '@/screens/admin/PlatformAnalyticsScreen';
import SystemSettingsScreen from '@/screens/admin/SystemSettingsScreen';
import PropertyConfigScreen from '@/screens/admin/PropertyConfigScreen';
import LocationBootstrapScreen from '@/screens/admin/LocationBootstrapScreen';
import ProfileStackNavigator from './ProfileStackNavigator';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const AdminStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminDashboard" component={withLayout(AdminDashboardScreen)} />
    <Stack.Screen name="ManageGroups" component={withLayout(ManageGroupsScreen)} />
    <Stack.Screen name="ManageUsers" component={withLayout(ManageUsersScreen)} />
    <Stack.Screen name="PlatformAnalytics" component={withLayout(PlatformAnalyticsScreen)} />
    <Stack.Screen name="SystemSettings" component={withLayout(SystemSettingsScreen)} />
    <Stack.Screen name="PropertyConfig" component={withLayout(PropertyConfigScreen)} />
    <Stack.Screen name="LocationBootstrap" component={withLayout(LocationBootstrapScreen)} />
  </Stack.Navigator>
);

const AdminNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: any;
        if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
        else if (route.name === 'Groups') iconName = focused ? 'business' : 'business-outline';
        else if (route.name === 'Analytics') iconName = focused ? 'bar-chart' : 'bar-chart-outline';
        else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
    })}
  >
    <Tab.Screen name="Dashboard" component={AdminStack} />
    <Tab.Screen name="Groups" component={withLayout(ManageGroupsScreen)} />
    <Tab.Screen name="Analytics" component={withLayout(PlatformAnalyticsScreen)} />
    <Tab.Screen name="Profile" component={ProfileStackNavigator} />
  </Tab.Navigator>
);

export default AdminNavigator;