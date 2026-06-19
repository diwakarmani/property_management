import React, { useEffect } from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { loadSavedLocation } from '@/store/slices/locationSlice';
import { bootstrapSession } from '@/store/slices/authSlice';
import AuthNavigator from './AuthNavigator';
import LocationSelectionScreen from '@/screens/location/LocationSelectionScreen';
import NotificationsScreen from '@/screens/profile/NotificationsScreen';
import MainTabNavigator from './MainTabNavigator';
import AdminNavigator from './AdminNavigator';
import RealtorNavigator from './RealtorNavigator';
import SellerNavigator from './SellerNavigator';
import RoleSelectionScreen from '@/screens/auth/RoleSelectionScreen';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import BootScreen from '@/screens/BootScreen';
import type { RootState, AppDispatch } from '@/store';
import type { RootStackParamList } from './types';
import { getAvailableRoles, pickRoleKey } from '@/utils/roleUtils';
import type { RoleKey } from '@/utils/roleUtils';

// Re-export for backward compat with existing tests and other imports
export type { RoleKey };
export { pickRoleKey };

const Stack = createStackNavigator<RootStackParamList>();

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

export const requiresLocationSelection = (
  roles: string[] | undefined | null,
  hasSelectedLocation: boolean
): boolean => {
  const r = roles ?? [];
  return !hasSelectedLocation && r.includes('BUYER') && pickRoleKey(r) === 'buyer';
};

/**
 * Renders the correct role navigator based on the persisted activeRole.
 * Falls back to pickRoleKey for single-role users (activeRole auto-set at login).
 */
const MainAppScreen = () => {
  const user       = useSelector((state: RootState) => state.auth.user);
  const activeRole = useSelector((state: RootState) => state.auth.activeRole);
  const roleKey    = activeRole ?? pickRoleKey(user?.roles);

  switch (roleKey) {
    case 'admin':
      return (
        <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
          <AdminNavigator />
        </ProtectedRoute>
      );
    case 'realtor':
      return (
        <ProtectedRoute requiredRoles={['REALTOR']}>
          <RealtorNavigator />
        </ProtectedRoute>
      );
    case 'seller':
      return (
        <ProtectedRoute requiredRoles={['SELLER']}>
          <SellerNavigator />
        </ProtectedRoute>
      );
    case 'buyer':
    default:
      return (
        <ProtectedRoute requiredRoles={['BUYER']}>
          <MainTabNavigator />
        </ProtectedRoute>
      );
  }
};

const AppNavigator = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, bootstrapped, activeRole } = useSelector(
    (state: RootState) => state.auth
  );
  const user            = useSelector((state: RootState) => state.auth.user);
  const { hasSelected } = useSelector((state: RootState) => state.location);

  // Multi-role users with no active role chosen → show the role picker popup
  const needsRoleSelection =
    isAuthenticated &&
    activeRole === null &&
    getAvailableRoles(user?.roles).length > 1;

  // Buyer-specific first-run location gate
  const shouldChooseLocation =
    isAuthenticated &&
    !needsRoleSelection &&
    activeRole === 'buyer' &&
    !hasSelected;

  useEffect(() => {
    dispatch(loadSavedLocation());
    dispatch(bootstrapSession());
  }, [dispatch]);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!bootstrapped ? (
          <Stack.Screen name="Boot" component={BootScreen} />
        ) : !isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : needsRoleSelection ? (
          <Stack.Screen
            name="RoleSelection"
            component={RoleSelectionScreen}
            options={{
              presentation: 'transparentModal',
              cardStyle: { backgroundColor: 'transparent' },
            }}
          />
        ) : shouldChooseLocation ? (
          <Stack.Screen name="LocationSetup" component={LocationSelectionScreen} />
        ) : (
          <>
            <Stack.Screen name="MainApp" component={MainAppScreen} />
            <Stack.Screen name="LocationSelection" component={LocationSelectionScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
