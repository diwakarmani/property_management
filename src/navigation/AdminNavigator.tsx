import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { withLayout } from '@/utils/withLayout';

// Screens
import AdminDashboardScreen from '@/screens/admin/AdminDashboardScreen';
import ManageUsersScreen from '@/screens/admin/ManageUsersScreen';
import AdminListingsScreen from '@/screens/admin/AdminListingsScreen';
import PlatformAnalyticsScreen from '@/screens/admin/PlatformAnalyticsScreen';
import SystemSettingsScreen from '@/screens/admin/SystemSettingsScreen';
import PropertyConfigScreen from '@/screens/admin/PropertyConfigScreen';
import LocationBootstrapScreen from '@/screens/admin/LocationBootstrapScreen';
import NotificationsScreen from '@/screens/profile/NotificationsScreen';
import ProfileStackNavigator from './ProfileStackNavigator';

const Tab = createBottomTabNavigator();
const DashboardStack = createStackNavigator();
const UsersStack = createStackNavigator();
const ListingsStack = createStackNavigator();
const AnalyticsStack = createStackNavigator();

// withLayout() applied once at module scope for stable component identity
// (Gap analysis KB-04 / NV-01).
const AdminDashboardWrapped = withLayout(AdminDashboardScreen);
const ManageUsersWrapped = withLayout(ManageUsersScreen);
const AdminListingsWrapped = withLayout(AdminListingsScreen);
const PlatformAnalyticsWrapped = withLayout(PlatformAnalyticsScreen);
const SystemSettingsWrapped = withLayout(SystemSettingsScreen);
const PropertyConfigWrapped = withLayout(PropertyConfigScreen);
const LocationBootstrapWrapped = withLayout(LocationBootstrapScreen);
const NotificationsWrapped = withLayout(NotificationsScreen);

const DashboardStackScreen = () => (
  <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
    <DashboardStack.Screen name="AdminDashboard" component={AdminDashboardWrapped} />
    <DashboardStack.Screen name="SystemSettings" component={SystemSettingsWrapped} />
    <DashboardStack.Screen name="PropertyConfig" component={PropertyConfigWrapped} />
    <DashboardStack.Screen name="LocationBootstrap" component={LocationBootstrapWrapped} />
  </DashboardStack.Navigator>
);

const UsersStackScreen = () => (
  <UsersStack.Navigator screenOptions={{ headerShown: false }}>
    <UsersStack.Screen name="ManageUsers" component={ManageUsersWrapped} />
  </UsersStack.Navigator>
);

const ListingsStackScreen = () => (
  <ListingsStack.Navigator screenOptions={{ headerShown: false }}>
    <ListingsStack.Screen name="AdminListings" component={AdminListingsWrapped} />
  </ListingsStack.Navigator>
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
        else if (route.name === 'Users') iconName = focused ? 'people' : 'people-outline';
        else if (route.name === 'Listings') iconName = focused ? 'list' : 'list-outline';
        else if (route.name === 'Analytics') iconName = focused ? 'bar-chart' : 'bar-chart-outline';
        else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
        else return null;
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardStackScreen} />
    <Tab.Screen name="Users" component={UsersStackScreen} />
    <Tab.Screen name="Listings" component={ListingsStackScreen} />
    <Tab.Screen name="Analytics" component={AnalyticsStackScreen} />
    <Tab.Screen
      name="Notifications"
      component={NotificationsWrapped}
      options={{ tabBarButton: () => null }}
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

export default AdminNavigator;
