import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { colors, typography, spacing } from '@/theme';
import { bootstrapSession } from '@/store/slices/authSlice';
import type { AppDispatch, RootState } from '@/store';

const BootScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const bootstrapFailed = useSelector((s: RootState) => s.auth.bootstrapFailed);

  return (
    <LinearGradient
      colors={[colors.primary, colors.gradientMid, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.logoCircle}>
        <Ionicons name="home" size={40} color={colors.primary} />
      </View>
      <Text style={styles.logoText}>PropertyApp</Text>
      <Text style={styles.tagline}>Find your dream home</Text>

      <View style={styles.block}>
        {bootstrapFailed ? (
          <>
            <View style={styles.errorIconWrap}>
              <Ionicons name="cloud-offline-outline" size={36} color={colors.white} />
            </View>
            <Text style={styles.message}>
              Couldn't reach the server. It may be waking up — please try again.
            </Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => dispatch(bootstrapSession())}
              accessibilityRole="button"
              accessibilityLabel="Retry connecting"
            >
              <Ionicons name="refresh-outline" size={18} color={colors.primary} />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={colors.white} />
            <Text style={styles.message}>Restoring your session…</Text>
          </>
        )}
      </View>
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
  logoCircle: {
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
  },
  logoText: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.white,
    marginTop: spacing.lg,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: typography.fontSize.md,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  block: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: typography.fontSize.md,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 14,
    marginTop: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  retryText: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});

export default BootScreen;
