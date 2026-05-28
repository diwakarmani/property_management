import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { AuthService } from '@/api/services/auth.service';

type Status = 'loading' | 'success' | 'error';

const VerifyEmailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { token } = (route.params ?? {}) as { token?: string };
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification link is invalid or expired.');
      return;
    }
    AuthService.verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      })
      .catch(err => {
        setStatus('error');
        const msg =
          err?.response?.data?.message ?? 'Verification failed. The link may have expired.';
        setMessage(msg);
      });
  }, [token]);

  const isSuccess = status === 'success';
  const isError = status === 'error';
  const gradientColors: [string, string, string] = isSuccess
    ? [colors.success, '#27AE60', '#2ECC71']
    : isError
    ? [colors.error, '#C0392B', '#E74C3C']
    : [colors.primary, colors.gradientMid, colors.gradientEnd];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.iconCircle}>
          {status === 'loading' ? (
            <ActivityIndicator size="large" color={isSuccess ? colors.success : isError ? colors.error : colors.primary} />
          ) : isSuccess ? (
            <Ionicons name="checkmark-circle" size={44} color={colors.success} />
          ) : (
            <Ionicons name="close-circle" size={44} color={colors.error} />
          )}
        </View>
        <Text style={styles.heroTitle}>
          {status === 'loading'
            ? 'Verifying…'
            : isSuccess
            ? 'Email Verified!'
            : 'Verification Failed'}
        </Text>
        <Text style={styles.heroSubtitle}>
          {status === 'loading'
            ? 'Please wait while we verify your email address'
            : message}
        </Text>
      </LinearGradient>

      <View style={styles.card}>
        {status === 'loading' ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Verifying your email address...</Text>
          </View>
        ) : (
          <>
            <View style={[styles.resultBox, isSuccess ? styles.successBox : styles.errorBox]}>
              <Ionicons
                name={isSuccess ? 'mail-open-outline' : 'alert-circle-outline'}
                size={20}
                color={isSuccess ? colors.success : colors.error}
              />
              <Text style={[styles.resultText, isSuccess ? styles.successText : styles.errorText]}>
                {message}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginBtnText}>
                {isSuccess ? 'Continue to Login' : 'Back to Login'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: {
    paddingTop: 80,
    paddingBottom: 50,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  heroTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.white,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    marginHorizontal: spacing.md,
    marginTop: -24,
    padding: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    gap: spacing.lg,
  },
  loadingBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
  },
  successBox: { backgroundColor: colors.successSurface, borderColor: '#C6F6D5' },
  errorBox: { backgroundColor: colors.errorSurface, borderColor: '#FED7D7' },
  resultText: { flex: 1, fontSize: typography.fontSize.sm, lineHeight: 20 },
  successText: { color: colors.success },
  errorText: { color: colors.error },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  loginBtnText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});

export default VerifyEmailScreen;
