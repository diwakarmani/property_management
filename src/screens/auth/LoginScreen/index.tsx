import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  StatusBar,
  Platform,
} from 'react-native';
import { PhoneOutline } from '@solar-icons/react-native';
import { LockLinear } from '@solar-icons/react-native';
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
import reactotron from 'ReactotronConfig.js';
import { SafeAreaView } from 'react-native-safe-area-context';
import {LinearGradient} from 'expo-linear-gradient';
import GradientHeader from '@/components/common/GradientHeader';
import { Ionicons } from '@expo/vector-icons';
type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Login'
>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [loginMode, setLoginMode] = useState<'phone' | 'email'>('phone');
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  type FormData = {
    identifier: string;
    password?: string;
  };
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(loginMode === 'phone' ? loginSchema : otpSchema),
  });

  const onSubmit = async (data: any) => {
    dispatch(clearError());
    
    if (loginMode === 'phone') {
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
     <View style={styles.safeArea}>
      
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
        {/* Header Gradient Section */}
        <GradientHeader title="Welcome Back" subtitle="Sign in to continue" />
<View style={styles.card}>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            loginMode === 'phone' && styles.toggleButtonActive,
          ]}
          onPress={() => setLoginMode('phone')}
        >
          <Text
            style={[
              styles.toggleText,
              loginMode === 'phone' && styles.toggleTextActive,
            ]}
          >
            Phone
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            loginMode === 'email' && styles.toggleButtonActive,
          ]}
          onPress={() => setLoginMode('email')}
        >
          <Text
            style={[
              styles.toggleText,
              loginMode === 'email' && styles.toggleTextActive,
            ]}
          >
            Email
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="identifier"
          
          render={({ field: { onChange, value } }) => (
            <>
            
            <Input
              label="Phone Number"
              placeholder="+91 1234567890"
              icon={
              <PhoneOutline  size={20}  color={colors.textSecondary} />

              }
              maxLength={10}
              value={value}
              onChangeText={onChange}
              error={errors.identifier?.message}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
            </>
          )}
        />

        {loginMode === 'phone' && (
          <>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Password"
                  placeholder="********"
                  value={value}
                  onChangeText={onChange}
                  error={errors.password?.message}
                  secureTextEntry
                  icon={<LockLinear  size={20}  color={colors.textSecondary} />}
                />
              )}
            />
<View style={styles.secondaryActionsContainer}>
   <TouchableOpacity
              onPress={() => console.log('Login with OTP Clicked')}
              style={styles.forgotPassword}
            >
              <Text style={[styles.forgotPasswordText, {color:colors.linkText}]}>Login with OTP</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
            </View>
          </>
        )}

        <Button
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={styles.loginButton}
        >
          {loginMode === 'phone' ? 'Sign In' : 'Send OTP'}
        </Button>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signupText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
      </View>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 0,
  },
  header: {
    backgroundColor: colors.primary,
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
    backgroundColor: colors.gray,
    borderRadius: 8,
    padding: 4,
    marginHorizontal: spacing.lg,
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
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  toggleTextActive: {
    color: colors.text,
  },
  form: {
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  loginButton: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  signupText: {
    fontSize: typography.fontSize.sm,
    color: colors.linkText,
    fontWeight: typography.fontWeight.bold,
  },
   safeArea: {
    flex: 1,
    backgroundColor: '#F4F4F8',
  },
  card:{
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    paddingVertical: spacing.md,
    marginTop: -40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  secondaryActionsContainer:{
    flexDirection: 'row',
    justifyContent: 'space-between',
     marginBottom: spacing.lg,
  }
  
});

export default LoginScreen;
