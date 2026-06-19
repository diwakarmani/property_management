import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { colors, typography, spacing } from '@/theme';
import { InquiryService } from '@/api/services/inquiry.service';
import type { RootState } from '@/store';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const ContactAgentScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { propertyId, propertyTitle } = (route.params as any) ?? {};
  const user = useSelector((s: RootState) => s.auth.user);

  const [name, setName] = useState(
    user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : ''
  );
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [message, setMessage] = useState(
    propertyTitle
      ? `Hi, I'm interested in "${propertyTitle}". Please share more details.`
      : ''
  );
  const [touched, setTouched] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const errors = {
    name: !name.trim() ? 'Name is required' : '',
    email: !EMAIL_RE.test(email.trim()) ? 'A valid email is required' : '',
    message: message.trim().length < 5 ? 'Please write a short message' : '',
  };
  const isValid = !errors.name && !errors.email && !errors.message;

  const submit = async () => {
    setTouched(true);
    if (!isValid) return;
    if (!propertyId) return;
    try {
      await InquiryService.create({
        propertyId,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        message: message.trim(),
      });
      navigation.goBack();
    } catch {
      // global interceptor shows error toast
    }
  };

  const inputStyle = (field: string, hasError: boolean) => [
    styles.input,
    focusedField === field && styles.inputFocused,
    touched && hasError && styles.inputError,
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Agent</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Property badge */}
          {!!propertyTitle && (
            <View style={styles.propertyBadge}>
              <Ionicons name="home-outline" size={16} color={colors.primary} />
              <Text style={styles.propertyTitle} numberOfLines={2}>{propertyTitle}</Text>
            </View>
          )}

          {/* Info box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={colors.info} />
            <Text style={styles.infoText}>
              Your inquiry will be sent directly to the listing agent. They typically respond within 24 hours.
            </Text>
          </View>

          {/* Name */}
          <Text style={styles.label}>Your Name *</Text>
          <View style={inputStyle('name', !!errors.name)}>
            <Ionicons name="person-outline" size={18} color={focusedField === 'name' ? colors.primary : colors.textLight} />
            <TextInput
              style={styles.inputText}
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={colors.textLight}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
            />
          </View>
          {touched && !!errors.name && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
              <Text style={styles.errorText}>{errors.name}</Text>
            </View>
          )}

          {/* Email */}
          <Text style={styles.label}>Email *</Text>
          <View style={inputStyle('email', !!errors.email)}>
            <Ionicons name="mail-outline" size={18} color={focusedField === 'email' ? colors.primary : colors.textLight} />
            <TextInput
              style={styles.inputText}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />
          </View>
          {touched && !!errors.email && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
              <Text style={styles.errorText}>{errors.email}</Text>
            </View>
          )}

          {/* Phone */}
          <Text style={styles.label}>Phone <Text style={styles.optional}>(optional)</Text></Text>
          <View style={inputStyle('phone', false)}>
            <Ionicons name="call-outline" size={18} color={focusedField === 'phone' ? colors.primary : colors.textLight} />
            <TextInput
              style={styles.inputText}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor={colors.textLight}
              keyboardType="phone-pad"
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {/* Message */}
          <Text style={styles.label}>Message *</Text>
          <View style={[inputStyle('message', !!errors.message), styles.textAreaWrap]}>
            <TextInput
              style={styles.textArea}
              value={message}
              onChangeText={setMessage}
              placeholder="Write your message…"
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              onFocus={() => setFocusedField('message')}
              onBlur={() => setFocusedField(null)}
            />
          </View>
          {touched && !!errors.message && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
              <Text style={styles.errorText}>{errors.message}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
            onPress={submit}
            disabled={!isValid}
            accessibilityRole="button"
            accessibilityLabel="Send inquiry"
          >
            <Ionicons name="send" size={18} color={colors.white} />
            <Text style={styles.submitBtnText}>Send Inquiry</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 38,
    height: 38,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },

  propertyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySurface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  propertyTitle: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.infoSurface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#BEE3F8',
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.info,
    lineHeight: 16,
  },

  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: spacing.md,
    letterSpacing: 0.2,
  },
  optional: {
    fontWeight: typography.fontWeight.normal,
    color: colors.textLight,
  },

  input: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  inputFocused: { borderColor: colors.primary, backgroundColor: colors.white },
  inputError: { borderColor: colors.error },
  inputText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  textAreaWrap: {
    height: 'auto',
    minHeight: 120,
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  textArea: {
    flex: 1,
    width: '100%',
    fontSize: typography.fontSize.md,
    color: colors.text,
    minHeight: 100,
  },

  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 4,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 14,
    marginTop: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.55 },
  submitBtnText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});

export default ContactAgentScreen;
