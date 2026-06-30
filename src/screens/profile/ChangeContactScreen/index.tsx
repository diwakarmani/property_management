import React, { useState, useRef, useCallback } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch } from 'react-redux';
import { colors, typography, spacing } from '@/theme';
import Input from '@/components/common/Input';
import { UserService } from '@/api/services/user.service';
import { fetchUser } from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '@/navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'ChangeContact'>;
  route: RouteProp<ProfileStackParamList, 'ChangeContact'>;
};

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

const OTP_LENGTH = 6;

const ChangeContactScreen: React.FC<Props> = ({ navigation, route }) => {
  const { contactType } = route.params;
  const isPhone = contactType === 'phone';
  const dispatch = useDispatch<AppDispatch>();

  // Step 1 – enter new contact
  const [countryCode, setCountryCode] = useState('+1');
  const [localPhone, setLocalPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [codePickerVisible, setCodePickerVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Step 2 – OTP entry
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [confirmedContact, setConfirmedContact] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  // Loading
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  // Ref guard prevents double-submission when auto-submit and button press race each other
  // before React re-renders with verifying=true (state updates are async).
  const isVerifyingRef = useRef(false);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const getNewContact = (): string => {
    if (isPhone) {
      const digits = localPhone.trim().replace(/\D/g, '');
      return `${countryCode}${digits}`;
    }
    return email.trim().toLowerCase();
  };

  // ── Step 1: send OTP ─────────────────────────────────────────────────────

  const handleSendCode = async () => {
    if (isPhone) {
      const digits = localPhone.trim().replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) {
        setPhoneError('Enter a valid local phone number (7–15 digits)');
        return;
      }
      setPhoneError('');
    } else {
      if (!validateEmail(email.trim())) {
        setEmailError('Enter a valid email address');
        return;
      }
      setEmailError('');
    }

    const newContact = getNewContact();
    setSending(true);
    try {
      if (isPhone) {
        await UserService.initiatePhoneChange(newContact);
      } else {
        await UserService.initiateEmailChange(newContact);
      }
      setConfirmedContact(newContact);
      setStep('verify');
    } catch (err: any) {
      const msg = err?.response?.data?.message || `Failed to send OTP. Please try again.`;
      Alert.alert('Error', msg);
    } finally {
      setSending(false);
    }
  };

  // ── Step 2: verify OTP ───────────────────────────────────────────────────

  const handleOtpChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
    if (next.every(d => d !== '')) {
      handleVerify(next.join(''));
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = useCallback(async (code: string) => {
    if (code.length < OTP_LENGTH) {
      Alert.alert('Incomplete', 'Please enter all 6 digits of the OTP.');
      return;
    }
    if (isVerifyingRef.current) return;
    isVerifyingRef.current = true;
    setVerifying(true);
    try {
      if (isPhone) {
        await UserService.verifyPhoneChange(confirmedContact, code);
      } else {
        await UserService.verifyEmailChange(confirmedContact, code);
      }
      // Refresh the full user profile so ProfileScreen shows new contact immediately
      await dispatch(fetchUser());
      Alert.alert(
        'Success',
        isPhone
          ? 'Your phone number has been updated successfully.'
          : 'Your email address has been updated successfully.',
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Incorrect OTP. Please try again.';
      Alert.alert('Verification Failed', msg);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      isVerifyingRef.current = false;
      setVerifying(false);
    }
  }, [confirmedContact, isPhone, dispatch, navigation]);

  const handleResend = async () => {
    setOtp(['', '', '', '', '', '']);
    setSending(true);
    try {
      if (isPhone) {
        await UserService.initiatePhoneChange(confirmedContact);
      } else {
        await UserService.initiateEmailChange(confirmedContact);
      }
      Alert.alert('Code Sent', 'A new OTP has been sent.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setSending(false);
    }
  };

  // ── Render helpers ───────────────────────────────────────────────────────

  const renderPhoneInput = () => (
    <View style={phoneStyles.wrapper}>
      <Text style={phoneStyles.label}>New Phone Number</Text>
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

  const renderOtpBoxes = () => (
    <View style={styles.otpRow}>
      {otp.map((digit, i) => (
        <TextInput
          key={i}
          ref={ref => { otpRefs.current[i] = ref; }}
          style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
          value={digit}
          onChangeText={text => handleOtpChange(text, i)}
          onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          textAlign="center"
          editable={!verifying}
        />
      ))}
    </View>
  );

  // ── Main render ──────────────────────────────────────────────────────────

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
        <View style={styles.logoCircle}>
          <Ionicons
            name={isPhone ? 'phone-portrait-outline' : 'mail-outline'}
            size={28}
            color={colors.primary}
          />
        </View>
        <Text style={styles.heroTitle}>
          {step === 'input'
            ? `Change ${isPhone ? 'Phone' : 'Email'}`
            : 'Verify Code'}
        </Text>
        <Text style={styles.heroSubtitle}>
          {step === 'input'
            ? `Enter your new ${isPhone ? 'phone number' : 'email address'} to receive a verification code`
            : `Enter the 6-digit code sent to\n${confirmedContact}`}
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {step === 'input' ? (
            <>
              <View style={styles.securityNote}>
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
                <Text style={styles.securityText}>
                  We'll send a one-time code to verify you own this{' '}
                  {isPhone ? 'number' : 'address'}.
                </Text>
              </View>

              {isPhone ? (
                renderPhoneInput()
              ) : (
                <Input
                  label="New Email Address"
                  placeholder="Enter new email address"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setEmailError(''); }}
                  error={emailError}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon="mail-outline"
                />
              )}

              <TouchableOpacity
                style={[styles.primaryBtn, sending && styles.primaryBtnDisabled]}
                onPress={handleSendCode}
                disabled={sending}
                activeOpacity={0.85}
              >
                {sending ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="send-outline" size={18} color={colors.white} />
                    <Text style={styles.primaryBtnText}>Send Verification Code</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backRow}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.backText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.identifierRow}>
                <Ionicons
                  name={isPhone ? 'phone-portrait-outline' : 'mail-outline'}
                  size={15}
                  color={colors.primary}
                />
                <Text style={styles.identifierText} numberOfLines={1}>
                  {confirmedContact}
                </Text>
              </View>

              {renderOtpBoxes()}

              {verifying && (
                <View style={styles.verifyingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.verifyingText}>Verifying…</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.primaryBtn, (verifying || otp.join('').length < OTP_LENGTH) && styles.primaryBtnDisabled]}
                onPress={() => handleVerify(otp.join(''))}
                disabled={verifying || otp.join('').length < OTP_LENGTH}
                activeOpacity={0.85}
              >
                {verifying ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color={colors.white} />
                    <Text style={styles.primaryBtnText}>Verify & Update</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.resendRow}>
                <Text style={styles.resendLabel}>Didn't receive the code? </Text>
                <TouchableOpacity onPress={handleResend} disabled={sending} activeOpacity={0.7}>
                  <Text style={[styles.resendBtn, sending && { opacity: 0.4 }]}>
                    {sending ? 'Sending…' : 'Resend'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.backRow}
                onPress={() => { setStep('input'); setOtp(['', '', '', '', '', '']); }}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.backText}>Change {isPhone ? 'number' : 'address'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Country code picker */}
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
                  onPress={() => { setCountryCode(item.code); setCodePickerVisible(false); }}
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
    paddingTop: 56,
    paddingBottom: 40,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
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
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },

  scroll: { flex: 1, marginTop: -20 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xl },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },

  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.primarySurface,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  securityText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    lineHeight: 18,
  },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 14,
    marginTop: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryBtnDisabled: { opacity: 0.55 },
  primaryBtnText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },

  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: 6,
    paddingVertical: spacing.sm,
  },
  backText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },

  // OTP step
  identifierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySurface,
    borderRadius: 10,
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

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },

  verifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  verifyingText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },

  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  resendLabel: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  resendBtn: {
    fontSize: typography.fontSize.sm,
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

export default ChangeContactScreen;
