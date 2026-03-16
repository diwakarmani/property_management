import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { verifyOtp, sendOtp, clearError } from '@/store/slices/authSlice';
import { colors, typography, spacing } from '@/theme';
import Button from '@/components/common/Button';
import OTPInput from '@/components/forms/OTPInput';
import type { AppDispatch, RootState } from '@/store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '@/navigation/types';

type OTPScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'OTPVerification'
>;

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
      Alert.alert('Error', error || 'Invalid OTP');
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    
    const result = await dispatch(sendOtp({ identifier }));
    if (sendOtp.fulfilled.match(result)) {
      setTimer(60);
      Alert.alert('Success', 'OTP resent successfully');
    } else {
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.identifier}>{identifier}</Text>
        </Text>
      </View>

      <View style={styles.otpContainer}>
        <OTPInput onComplete={handleOTPComplete} />
      </View>

      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't receive the code? </Text>
        <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
          <Text style={[styles.resendButton, timer > 0 && styles.resendDisabled]}>
            Resend {timer > 0 && `(${timer}s)`}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Verifying...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: {
    marginTop: spacing['2xl'],
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  identifier: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  otpContainer: {
    marginVertical: spacing.xl,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  resendText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  resendButton: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  resendDisabled: {
    color: colors.textSecondary,
  },
  loadingContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
  },
});

export default OTPVerificationScreen;