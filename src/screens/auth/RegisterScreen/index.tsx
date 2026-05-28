import React from 'react';
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
import { register as registerUser, clearError } from '@/store/slices/authSlice';
import { registerSchema } from '@/utils/validation/authValidation';
import { colors, typography, spacing } from '@/theme';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import type { AppDispatch, RootState } from '@/store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(registerSchema),
  });

  const onSubmit = async (data: any) => {
    dispatch(clearError());
    const payload = {
      ...data,
      email: data.email.trim().toLowerCase(),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone?.trim() || undefined,
    };
    const result = await dispatch(registerUser(payload));
    if (!registerUser.fulfilled.match(result)) {
      Alert.alert('Registration Failed', (result.payload as string) || error || 'Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Gradient Hero */}
      <LinearGradient
        colors={[colors.primaryDark, colors.primary, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Ionicons name="person-add" size={28} color={colors.primary} />
          </View>
        </View>
        <Text style={styles.heroTitle}>Create Account</Text>
        <Text style={styles.heroSubtitle}>Join thousands finding their dream home</Text>
      </LinearGradient>

      {/* Form Card */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your details</Text>
          <Text style={styles.cardSubtitle}>Fill in the information below to get started</Text>

          <View style={styles.form}>
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="First Name"
                      placeholder="First name"
                      value={value}
                      onChangeText={onChange}
                      error={errors.firstName?.message}
                      leftIcon="person-outline"
                    />
                  )}
                />
              </View>
              <View style={styles.nameField}>
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Last Name"
                      placeholder="Last name"
                      value={value}
                      onChangeText={onChange}
                      error={errors.lastName?.message}
                    />
                  )}
                />
              </View>
            </View>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email Address"
                  placeholder="Enter your email"
                  value={value}
                  onChangeText={onChange}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon="mail-outline"
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Phone Number (Optional)"
                  placeholder="Enter phone number"
                  value={value}
                  onChangeText={onChange}
                  error={errors.phone?.message}
                  keyboardType="phone-pad"
                  leftIcon="call-outline"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Password"
                  placeholder="Create a strong password"
                  value={value}
                  onChangeText={onChange}
                  error={errors.password?.message}
                  secureTextEntry
                  leftIcon="lock-closed-outline"
                  hint="Minimum 8 characters"
                />
              )}
            />
          </View>

          <View style={styles.termsRow}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.success} />
            <Text style={styles.termsText}>
              By signing up, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>

          <Button
            onPress={handleSubmit(onSubmit)}
            style={styles.registerButton}
          >
            Create Account
          </Button>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Sign In</Text>
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
    paddingTop: 50,
    paddingBottom: 36,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  logoWrap: { marginBottom: spacing.md },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
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
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    textAlign: 'center',
  },

  scroll: { flex: 1, marginTop: -20 },
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
  cardTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },

  form: { gap: 0 },

  nameRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  nameField: { flex: 1 },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.successSurface,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  termsText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },

  registerButton: { marginTop: spacing.xs },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerText: { fontSize: typography.fontSize.md, color: colors.textSecondary },
  loginText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
});

export default RegisterScreen;
