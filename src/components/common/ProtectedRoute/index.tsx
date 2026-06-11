import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { hasPermission, hasAnyRole } from '@/utils/rbac/permissions';
import { logout } from '@/store/slices/authSlice';
import { colors, typography, spacing } from '@/theme';
import type { RootState, AppDispatch } from '@/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
}

const AccessDeniedScreen = () => {
  const dispatch = useDispatch<AppDispatch>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Icon */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <Ionicons name="lock-closed-outline" size={40} color={colors.white} />
        </LinearGradient>

        {/* Text */}
        <Text style={styles.title}>Access Restricted</Text>
        <Text style={styles.message}>
          Your account doesn't have permission to view this section. Sign out and log back in to refresh your session.
        </Text>

        {/* Sign out button */}
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={() => dispatch(logout())}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.white} />
            <Text style={styles.buttonText}>Sign Out</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRoles,
  fallback,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const userRoles = user?.roles || [];

  const permissionOk = requiredPermission
    ? hasPermission(userRoles, requiredPermission)
    : true;
  const rolesOk = requiredRoles ? hasAnyRole(userRoles, requiredRoles) : true;

  if (!(permissionOk && rolesOk)) {
    return fallback ? <>{fallback}</> : <AccessDeniedScreen />;
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },

  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },

  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },

  message: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    maxWidth: 300,
  },

  button: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },

  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
  },

  buttonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.white,
  },
});

export default ProtectedRoute;
