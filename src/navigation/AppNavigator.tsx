import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { loadSavedLocation } from '@/store/slices/locationSlice';
import AuthNavigator from './AuthNavigator';
import LocationSelectionScreen from '@/screens/location/LocationSelectionScreen';
import MainTabNavigator from './MainTabNavigator';
import type { RootState, AppDispatch } from '@/store';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { hasSelected } = useSelector((state: RootState) => state.location);

  useEffect(() => {
    dispatch(loadSavedLocation());
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : !hasSelected ? (
          <Stack.Screen name="LocationSelection" component={LocationSelectionScreen} />
        ) : (
          <Stack.Screen name="MainApp" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;