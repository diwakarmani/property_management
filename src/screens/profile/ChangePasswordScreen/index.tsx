import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { UserService } from '@/api/services/user.service';

const ChangePasswordScreen = ({ navigation }: any) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
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
    UserService.changePassword(currentPassword, newPassword, confirmPassword)
      .then(() => {
        Alert.alert('Success', 'Password changed successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      })
      .catch(err => {
        const msg = err?.response?.data?.message ?? 'Failed to change password';
        Alert.alert('Error', msg);
      })
      .finally(() => setSubmitting(false));
  };

  const PasswordField = ({
    label, value, onChangeText, show, onToggle, placeholder,
  }: {
    label: string; value: string; onChangeText: (t: string) => void;
    show: boolean; onToggle: () => void; placeholder: string;
  }) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordRow}>
        <TextInput
          style={styles.passwordInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={!show}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Change Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>Password must be at least 8 characters.</Text>
        </View>

        <PasswordField
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          show={showCurrent}
          onToggle={() => setShowCurrent(v => !v)}
          placeholder="Enter current password"
        />

        <PasswordField
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          show={showNew}
          onToggle={() => setShowNew(v => !v)}
          placeholder="Min 8 characters"
        />

        <PasswordField
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          show={showConfirm}
          onToggle={() => setShowConfirm(v => !v)}
          placeholder="Re-enter new password"
        />

        <TouchableOpacity
          style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryBtnText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 40 },
  topBarTitle: { fontSize: typography.fontSize.lg, fontWeight: 'bold' },
  form: { flex: 1, padding: spacing.lg },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primary + '10', borderRadius: 8,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  infoText: { fontSize: typography.fontSize.sm, color: colors.primary, flex: 1 },
  label: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs, marginTop: spacing.lg },
  passwordRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8,
  },
  passwordInput: {
    flex: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: typography.fontSize.md, color: colors.text,
  },
  eyeBtn: { padding: spacing.sm },
  primaryBtn: {
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    padding: spacing.md, borderRadius: 10, marginTop: spacing.xl,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: colors.white, fontSize: typography.fontSize.md, fontWeight: '600' },
});

export default ChangePasswordScreen;
