import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { verifyOtp, sendOtp, clearError } from '@/store/slices/authSlice';
import { colors, typography, spacing } from '@/theme';
import Button from '@/components/common/Button';
import OTPInput from '@/components/forms/OTPInput';
import type { AppDispatch, RootState } from '@/store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '@/navigation/types';

type OTPScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OTPVerification'>;
type OTPScreenRouteProp = RouteProp<AuthStackParamList, 'OTPVerification'>;

interface Props {
  navigation: OTPScreenNavigationProp;
  route: OTPScreenRouteProp;
}

const OTPVerificationScreen: React.FC<Props> = ({ route }) => {
  const { identifier } = route.params;
  const [timer, setTimer] = useState(60);
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOTPComplete = async (otp: string) => {
    dispatch(clearError());
    const result = await dispatch(verifyOtp({ identifier, otpCode: otp }));
    if (!verifyOtp.fulfilled.match(result)) {
      Alert.alert('Invalid Code', (result.payload as string) || 'The OTP entered is incorrect. Please try again.');
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    const result = await dispatch(sendOtp({ identifier }));
    if (sendOtp.fulfilled.match(result)) {
      setTimer(60);
      Alert.alert('Code Sent', 'A new OTP has been sent successfully.');
    } else {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.primary, colors.gradientMid, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.logoCircle}>
          <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
        </View>
        <Text style={styles.heroTitle}>Verify Code</Text>
        <Text style={styles.heroSubtitle}>Enter the 6-digit code sent to your device</Text>
      </LinearGradient>

      <View style={styles.card}>
        <View style={styles.identifierRow}>
          <Ionicons name="mail-outline" size={16} color={colors.primary} />
          <Text style={styles.identifierText} numberOfLines={1}>{identifier}</Text>
        </View>

        <View style={styles.otpContainer}>
          <OTPInput onComplete={handleOTPComplete} />
        </View>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
            <Text style={[styles.resendButton, timer > 0 && styles.resendDisabled]}>
              {timer > 0 ? `Resend in ${timer}s` : 'Resend'}
            </Text>
          </TouchableOpacity>
        </View>

        {timer > 0 && (
          <View style={styles.timerBar}>
            <View style={[styles.timerProgress, { width: `${(timer / 60) * 100}%` }]} />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  hero: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  heroTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.white,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    textAlign: 'center',
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
  },
  identifierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySurface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  identifierText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  otpContainer: {
    marginVertical: spacing.md,
  },
  verifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  verifyingText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  resendText: { fontSize: typography.fontSize.md, color: colors.textSecondary },
  resendButton: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  resendDisabled: { color: colors.textLight },
  timerBar: {
    height: 3,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  timerProgress: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
});

export default OTPVerificationScreen;
