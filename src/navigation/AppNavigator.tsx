import React, { useEffect } from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { loadSavedLocation } from '@/store/slices/locationSlice';
import AuthNavigator from './AuthNavigator';
import LocationSelectionScreen from '@/screens/location/LocationSelectionScreen';
import MainTabNavigator from './MainTabNavigator';
import AdminNavigator from './AdminNavigator';
import GroupAdminNavigator from './GroupAdminNavigator'; 
import RealtorNavigator from './RealtorNavigator';
import type { RootState, AppDispatch } from '@/store';
import { loadSavedAuth } from '@/store/slices/authSlice';

const Stack = createStackNavigator();

const linking: LinkingOptions<any> = {
  prefixes: ['propertyapp://', 'https://propertyapp.mithilasoftech.com'],
  config: {
    screens: {
      Auth: {
        screens: {
          VerifyEmail: {
            path: 'verify-email',
            parse: { token: (token: string) => token },
          },
        },
      },
    },
  },
};

const AppNavigator = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isInitialized, user } = useSelector((state: RootState) => state.auth);
  const { hasSelected } = useSelector((state: RootState) => state.location);

  useEffect(() => {
    dispatch(loadSavedLocation());
    dispatch(loadSavedAuth())
  }, [dispatch]);
 if (!isInitialized) {
  return null; // Splash screen
}
  // Role-based routing
  const getMainFlow = () => {
    if (!user || !user.roles || user.roles.length === 0) return <MainTabNavigator />;
    
    try{
      const roles = user.roles || [];
    
    // Super Admin - highest priority
    if (roles.includes('SUPER_ADMIN')) {
      return <AdminNavigator />;
    }
    
    // Realtor Group Admin
    if (roles.includes('REALTOR_GROUP_ADMIN')) {
      return <GroupAdminNavigator />;
    }
    
    // Realtor
    if (roles.includes('REALTOR')) {
      return <RealtorNavigator />;
    }
    
    // Default: Buyer/Seller flow
    return <MainTabNavigator />;
    } catch (error) {
      console.error('Error determining user roles:', error);
      return <MainTabNavigator />;
    }
    
  };

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) 
        : 
        !hasSelected ? (
          <Stack.Screen name="LocationSelection" component={LocationSelectionScreen} />
        ) : 
        (
          <Stack.Screen name="MainApp">{() => getMainFlow()}</Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;