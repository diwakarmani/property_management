import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import HomeScreen from '@/screens/home/HomeScreen';
import ViewMoreScreen from '@/screens/property/ViewMoreScreen';
import PropertyDetailScreen from '@/screens/property/PropertyDetailsScreen';
import SearchScreen from '@/screens/search/SearchScreen';
import FavoritesScreen from '@/screens/favorites/FavoritesScreen';
import { withLayout } from '@/utils/withLayout';
import ProfileStackNavigator from './ProfileStackNavigator';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();

const HomeStackScreen = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="HomeMain" component={withLayout(HomeScreen)} />
    <HomeStack.Screen name="ViewMore" component={withLayout(ViewMoreScreen)} />
    <HomeStack.Screen name="PropertyDetail" component={withLayout(PropertyDetailScreen)} />
  </HomeStack.Navigator>
);

const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: any = 'home';
        if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
        else if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
        else if (route.name === 'Favorites') iconName = focused ? 'heart' : 'heart-outline';
        else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.secondary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeStackScreen} />
    <Tab.Screen name="Search" component={withLayout(SearchScreen)} />
    <Tab.Screen name="Favorites" component={withLayout(FavoritesScreen)} />
    <Tab.Screen name="Profile" component={ProfileStackNavigator} />
  </Tab.Navigator>
);

export default MainTabNavigator;
