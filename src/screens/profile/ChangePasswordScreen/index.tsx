import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { UserService } from '@/api/services/user.service';

// Defined at module scope so React never unmounts/remounts the TextInput on
// parent re-renders (inline component definitions change reference each render
// and cause iOS TextInput to lose focus after the first character typed).
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
        autoCorrect={false}
      />
      <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  </>
);

const ChangePasswordScreen = ({ navigation }: any) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
    try {
      await UserService.changePassword(currentPassword, newPassword, confirmPassword);
      navigation.goBack();
    } catch {
      // global interceptor shows error toast
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
        {/* Inline back row */}
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

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
          <Text style={styles.primaryBtnText}>Update Password</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  form: { flex: 1, padding: spacing.lg },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primarySurface,
    borderRadius: 12, padding: spacing.md, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  infoText: { fontSize: typography.fontSize.sm, color: colors.primary, flex: 1 },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: spacing.lg,
    letterSpacing: 0.2,
  },
  passwordRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
  },
  passwordInput: {
    flex: 1, paddingHorizontal: spacing.md, height: 52,
    fontSize: typography.fontSize.md, color: colors.text,
  },
  eyeBtn: { padding: spacing.md },
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
