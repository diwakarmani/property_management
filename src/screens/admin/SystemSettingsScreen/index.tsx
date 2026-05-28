import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';

const SystemSettingsScreen = () => (
  <View style={styles.container}>
    <View style={styles.iconWrap}>
      <Ionicons name="settings-outline" size={48} color={colors.primary} />
    </View>
    <Text style={styles.title}>System Settings</Text>
    <Text style={styles.subtitle}>Platform configuration — coming soon</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

export default SystemSettingsScreen;
