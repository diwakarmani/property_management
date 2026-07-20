import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { colors, typography, spacing } from '@/theme';
import { unlockWithBiometrics, logout } from '@/store/slices/authSlice';
import { BIOMETRIC_ICON, formatBiometricLabel, getFriendlyBiometricError } from '@/utils/biometric/biometricService';
import type { AppDispatch, RootState } from '@/store';

const BiometricLockScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { biometricTypes, biometricError, user } = useSelector((s: RootState) => s.auth);
  const [attempted, setAttempted] = useState(false);

  // Generic on purpose: joins every enrolled method (e.g. "Face Unlock or
  // Fingerprint" on an Android device with both) rather than picking one —
  // on iOS this is always exactly one, since no iPhone has both.
  const label = formatBiometricLabel(biometricTypes);
  const icon = BIOMETRIC_ICON[biometricTypes[0] ?? 'none'] as keyof typeof Ionicons.glyphMap;
  const friendlyError = attempted ? getFriendlyBiometricError(biometricError ?? undefined) : null;

  const promptUnlock = useCallback(() => {
    setAttempted(true);
    dispatch(unlockWithBiometrics());
  }, [dispatch]);

  // Auto-prompt exactly once per screen mount — no retry loop, so we never
  // escalate into iOS's own hard biometric lockout.
  useEffect(() => {
    promptUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOutInstead = () => {
    dispatch(logout());
  };

  return (
    <LinearGradient
      colors={[colors.primary, colors.gradientMid, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={44} color={colors.primary} />
      </View>

      <Text style={styles.title}>Welcome back{user?.firstName ? `, ${user.firstName}` : ''}</Text>
      <Text style={styles.subtitle}>Use {label} to unlock PropertyApp</Text>

      {friendlyError ? (
        <Text style={styles.errorText}>{friendlyError}</Text>
      ) : null}

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={promptUnlock}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Try biometric unlock again"
      >
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text style={styles.primaryBtnText}>Try Again</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={handleSignOutInstead}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Sign in another way"
      >
        <Text style={styles.secondaryBtnText}>Sign in another way</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    marginBottom: spacing.lg,
    textAlign: 'center',
    maxWidth: 280,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 14,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  secondaryBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  secondaryBtnText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    textDecorationLine: 'underline',
  },
});

export default BiometricLockScreen;
