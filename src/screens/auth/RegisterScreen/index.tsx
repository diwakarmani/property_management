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
  TextInput,
  Modal,
  FlatList,
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

const COUNTRY_CODES = [
  { code: '+1',   flag: '🇺🇸', label: 'USA / Canada' },
  { code: '+44',  flag: '🇬🇧', label: 'United Kingdom' },
  { code: '+61',  flag: '🇦🇺', label: 'Australia' },
  { code: '+91',  flag: '🇮🇳', label: 'India' },
  { code: '+971', flag: '🇦🇪', label: 'UAE' },
  { code: '+65',  flag: '🇸🇬', label: 'Singapore' },
  { code: '+49',  flag: '🇩🇪', label: 'Germany' },
  { code: '+33',  flag: '🇫🇷', label: 'France' },
];

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const [countryCode, setCountryCode] = useState('+1');
  const [codePickerVisible, setCodePickerVisible] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(registerSchema),
  });

  const onSubmit = async (data: any) => {
    dispatch(clearError());
    const localPhone = data.phone.trim().replace(/^0+/, ''); // strip leading zeros
    const payload = {
      ...data,
      email: data.email.trim().toLowerCase(),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: `${countryCode}${localPhone}`,
    };
    const result = await dispatch(registerUser(payload));
    if (registerUser.fulfilled.match(result)) {
      Alert.alert(
        'Registration Successful',
        'Please check your email to verify your account, then log in.',
        [{ text: 'Go to Login', onPress: () => navigation.navigate('Login') }]
      );
    } else {
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

            {/* Phone with country code picker */}
            <View style={phoneStyles.wrapper}>
              <Text style={phoneStyles.label}>Phone Number</Text>
              <View style={[phoneStyles.row, !!errors.phone && phoneStyles.rowError]}>
                <TouchableOpacity
                  style={phoneStyles.codeBtn}
                  onPress={() => setCodePickerVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={phoneStyles.codeText}>
                    {COUNTRY_CODES.find(c => c.code === countryCode)?.flag ?? '🇺🇸'} {countryCode}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={colors.textSecondary} />
                </TouchableOpacity>
                <View style={phoneStyles.divider} />
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={phoneStyles.input}
                      placeholder="(555) 000-0000"
                      placeholderTextColor={colors.textLight}
                      value={value}
                      onChangeText={onChange}
                      keyboardType="phone-pad"
                    />
                  )}
                />
              </View>
              {!!errors.phone && (
                <Text style={phoneStyles.errorText}>{errors.phone.message}</Text>
              )}
            </View>

            {/* Country code picker modal */}
            <Modal
              visible={codePickerVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setCodePickerVisible(false)}
            >
              <TouchableOpacity
                style={phoneStyles.modalBackdrop}
                activeOpacity={1}
                onPress={() => setCodePickerVisible(false)}
              >
                <View style={phoneStyles.pickerSheet}>
                  <Text style={phoneStyles.pickerTitle}>Select Country Code</Text>
                  <FlatList
                    data={COUNTRY_CODES}
                    keyExtractor={item => item.code}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          phoneStyles.codeOption,
                          item.code === countryCode && phoneStyles.codeOptionSelected,
                        ]}
                        onPress={() => {
                          setCountryCode(item.code);
                          setCodePickerVisible(false);
                        }}
                      >
                        <Text style={phoneStyles.codeOptionText}>
                          {item.flag}  {item.code}  {item.label}
                        </Text>
                        {item.code === countryCode && (
                          <Ionicons name="checkmark" size={16} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </TouchableOpacity>
            </Modal>

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

const phoneStyles = StyleSheet.create({
  wrapper: { marginBottom: spacing.sm },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  rowError: { borderColor: colors.error },
  codeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 14,
    backgroundColor: colors.backgroundSecondary,
  },
  codeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  divider: { width: 1, height: 24, backgroundColor: colors.border },
  input: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 14,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: 4,
    marginLeft: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.md,
    paddingBottom: 36,
    maxHeight: 420,
  },
  pickerTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  codeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  codeOptionSelected: { backgroundColor: colors.primarySurface },
  codeOptionText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
});

export default RegisterScreen;
