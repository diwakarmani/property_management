import React, { useEffect } from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { loadSavedLocation } from '@/store/slices/locationSlice';
import { bootstrapSession } from '@/store/slices/authSlice';
import AuthNavigator from './AuthNavigator';
import LocationSelectionScreen from '@/screens/location/LocationSelectionScreen';
import MainTabNavigator from './MainTabNavigator';
import AdminNavigator from './AdminNavigator';
import RealtorNavigator from './RealtorNavigator';
import SellerNavigator from './SellerNavigator';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import BootScreen from '@/screens/BootScreen';
import type { RootState, AppDispatch } from '@/store';
import type { RootStackParamList } from './types';

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

/** The role-navigator selector — extracted so it can be unit-tested (IT-NAV-ROLES). */
export type RoleKey = 'admin' | 'realtor' | 'seller' | 'buyer';

export const pickRoleKey = (roles: string[] | undefined | null): RoleKey => {
  const r = roles ?? [];
  // Highest-privilege role wins.
  if (r.includes('SUPER_ADMIN')) return 'admin';
  if (r.includes('REALTOR')) return 'realtor';
  if (r.includes('SELLER')) return 'seller';
  return 'buyer';
};

export const requiresLocationSelection = (
  roles: string[] | undefined | null,
  hasSelectedLocation: boolean
): boolean => {
  const r = roles ?? [];
  return !hasSelectedLocation && r.includes('BUYER') && pickRoleKey(r) === 'buyer';
};

/**
 * Stable, module-scope component that selects the role navigator.
 * Defined once so React Navigation keeps a constant component identity —
 * replaces the previous inline `{() => getMainFlow()}` factory that rebuilt
 * the entire role tree on every render. (Gap analysis NV-02.)
 */
const MainAppScreen = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  // `pickRoleKey` selects which tree to render; `ProtectedRoute` is the
  // fail-closed assertion wrapped around it (gap analysis NB-17). The default
  // branch previously dropped a session with no/unknown roles straight into
  // the buyer app — wrapping it makes that case render "Access Denied"
  // instead, so a corrupted session fails closed rather than open.
  switch (pickRoleKey(user?.roles)) {
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
  const { isAuthenticated, bootstrapped } = useSelector(
    (state: RootState) => state.auth
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const { hasSelected } = useSelector((state: RootState) => state.location);
  const shouldChooseLocation = requiresLocationSelection(user?.roles, hasSelected);

  // Boot: restore the saved location and the saved session in parallel.
  useEffect(() => {
    dispatch(loadSavedLocation());
    dispatch(bootstrapSession());
  }, [dispatch]);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!bootstrapped ? (
          // Boot-time session restore in progress (or failed → BootScreen
          // shows a Retry button). Never bounce to Login until we know.
          <Stack.Screen name="Boot" component={BootScreen} />
        ) : !isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : shouldChooseLocation ? (
          // Buyer first-run gate: search location is not part of admin/realtor onboarding.
          <Stack.Screen name="LocationSelection" component={LocationSelectionScreen} />
        ) : (
          <>
            <Stack.Screen name="MainApp" component={MainAppScreen} />
            <Stack.Screen name="LocationSelection" component={LocationSelectionScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
