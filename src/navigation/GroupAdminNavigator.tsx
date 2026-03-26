import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { withLayout } from '@/utils/withLayout';

import GroupDashboardScreen from '@/screens/groupAdmin/GroupDashboardScreen';
import ManageRealtorsScreen from '@/screens/groupAdmin/ManageRealtorsScreen';
import ApproveListingsScreen from '@/screens/groupAdmin/ApproveListingsScreen';
import GroupAnalyticsScreen from '@/screens/groupAdmin/GroupAnalyticsScreen';
import CreateGroupScreen from '@/screens/groupAdmin/CreateGroupScreen';
import EditGroupScreen from '@/screens/groupAdmin/EditGroupScreen';
import MyGroupScreen from '@/screens/groupAdmin/MyGroupScreen';
import AddMemberScreen from '@/screens/groupAdmin/AddMemberScreen';
import ProfileStackNavigator from './ProfileStackNavigator';

const Tab = createBottomTabNavigator();
const GroupStack = createStackNavigator();
const TeamStack = createStackNavigator();

const GroupStackScreen = () => (
  <GroupStack.Navigator screenOptions={{ headerShown: false }}>
    <GroupStack.Screen name="GroupDashboard" component={withLayout(GroupDashboardScreen)} />
    <GroupStack.Screen name="GroupAnalytics" component={withLayout(GroupAnalyticsScreen)} />
    <GroupStack.Screen name="CreateGroup" component={withLayout(CreateGroupScreen)} />
    <GroupStack.Screen name="EditGroup" component={withLayout(EditGroupScreen)} />
    <GroupStack.Screen name="MyGroup" component={withLayout(MyGroupScreen)} />
  </GroupStack.Navigator>
);

const TeamStackScreen = () => (
  <TeamStack.Navigator screenOptions={{ headerShown: false }}>
    <TeamStack.Screen name="ManageRealtors" component={withLayout(ManageRealtorsScreen)} />
    <TeamStack.Screen name="AddMember" component={withLayout(AddMemberScreen)} />
  </TeamStack.Navigator>
);

const GroupAdminNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: any;
        if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
        else if (route.name === 'Team') iconName = focused ? 'people' : 'people-outline';
        else if (route.name === 'Listings') iconName = focused ? 'checkmark-done' : 'checkmark-done-outline';
        else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
    })}
  >
    <Tab.Screen name="Dashboard" component={GroupStackScreen} />
    <Tab.Screen name="Team" component={TeamStackScreen} />
    <Tab.Screen name="Listings" component={withLayout(ApproveListingsScreen)} />
    <Tab.Screen name="Profile" component={ProfileStackNavigator} />
  </Tab.Navigator>
);

export default GroupAdminNavigator;
