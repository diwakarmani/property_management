import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '@/theme';
import HomeScreen from '@/screens/home/HomeScreen';
import ViewMoreScreen from '@/screens/property/ViewMoreScreen';
import PropertyDetailScreen from '@/screens/property/PropertyDetailsScreen';
import ContactAgentScreen from '@/screens/property/ContactAgentScreen';
import RealtorProfileScreen from '@/screens/realtor/RealtorProfileScreen';
import SearchScreen from '@/screens/search/SearchScreen';
import FavoritesScreen from '@/screens/favorites/FavoritesScreen';
import { withLayout } from '@/utils/withLayout';
import ProfileStackNavigator from './ProfileStackNavigator';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const SearchStack = createStackNavigator();

const HomeMainScreen = withLayout(HomeScreen);
const ViewMoreWrapped = withLayout(ViewMoreScreen);
const SearchWrapped = withLayout(SearchScreen);
const FavoritesWrapped = withLayout(FavoritesScreen);

const HomeStackScreen = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="HomeMain" component={HomeMainScreen} />
    <HomeStack.Screen name="ViewMore" component={ViewMoreWrapped} />
    <HomeStack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
    <HomeStack.Screen name="ContactAgent" component={ContactAgentScreen} />
    <HomeStack.Screen name="RealtorProfile" component={RealtorProfileScreen} />
  </HomeStack.Navigator>
);

export const SearchStackScreen = ({ disableAnimations = false }: { disableAnimations?: boolean }) => (
  <SearchStack.Navigator screenOptions={{ headerShown: false, animationEnabled: !disableAnimations }}>
    <SearchStack.Screen name="SearchMain" component={SearchWrapped} />
    <SearchStack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
    <SearchStack.Screen name="ContactAgent" component={ContactAgentScreen} />
    <SearchStack.Screen name="RealtorProfile" component={RealtorProfileScreen} />
  </SearchStack.Navigator>
);

export const MAIN_TAB_ROUTE_NAMES = ['Home', 'Search', 'Favorites', 'Profile'] as const;

const TAB_ICONS: Record<string, { active: any; inactive: any }> = {
  Home:      { active: 'home',       inactive: 'home-outline' },
  Search:    { active: 'search',     inactive: 'search-outline' },
  Favorites: { active: 'heart',      inactive: 'heart-outline' },
  Profile:   { active: 'person',     inactive: 'person-outline' },
};

const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color }) => {
        const icons = TAB_ICONS[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };
        return (
          <View style={focused ? styles.activeIconWrap : styles.iconWrap}>
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={22}
              color={color}
            />
          </View>
        );
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textLight,
      tabBarLabelStyle: styles.tabLabel,
      tabBarStyle: styles.tabBar,
      tabBarItemStyle: styles.tabItem,
    })}
  >
    <Tab.Screen name="Home"      component={HomeStackScreen} />
    <Tab.Screen name="Search"    component={SearchStackScreen} />
    <Tab.Screen name="Favorites" component={FavoritesWrapped} />
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

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    height: 72,
    paddingBottom: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  tabItem: {
    paddingTop: 8,
    paddingBottom: 0,
  },
  tabLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 2,
  },
  iconWrap: {
    width: 52,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconWrap: {
    width: 64,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySurface,
    borderRadius: 16,
  },
});

export default MainTabNavigator;
