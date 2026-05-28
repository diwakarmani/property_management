import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/theme';

interface AsyncBoundaryProps {
  /** True while the data request is in flight. */
  loading: boolean;
  /** Non-null when the request failed. */
  error?: string | null;
  /** True when the request succeeded but returned nothing. */
  empty?: boolean;
  emptyText?: string;
  emptyIcon?: string;
  errorText?: string;
  /** When provided, an error/empty state shows a retry button. */
  onRetry?: () => void;
  children: React.ReactNode;
}

/**
 * Shared loading / empty / error wrapper for data-fetching screens
 * (Gap analysis FE-01). Standardises the three async states so every screen
 * behaves consistently instead of hand-rolling `ActivityIndicator`s.
 */
const AsyncBoundary: React.FC<AsyncBoundaryProps> = ({
  loading,
  error,
  empty,
  emptyText = 'Nothing here yet.',
  emptyIcon = 'file-tray-outline',
  errorText,
  onRetry,
  children,
}) => {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.message}>{errorText ?? error}</Text>
        {onRetry && (
          <TouchableOpacity
            style={styles.button}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry"
          >
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (empty) {
    return (
      <View style={styles.center}>
        <Ionicons name={emptyIcon as any} size={48} color={colors.border} />
        <Text style={styles.message}>{emptyText}</Text>
        {onRetry && (
          <TouchableOpacity
            style={[styles.button, styles.buttonGhost]}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Refresh"
          >
            <Text style={[styles.buttonText, styles.buttonTextGhost]}>Refresh</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  message: {
    marginTop: spacing.md,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
  },
  buttonGhost: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonTextGhost: {
    color: colors.primary,
  },
});

export default AsyncBoundary;
