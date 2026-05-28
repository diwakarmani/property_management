import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { colors, typography, spacing } from '@/theme';
import Input from '@/components/common/Input';
import type { RootState, AppDispatch } from '@/store';
import { UserService } from '@/api/services/user.service';
import { fetchUser } from '@/store/slices/authSlice';

const GENDER_OPTIONS = [
  { label: 'Male', value: 'MALE', icon: 'male-outline' },
  { label: 'Female', value: 'FEMALE', icon: 'female-outline' },
  { label: 'Other', value: 'OTHER', icon: 'person-outline' },
];

const EditProfileScreen = ({ navigation }: any) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [selectedGender, setSelectedGender] = useState<string>(user?.gender || '');

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      dateOfBirth: user?.dateOfBirth || '',
      occupation: user?.occupation || '',
      website: user?.website || '',
    },
  });

  const onSubmit = async (data: any) => {
    try {
      const payload: any = {
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        phone: data.phone || undefined,
        bio: data.bio || undefined,
        occupation: data.occupation || undefined,
        website: data.website || undefined,
        gender: selectedGender || undefined,
      };
      if (data.dateOfBirth && data.dateOfBirth.trim().length > 0) {
        payload.dateOfBirth = data.dateOfBirth.trim();
      }
      await UserService.updateMe(payload);
      await dispatch(fetchUser());
      navigation.goBack();
    } catch {
      // global interceptor shows error toast
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Inline back row — inside scroll, not a separate header bar */}
        <View style={styles.backRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={18} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Edit Profile</Text>
        </View>

        {/* Avatar placeholder */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>
                {(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')}
              </Text>
            </View>
            <TouchableOpacity style={styles.avatarEditBtn}>
              <Ionicons name="camera" size={14} color={colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        {/* Section: Basic Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>

          <Controller
            control={control}
            name="firstName"
            rules={{ required: 'First name is required' }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="First Name *"
                value={value}
                onChangeText={onChange}
                leftIcon="person-outline"
                error={errors.firstName?.message as string | undefined}
                placeholder="Enter your first name"
              />
            )}
          />
          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Last Name"
                value={value}
                onChangeText={onChange}
                leftIcon="person-outline"
                placeholder="Enter your last name"
              />
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Phone Number"
                value={value}
                onChangeText={onChange}
                leftIcon="call-outline"
                keyboardType="phone-pad"
                placeholder="+91 XXXXX XXXXX"
              />
            )}
          />
          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Date of Birth"
                value={value}
                onChangeText={onChange}
                leftIcon="calendar-outline"
                placeholder="DD/MM/YYYY"
              />
            )}
          />
        </View>

        {/* Gender selector */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="male-female-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>Gender</Text>
          </View>
          <View style={styles.genderRow}>
            {GENDER_OPTIONS.map(opt => {
              const active = selectedGender === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.genderChip, active && styles.genderChipActive]}
                  onPress={() => setSelectedGender(active ? '' : opt.value)}
                >
                  <Ionicons name={opt.icon as any} size={15} color={active ? colors.white : colors.textSecondary} />
                  <Text style={[styles.genderChipText, active && styles.genderChipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section: Professional */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="briefcase-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>Professional</Text>
          </View>
          <Controller
            control={control}
            name="occupation"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Occupation"
                value={value}
                onChangeText={onChange}
                leftIcon="briefcase-outline"
                placeholder="e.g. Real Estate Agent, Buyer"
              />
            )}
          />
          <Controller
            control={control}
            name="website"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Website"
                value={value}
                onChangeText={onChange}
                leftIcon="globe-outline"
                keyboardType="url"
                autoCapitalize="none"
                placeholder="https://yourwebsite.com"
              />
            )}
          />
        </View>

        {/* Section: About */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>About Me</Text>
          </View>
          <Controller
            control={control}
            name="bio"
            render={({ field: { onChange, value } }) => (
              <View style={styles.bioWrap}>
                <Text style={styles.bioLabel}>Bio</Text>
                <Input
                  label=""
                  value={value}
                  onChangeText={onChange}
                  placeholder="Tell others about yourself..."
                  multiline
                  numberOfLines={4}
                  style={styles.bioInput}
                />
              </View>
            )}
          />
        </View>

        {/* Email (read-only) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account (Read-only)</Text>
          </View>
          <View style={styles.readonlyField}>
            <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
            <View style={styles.readonlyInfo}>
              <Text style={styles.readonlyLabel}>Email Address</Text>
              <Text style={styles.readonlyValue}>{user?.email || '—'}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={13} color={colors.success} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSubmit(onSubmit)}
        >
          <Ionicons name="checkmark" size={18} color={colors.white} />
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },

  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pageTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },

  avatarSection: { alignItems: 'center', paddingVertical: spacing.md },
  avatarWrap: { position: 'relative', marginBottom: spacing.sm },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarInitials: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textTransform: 'uppercase',
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatarHint: { fontSize: typography.fontSize.sm, color: colors.textSecondary },

  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  genderRow: { flexDirection: 'row', gap: spacing.sm },
  genderChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  genderChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  genderChipText: { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontWeight: typography.fontWeight.medium },
  genderChipTextActive: { color: colors.white, fontWeight: typography.fontWeight.bold },

  bioWrap: { gap: 4 },
  bioLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  bioInput: { minHeight: 100, textAlignVertical: 'top' } as any,

  readonlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  readonlyInfo: { flex: 1 },
  readonlyLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  readonlyValue: { fontSize: typography.fontSize.md, color: colors.text, fontWeight: typography.fontWeight.medium, marginTop: 2 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.successSurface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  verifiedText: { fontSize: 10, color: colors.success, fontWeight: typography.fontWeight.bold },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    marginTop: spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtnText: { color: colors.white, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
});

export default EditProfileScreen;
