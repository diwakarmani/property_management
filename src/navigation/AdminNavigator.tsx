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
const DashboardStack = createStackNavigator();
const GroupsStack = createStackNavigator();
const AnalyticsStack = createStackNavigator();

// withLayout() applied once at module scope for stable component identity
// (Gap analysis KB-04 / NV-01).
const AdminDashboardWrapped = withLayout(AdminDashboardScreen);
const ManageGroupsWrapped = withLayout(ManageGroupsScreen);
const ManageUsersWrapped = withLayout(ManageUsersScreen);
const PlatformAnalyticsWrapped = withLayout(PlatformAnalyticsScreen);
const SystemSettingsWrapped = withLayout(SystemSettingsScreen);
const PropertyConfigWrapped = withLayout(PropertyConfigScreen);
const LocationBootstrapWrapped = withLayout(LocationBootstrapScreen);

// Each screen is registered in exactly ONE navigator (Gap analysis NV-03).
// ManageGroups / PlatformAnalytics previously lived in both the stack AND a
// leaf tab — they now live only in their own tab's stack.
const DashboardStackScreen = () => (
  <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
    <DashboardStack.Screen name="AdminDashboard" component={AdminDashboardWrapped} />
    <DashboardStack.Screen name="ManageUsers" component={ManageUsersWrapped} />
    <DashboardStack.Screen name="SystemSettings" component={SystemSettingsWrapped} />
    <DashboardStack.Screen name="PropertyConfig" component={PropertyConfigWrapped} />
    <DashboardStack.Screen name="LocationBootstrap" component={LocationBootstrapWrapped} />
  </DashboardStack.Navigator>
);

const GroupsStackScreen = () => (
  <GroupsStack.Navigator screenOptions={{ headerShown: false }}>
    <GroupsStack.Screen name="ManageGroups" component={ManageGroupsWrapped} />
  </GroupsStack.Navigator>
);

const AnalyticsStackScreen = () => (
  <AnalyticsStack.Navigator screenOptions={{ headerShown: false }}>
    <AnalyticsStack.Screen name="PlatformAnalytics" component={PlatformAnalyticsWrapped} />
  </AnalyticsStack.Navigator>
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
    <Tab.Screen name="Dashboard" component={DashboardStackScreen} />
    <Tab.Screen name="Groups" component={GroupsStackScreen} />
    <Tab.Screen name="Analytics" component={AnalyticsStackScreen} />
    <Tab.Screen name="Profile" component={ProfileStackNavigator} />
  </Tab.Navigator>
);

export default AdminNavigator;
