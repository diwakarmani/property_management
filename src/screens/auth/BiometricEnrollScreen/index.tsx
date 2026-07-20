import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { colors, typography, spacing } from '@/theme';
import { enableBiometric, declineBiometricPrompt } from '@/store/slices/authSlice';
import { BIOMETRIC_ICON, formatBiometricLabel } from '@/utils/biometric/biometricService';
import type { AppDispatch, RootState } from '@/store';

const BiometricEnrollScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const biometricTypes = useSelector((s: RootState) => s.auth.biometricTypes);
  const [submitting, setSubmitting] = useState(false);

  // Generic on purpose — see BiometricLockScreen for why this is a list, not
  // a single preferred type.
  const label = formatBiometricLabel(biometricTypes);
  const icon = BIOMETRIC_ICON[biometricTypes[0] ?? 'none'] as keyof typeof Ionicons.glyphMap;

  const handleEnable = async () => {
    setSubmitting(true);
    try {
      // enableBiometric requires one real successful scan before it persists
      // the preference — a cancelled/failed scan here just leaves it off.
      await dispatch(enableBiometric());
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = () => {
    dispatch(declineBiometricPrompt());
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={40} color={colors.primary} />
        </View>

        <Text style={styles.title}>Enable {label}?</Text>
        <Text style={styles.subtitle}>
          Use {label} for faster sign-in next time. You'll still need your password or OTP
          whenever your session expires.
        </Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleEnable}
          activeOpacity={0.85}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel={`Enable ${label}`}
        >
          <Text style={styles.primaryBtnText}>{submitting ? 'Confirming…' : `Enable ${label}`}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={handleDecline}
          activeOpacity={0.7}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Not now"
        >
          <Text style={styles.secondaryBtnText}>Not Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.extrabold,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  secondaryBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  secondaryBtnText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default BiometricEnrollScreen;
