import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { UserService } from '@/api/services/user.service';
import Input from '@/components/common/Input';

const ChangePasswordScreen = ({ navigation }: any) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentRef = useRef<TextInput>(null);
  const newPasswordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Required', 'Enter your current password'); return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Invalid', 'New password must be at least 8 characters'); return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match'); return;
    }
    setSubmitting(true);
    try {
      await UserService.changePassword(currentPassword, newPassword, confirmPassword);
      navigation.goBack();
    } catch {

    } finally {
      setSubmitting(false);
    }
  };

  return (
    // KAV active for Android; iOS uses automaticallyAdjustKeyboardInsets on ScrollView
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'android' ? 'height' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.backRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={18} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Change Password</Text>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>Password must be at least 8 characters.</Text>
        </View>

        <Input
          ref={currentRef}
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          toggleAccessibilityLabel="Toggle Current Password visibility"
          placeholder="Enter current password"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          onSubmitEditing={() => newPasswordRef.current?.focus()}
          blurOnSubmit={false}
        />

        <Input
          ref={newPasswordRef}
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          toggleAccessibilityLabel="Toggle New Password visibility"
          placeholder="Min 8 characters"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          blurOnSubmit={false}
        />

        <Input
          ref={confirmRef}
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          toggleAccessibilityLabel="Toggle Confirm New Password visibility"
          placeholder="Re-enter new password"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          blurOnSubmit
        />

        <TouchableOpacity
          style={[styles.primaryBtn, submitting && { opacity: 0.55 }]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Update password"
          accessibilityState={{ disabled: submitting }}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.primaryBtnText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 4,
  },
  backRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginBottom: spacing.md,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: colors.primarySurface,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  pageTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primarySurface,
    borderRadius: 12, padding: spacing.md, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  infoText: { fontSize: typography.fontSize.sm, color: colors.primary, flex: 1 },
  primaryBtn: {
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    height: 52, borderRadius: 14, marginTop: spacing.xl,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.3,
  },
});

export default ChangePasswordScreen;
