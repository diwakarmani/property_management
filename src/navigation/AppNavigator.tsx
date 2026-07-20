import React, { useEffect } from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { loadSavedLocation } from '@/store/slices/locationSlice';
import { bootstrapSession, loadBiometricState } from '@/store/slices/authSlice';
import AuthNavigator from './AuthNavigator';
import BiometricLockScreen from '@/screens/auth/BiometricLockScreen';
import BiometricEnrollScreen from '@/screens/auth/BiometricEnrollScreen';
import LocationSelectionScreen from '@/screens/location/LocationSelectionScreen';
import NotificationsScreen from '@/screens/profile/NotificationsScreen';
import PropertyDetailScreen from '@/screens/property/PropertyDetailsScreen';
import ContactAgentScreen from '@/screens/property/ContactAgentScreen';
import RealtorProfileScreen from '@/screens/realtor/RealtorProfileScreen';
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
  const { isAuthenticated, bootstrapped, activeRole, locked, biometricSupported, biometricPromptShown } =
    useSelector((state: RootState) => state.auth);
  const user            = useSelector((state: RootState) => state.auth.user);
  const { hasSelected } = useSelector((state: RootState) => state.location);

  const needsRoleSelection =
    isAuthenticated &&
    activeRole === null &&
    getAvailableRoles(user?.roles).length > 1;

  const shouldChooseLocation =
    isAuthenticated &&
    !needsRoleSelection &&
    activeRole === 'buyer' &&
    !hasSelected;

  // One-time opt-in, only offered once role/location are settled and only on
  // devices that actually have biometric hardware enrolled.
  const needsBiometricPrompt =
    isAuthenticated &&
    !locked &&
    !needsRoleSelection &&
    !shouldChooseLocation &&
    biometricSupported === true &&
    !biometricPromptShown;

  useEffect(() => {
    dispatch(loadSavedLocation());
    dispatch(bootstrapSession());
    dispatch(loadBiometricState());
  }, [dispatch]);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!bootstrapped ? (
          <Stack.Screen name="Boot" component={BootScreen} />
        ) : !isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : locked ? (
          <Stack.Screen name="BiometricLock" component={BiometricLockScreen} />
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
        ) : needsBiometricPrompt ? (
          <Stack.Screen name="BiometricEnroll" component={BiometricEnrollScreen} />
        ) : (
          <>
            <Stack.Screen name="MainApp" component={MainAppScreen} />
            <Stack.Screen name="LocationSelection" component={LocationSelectionScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
            <Stack.Screen name="RealtorProfile" component={RealtorProfileScreen} />
            {/* NN-4: a notification-opened PropertyDetail lives on this root stack (per Bug 13),
                so its "Send Enquiry" -> navigate('ContactAgent', ...) needs this route here too —
                registering it only on RealtorNavigator/SellerNavigator's nested ListingsStack
                (done first, and insufficient on its own) doesn't cover this entry point. */}
            <Stack.Screen name="ContactAgent" component={ContactAgentScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
