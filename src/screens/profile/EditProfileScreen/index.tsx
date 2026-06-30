import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { colors, typography, spacing } from '@/theme';
import Input from '@/components/common/Input';
import type { RootState, AppDispatch } from '@/store';
import { UserService } from '@/api/services/user.service';
import { fetchUser } from '@/store/slices/authSlice';
import { toIsoDateOrEmpty } from '@/utils/helpers/dateOfBirth';

const GENDER_OPTIONS = [
  { label: 'Male', value: 'MALE', icon: 'male-outline' },
  { label: 'Female', value: 'FEMALE', icon: 'female-outline' },
  { label: 'Other', value: 'OTHER', icon: 'person-outline' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const CURRENT_YEAR = new Date().getFullYear();
const DOB_YEARS = Array.from({ length: CURRENT_YEAR - 1899 }, (_, index) => CURRENT_YEAR - index);

const parseIsoDate = (value?: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return new Date(2000, 0, 1);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

const formatIsoDate = (date: Date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-');

const DateOfBirthPicker = ({
  visible,
  value,
  onClose,
  onSelect,
}: {
  visible: boolean;
  value?: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}) => {
  const initialDate = parseIsoDate(value);
  const [year, setYear] = useState(initialDate.getFullYear());
  const [month, setMonth] = useState(initialDate.getMonth());
  const [showYears, setShowYears] = useState(false);

  React.useEffect(() => {
    if (!visible) return;
    const next = parseIsoDate(value);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
    setShowYears(false);
  }, [visible, value]);

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const selected = parseIsoDate(value);
  const today = new Date();
  const atMinimumMonth = year === 1900 && month === 0;
  const atCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const changeMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.calendarOverlay}>
        <View style={styles.calendarSheet} accessibilityLabel="Date of birth calendar">
          <View style={styles.calendarTopRow}>
            <Text style={styles.calendarTitle}>Select date of birth</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close calendar">
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarHeader}>
            <TouchableOpacity
              onPress={() => changeMonth(-1)}
              disabled={atMinimumMonth}
              accessibilityLabel="Previous month"
              accessibilityState={{ disabled: atMinimumMonth }}
            >
              <Ionicons name="chevron-back" size={22} color={atMinimumMonth ? colors.textLight : colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowYears(current => !current)} accessibilityLabel="Choose year">
              <Text style={styles.calendarMonth}>{MONTHS[month]} {year}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => changeMonth(1)}
              disabled={atCurrentMonth}
              accessibilityLabel="Next month"
              accessibilityState={{ disabled: atCurrentMonth }}
            >
              <Ionicons name="chevron-forward" size={22} color={atCurrentMonth ? colors.textLight : colors.primary} />
            </TouchableOpacity>
          </View>

          {showYears ? (
            <ScrollView style={styles.yearList} contentContainerStyle={styles.yearGrid}>
              {DOB_YEARS.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.yearOption, option === year && styles.yearOptionActive]}
                  onPress={() => { setYear(option); setShowYears(false); }}
                  accessibilityLabel={`Select year ${option}`}
                >
                  <Text style={[styles.yearOptionText, option === year && styles.yearOptionTextActive]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <>
              <View style={styles.weekRow}>
                {WEEKDAYS.map((day, index) => <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>)}
              </View>
              <View style={styles.dayGrid}>
                {Array.from({ length: firstWeekday }).map((_, index) => <View key={`blank-${index}`} style={styles.dayCell} />)}
                {Array.from({ length: daysInMonth }, (_, index) => index + 1).map(day => {
                  const date = new Date(year, month, day);
                  const isFuture = date > today;
                  const isSelected = selected.getFullYear() === year
                    && selected.getMonth() === month
                    && selected.getDate() === day;
                  const iso = formatIsoDate(date);
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                      disabled={isFuture}
                      onPress={() => { onSelect(iso); onClose(); }}
                      accessibilityLabel={`Select ${iso}`}
                      accessibilityState={{ disabled: isFuture, selected: isSelected }}
                    >
                      <Text style={[styles.dayText, isFuture && styles.dayTextDisabled, isSelected && styles.dayTextSelected]}>{day}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const EditProfileScreen = ({ navigation }: any) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [selectedGender, setSelectedGender] = useState<string>(user?.gender || '');
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  // Field refs for sequential keyboard navigation
  const lastNameRef = useRef<TextInput>(null);
  const occupationRef = useRef<TextInput>(null);
  const websiteRef = useRef<TextInput>(null);

  const { control, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      bio: user?.bio || '',
      dateOfBirth: (user?.dateOfBirth || '').slice(0, 10),
      occupation: user?.occupation || '',
      website: user?.website || '',
    },
  });
  const dateOfBirth = watch('dateOfBirth');

  const onSubmit = async (data: any) => {
    try {
      const payload: any = {
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        bio: data.bio || undefined,
        occupation: data.occupation || undefined,
        website: data.website || undefined,
        gender: selectedGender || undefined,
      };
      const dob = (data.dateOfBirth || '').trim();
      if (dob.length > 0) {
        const iso = toIsoDateOrEmpty(dob);
        if (iso) payload.dateOfBirth = iso;
      }
      await UserService.updateMe(payload);
      await dispatch(fetchUser());
      navigation.goBack();
    } catch {

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
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={18} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Edit Profile</Text>
        </View>

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
                returnKeyType="next"
                onSubmitEditing={() => lastNameRef.current?.focus()}
                blurOnSubmit={false}
              />
            )}
          />
          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, value } }) => (
              <Input
                ref={lastNameRef}
                label="Last Name"
                value={value}
                onChangeText={onChange}
                leftIcon="person-outline"
                placeholder="Enter your last name"
                returnKeyType="next"
                onSubmitEditing={() => occupationRef.current?.focus()}
                blurOnSubmit={false}
              />
            )}
          />
          <Text style={styles.dateLabel}>Date of Birth</Text>
          <TouchableOpacity
            style={styles.dateField}
            onPress={() => setDatePickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Choose date of birth"
          >
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={[styles.dateValue, !dateOfBirth && styles.datePlaceholder]}>
              {dateOfBirth || 'Select date'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

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
                ref={occupationRef}
                label="Occupation"
                value={value}
                onChangeText={onChange}
                leftIcon="briefcase-outline"
                placeholder="e.g. Real Estate Agent, Buyer"
                returnKeyType="next"
                onSubmitEditing={() => websiteRef.current?.focus()}
                blurOnSubmit={false}
              />
            )}
          />
          <Controller
            control={control}
            name="website"
            render={({ field: { onChange, value } }) => (
              <Input
                ref={websiteRef}
                label="Website"
                value={value}
                onChangeText={onChange}
                leftIcon="globe-outline"
                keyboardType="url"
                autoCapitalize="none"
                placeholder="https://yourwebsite.com"
                returnKeyType="done"
                blurOnSubmit
              />
            )}
          />
        </View>

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
                  returnKeyType="default"
                  blurOnSubmit={false}
                />
              </View>
            )}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Contact Info (OTP-verified)</Text>
          </View>

          <View style={styles.readonlyField}>
            <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
            <View style={styles.readonlyInfo}>
              <Text style={styles.readonlyLabel}>Phone Number</Text>
              <Text style={styles.readonlyValue}>{user?.phone || 'Not set'}</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('ChangeContact', { contactType: 'phone' })}
              activeOpacity={0.7}
            >
              <Text style={styles.changeLink}>Change</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fieldSeparator} />

          <View style={styles.readonlyField}>
            <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
            <View style={styles.readonlyInfo}>
              <Text style={styles.readonlyLabel}>Email Address</Text>
              <Text style={styles.readonlyValue}>{user?.email || '—'}</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('ChangeContact', { contactType: 'email' })}
              activeOpacity={0.7}
            >
              <Text style={styles.changeLink}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Save changes"
          accessibilityState={{ disabled: isSubmitting }}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color={colors.white} />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      <DateOfBirthPicker
        visible={datePickerVisible}
        value={dateOfBirth}
        onClose={() => setDatePickerVisible(false)}
        onSelect={(value) => setValue('dateOfBirth', value, { shouldDirty: true })}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl * 4,
  },

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
  dateLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  dateField: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  dateValue: { flex: 1, fontSize: typography.fontSize.md, color: colors.text },
  datePlaceholder: { color: colors.textLight },
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  calendarSheet: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    maxHeight: '82%',
  },
  calendarTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calendarTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  calendarMonth: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.primary },
  weekRow: { flexDirection: 'row' },
  weekday: { width: '14.2857%', textAlign: 'center', fontSize: typography.fontSize.xs, color: colors.textSecondary },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  dayCell: { width: '14.2857%', height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  dayCellSelected: { backgroundColor: colors.primary },
  dayText: { fontSize: typography.fontSize.sm, color: colors.text },
  dayTextDisabled: { color: colors.textLight },
  dayTextSelected: { color: colors.white, fontWeight: typography.fontWeight.bold },
  yearList: { maxHeight: 280 },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingVertical: spacing.sm },
  yearOption: {
    width: '30%',
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  yearOptionActive: { backgroundColor: colors.primary },
  yearOptionText: { color: colors.text, fontSize: typography.fontSize.sm },
  yearOptionTextActive: { color: colors.white, fontWeight: typography.fontWeight.bold },

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
  fieldSeparator: { height: 1, backgroundColor: colors.borderLight, marginVertical: 2 },
  changeLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
    paddingHorizontal: 4,
  },

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
