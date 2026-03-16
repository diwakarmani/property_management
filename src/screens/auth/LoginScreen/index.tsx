import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useDispatch, useSelector } from 'react-redux';
import { login, sendOtp, clearError } from '@/store/slices/authSlice';
import { loginSchema, otpSchema } from '@/utils/validation/authValidation';
import { colors, typography, spacing } from '@/theme';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import type { AppDispatch, RootState } from '@/store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Login'
>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  type FormData = {
    identifier: string;
    password?: string;
  };

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(loginMode === 'password' ? loginSchema : otpSchema),
  });

  const onSubmit = async (data: any) => {
    dispatch(clearError());
    
    if (loginMode === 'password') {
      const result = await dispatch(login(data));
      if (login.fulfilled.match(result)) {
        // Navigation will be handled by App.tsx based on auth state
      } else {
        Alert.alert('Error', error || 'Login failed');
      }
    } else {
      const result = await dispatch(sendOtp({ identifier: data.identifier }));
      if (sendOtp.fulfilled.match(result)) {
        navigation.navigate('OTPVerification', { identifier: data.identifier });
      } else {
        Alert.alert('Error', error || 'Failed to send OTP');
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            loginMode === 'password' && styles.toggleButtonActive,
          ]}
          onPress={() => setLoginMode('password')}
        >
          <Text
            style={[
              styles.toggleText,
              loginMode === 'password' && styles.toggleTextActive,
            ]}
          >
            Password
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            loginMode === 'otp' && styles.toggleButtonActive,
          ]}
          onPress={() => setLoginMode('otp')}
        >
          <Text
            style={[
              styles.toggleText,
              loginMode === 'otp' && styles.toggleTextActive,
            ]}
          >
            OTP
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="identifier"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Email or Phone"
              placeholder="Enter email or phone number"
              value={value}
              onChangeText={onChange}
              error={errors.identifier?.message}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
        />

        {loginMode === 'password' && (
          <>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Password"
                  placeholder="Enter password"
                  value={value}
                  onChangeText={onChange}
                  error={errors.password?.message}
                  secureTextEntry
                />
              )}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </>
        )}

        <Button
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={styles.loginButton}
        >
          {loginMode === 'password' ? 'Login' : 'Send OTP'}
        </Button>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signupText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
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
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 4,
    marginBottom: spacing.lg,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: colors.white,
  },
  toggleText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  toggleTextActive: {
    color: colors.primary,
  },
  form: {
    marginTop: spacing.md,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  loginButton: {
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  signupText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
});

export default LoginScreen;