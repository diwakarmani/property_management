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
import { useDispatch } from 'react-redux';
import { login, sendOtp, clearError } from '@/store/slices/authSlice';
import { loginSchema, otpEmailSchema } from '@/utils/validation/authValidation';
import { colors, typography, spacing } from '@/theme';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import type { AppDispatch } from '@/store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;
interface Props { navigation: LoginScreenNavigationProp; }

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

type LoginMode = 'otp' | 'password';
type OtpInputMode = 'phone' | 'email';

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  // Default: OTP mode with phone selected
  const [loginMode, setLoginMode] = useState<LoginMode>('otp');
  const [otpInputMode, setOtpInputMode] = useState<OtpInputMode>('phone');
  const [countryCode, setCountryCode] = useState('+1');
  const [codePickerVisible, setCodePickerVisible] = useState(false);
  const [localPhone, setLocalPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const dispatch = useDispatch<AppDispatch>();
  // Local submitting flag so the LoginScreen button is not frozen by a sendOtp
  // dispatch that originated from the OTPVerificationScreen resend action, which
  // would otherwise set the shared Redux loading flag to true on this screen too.
  const [submitting, setSubmitting] = useState(false);

  // Separate form per mode — avoids dynamic-resolver issues with RHF
  const passwordForm = useForm<{ identifier: string; password: string }>({
    resolver: yupResolver(loginSchema),
  });
  const emailOtpForm = useForm<{ identifier: string }>({
    resolver: yupResolver(otpEmailSchema),
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handlePhoneOtpSubmit = async () => {
    const digits = localPhone.trim().replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) {
      setPhoneError('Enter a valid phone number (7–15 digits)');
      return;
    }
    setPhoneError('');
    dispatch(clearError());
    setSubmitting(true);
    try {
      const identifier = `${countryCode}${digits}`;
      const result = await dispatch(sendOtp({ identifier }));
      if (sendOtp.fulfilled.match(result)) {
        navigation.navigate('OTPVerification', { identifier });
      } else {
        Alert.alert('Error', (result.payload as string) || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailOtpSubmit = async (data: { identifier: string }) => {
    dispatch(clearError());
    const identifier = data.identifier.trim().toLowerCase();
    setSubmitting(true);
    try {
      const result = await dispatch(sendOtp({ identifier }));
      if (sendOtp.fulfilled.match(result)) {
        navigation.navigate('OTPVerification', { identifier });
      } else {
        Alert.alert('Error', (result.payload as string) || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (data: { identifier: string; password: string }) => {
    dispatch(clearError());
    setSubmitting(true);
    try {
      const result = await dispatch(login(data));
      if (!login.fulfilled.match(result)) {
        Alert.alert('Login Failed', (result.payload as string) || 'Please check your credentials and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Mode switches ───────────────────────────────────────────────────────────

  const switchToOtp = () => {
    dispatch(clearError());
    passwordForm.reset();
    setLoginMode('otp');
    setOtpInputMode('phone');
    setLocalPhone('');
    setPhoneError('');
  };

  const switchToPassword = () => {
    dispatch(clearError());
    emailOtpForm.reset({ identifier: '' });
    setLocalPhone('');
    setPhoneError('');
    setLoginMode('password');
  };

  const switchOtpSubMode = (mode: OtpInputMode) => {
    if (mode === otpInputMode) return;
    setOtpInputMode(mode);
    setLocalPhone('');
    setPhoneError('');
    emailOtpForm.reset({ identifier: '' });
    dispatch(clearError());
  };

  // ─── Render helpers ──────────────────────────────────────────────────────────

  const renderOtpToggle = () => (
    <View style={styles.segment}>
      <TouchableOpacity
        style={[styles.segBtn, otpInputMode === 'phone' && styles.segBtnActive]}
        onPress={() => switchOtpSubMode('phone')}
        activeOpacity={0.8}
      >
        <Ionicons
          name="phone-portrait-outline"
          size={14}
          color={otpInputMode === 'phone' ? colors.white : colors.textSecondary}
        />
        <Text style={[styles.segText, otpInputMode === 'phone' && styles.segTextActive]}>
          Phone
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.segBtn, otpInputMode === 'email' && styles.segBtnActive]}
        onPress={() => switchOtpSubMode('email')}
        activeOpacity={0.8}
      >
        <Ionicons
          name="mail-outline"
          size={14}
          color={otpInputMode === 'email' ? colors.white : colors.textSecondary}
        />
        <Text style={[styles.segText, otpInputMode === 'email' && styles.segTextActive]}>
          Email
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPhoneInput = () => (
    <View style={phoneStyles.wrapper}>
      <Text style={phoneStyles.label}>Phone Number</Text>
      <View style={[phoneStyles.row, !!phoneError && phoneStyles.rowError]}>
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
        <TextInput
          style={phoneStyles.input}
          placeholder="Enter local number"
          placeholderTextColor={colors.textLight}
          value={localPhone}
          onChangeText={(t) => { setLocalPhone(t); setPhoneError(''); }}
          keyboardType="phone-pad"
        />
      </View>
      {!!phoneError && <Text style={phoneStyles.errorText}>{phoneError}</Text>}
    </View>
  );

  const renderEmailOtpInput = () => (
    <Controller
      control={emailOtpForm.control}
      name="identifier"
      render={({ field: { onChange, value } }) => (
        <Input
          label="Email Address"
          placeholder="Enter your email address"
          value={value}
          onChangeText={onChange}
          error={emailOtpForm.formState.errors.identifier?.message}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon="mail-outline"
        />
      )}
    />
  );

  const renderOtpForm = () => (
    <>
      {renderOtpToggle()}

      {otpInputMode === 'phone' ? renderPhoneInput() : renderEmailOtpInput()}

      <View style={styles.hint}>
        <Ionicons name="information-circle" size={16} color={colors.primary} />
        <Text style={styles.hintText}>
          We'll send a 6-digit code to your {otpInputMode === 'phone' ? 'phone' : 'email'}.
        </Text>
      </View>

      <Button
        onPress={
          otpInputMode === 'phone'
            ? handlePhoneOtpSubmit
            : emailOtpForm.handleSubmit(handleEmailOtpSubmit)
        }
        loading={submitting}
        style={styles.actionBtn}
      >
        Continue with OTP
      </Button>

      <TouchableOpacity style={styles.modeSwitch} onPress={switchToPassword} activeOpacity={0.8}>
        <Ionicons name="lock-closed-outline" size={15} color={colors.primary} />
        <Text style={styles.modeSwitchText}>Login with password instead</Text>
      </TouchableOpacity>
    </>
  );

  const renderPasswordForm = () => (
    <>
      <Controller
        control={passwordForm.control}
        name="identifier"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Email or Phone"
            placeholder="Enter your email or phone number"
            value={value}
            onChangeText={onChange}
            error={passwordForm.formState.errors.identifier?.message}
            keyboardType="default"
            autoCapitalize="none"
            leftIcon="person-outline"
          />
        )}
      />
      <Controller
        control={passwordForm.control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Password"
            placeholder="Enter your password"
            value={value}
            onChangeText={onChange}
            error={passwordForm.formState.errors.password?.message}
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

      <Button
        onPress={passwordForm.handleSubmit(handlePasswordSubmit)}
        loading={submitting}
        style={styles.actionBtn}
      >
        Sign In
      </Button>

      <TouchableOpacity style={styles.modeSwitch} onPress={switchToOtp} activeOpacity={0.8}>
        <Ionicons name="phone-portrait-outline" size={15} color={colors.primary} />
        <Text style={styles.modeSwitchText}>Use OTP instead</Text>
      </TouchableOpacity>
    </>
  );

  // ─── Main render ─────────────────────────────────────────────────────────────

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
            {loginMode === 'otp' ? renderOtpForm() : renderPasswordForm()}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Country code picker bottom sheet */}
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

  form: { gap: 0 },

  // Phone / Email segmented control
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 3,
    marginBottom: spacing.md,
  },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  segBtnActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  segText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  segTextActive: {
    color: colors.white,
  },

  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.primarySurface,
    borderRadius: 10,
    padding: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  hintText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    lineHeight: 18,
  },

  actionBtn: { marginTop: spacing.xs },

  modeSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    gap: 6,
  },
  modeSwitchText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },

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

export default LoginScreen;
