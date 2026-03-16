import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { hasPermission, hasAnyRole } from '@/utils/rbac/permissions';
import type { RootState } from '@/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRoles,
  fallback,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const userRoles = user?.roles || [];

  const hasAccess = requiredPermission
    ? hasPermission(userRoles, requiredPermission)
    : requiredRoles
    ? hasAnyRole(userRoles, requiredRoles)
    : true;

  if (!hasAccess) {
    return fallback || (
      <View style={styles.container}>
        <Text style={styles.text}>Access Denied</Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#999' },
});

export default ProtectedRoute;