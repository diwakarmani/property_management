import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('otp');
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<any>({
    resolver: yupResolver(loginMode === 'password' ? loginSchema : otpSchema),
  });

  const onSubmit = async (data: any) => {
    dispatch(clearError());
    if (loginMode === 'password') {
      const result = await dispatch(login(data));
      if (!login.fulfilled.match(result)) {
        Alert.alert('Login Failed', error || 'Please check your credentials and try again.');
      }
    } else {
      const result = await dispatch(sendOtp({ identifier: data.identifier }));
      if (sendOtp.fulfilled.match(result)) {
        navigation.navigate('OTPVerification', { identifier: data.identifier });
      } else {
        Alert.alert('Error', (result.payload as string) || 'Failed to send OTP. Please try again.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >

      <LinearGradient
        colors={[colors.primary, colors.gradientMid, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Ionicons name="home" size={32} color={colors.primary} />
          </View>
        </View>
        <Text style={styles.heroTitle}>Welcome Back!</Text>
        <Text style={styles.heroSubtitle}>Sign in to find your perfect home</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.form}>
            <Controller
              control={control}
              name="identifier"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email or Phone"
                  placeholder="Enter your email or phone"
                  value={value}
                  onChangeText={onChange}
                  error={errors.identifier?.message as string | undefined}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon="person-outline"
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
                      placeholder="Enter your password"
                      value={value}
                      onChangeText={onChange}
                      error={errors.password?.message as string | undefined}
                      secureTextEntry
                      leftIcon="lock-closed-outline"
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

            {loginMode === 'otp' && (
              <View style={styles.otpHint}>
                <Ionicons name="information-circle" size={16} color={colors.primary} />
                <Text style={styles.otpHintText}>
                  We'll send a one-time code to your email or phone.
                </Text>
              </View>
            )}

            <Button
              onPress={handleSubmit(onSubmit)}
              style={styles.loginButton}
            >
              {loginMode === 'password' ? 'Sign In' : 'Continue with OTP'}
            </Button>

            <TouchableOpacity
              style={styles.secondaryLogin}
              onPress={() => {
                dispatch(clearError());
                reset();
                setLoginMode(loginMode === 'password' ? 'otp' : 'password');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={loginMode === 'password' ? 'phone-portrait-outline' : 'lock-closed-outline'}
                size={15}
                color={colors.primary}
              />
              <Text style={styles.secondaryLoginText}>
                {loginMode === 'password' ? 'Use OTP instead' : 'Login with password'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  logoWrap: { marginBottom: spacing.md },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  heroTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.md,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    textAlign: 'center',
  },

  scroll: { flex: 1, marginTop: -24 },
  scrollContent: { paddingBottom: spacing.xl },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },

  secondaryLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    gap: 6,
  },
  secondaryLoginText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },

  form: { gap: 0 },

  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },

  otpHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.primarySurface,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  otpHintText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    lineHeight: 18,
  },

  loginButton: { marginTop: spacing.xs },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerText: { fontSize: typography.fontSize.md, color: colors.textSecondary },
  signupText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
});

export default LoginScreen;
