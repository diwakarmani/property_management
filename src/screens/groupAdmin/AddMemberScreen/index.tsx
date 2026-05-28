import React, { useState, useEffect } from 'react';
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
import { GroupService } from '@/api/services/group.service';
import type { GroupMemberDTO } from '@/api/types/group.types';

type Mode = 'search' | 'create';

const AddMemberScreen = ({ navigation, route }: any) => {
  const initialMode: Mode = route?.params?.mode === 'create' ? 'create' : 'search';
  const [mode, setMode] = useState<Mode>(initialMode);

  // ── Find-existing state
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState<GroupMemberDTO | null>(null);
  const [searchError, setSearchError] = useState('');
  const [addCommission, setAddCommission] = useState('');
  const [addTarget, setAddTarget] = useState('');
  const [adding, setAdding] = useState(false);

  // ── Create-new state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [createCommission, setCreateCommission] = useState('');
  const [createTarget, setCreateTarget] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (route?.params?.mode) setMode(route.params.mode);
  }, [route?.params?.mode]);

  // ── Find-existing handlers
  const handleSearch = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setSearchError('Enter a valid email address');
      return;
    }
    setSearchError('');
    setFound(null);
    setSearching(true);

    GroupService.lookupRealtor(trimmed)
      .then(res => setFound(res.data.data))
      .catch(err => {
        const status = err?.response?.status;
        setSearchError(
          (status === 404 || status === 400)
            ? (err?.response?.data?.message ?? 'No realtor found with that email')
            : 'Search failed. Please try again.'
        );
      })
      .finally(() => setSearching(false));
  };

  const handleAdd = () => {
    if (!found) return;
    setAdding(true);
    GroupService.addMember({
      userId: found.userId,
      ...(addCommission && { commissionPercent: parseFloat(addCommission) }),
      ...(addTarget && { monthlyTarget: parseInt(addTarget, 10) }),
    })
      .then(() => {
        Alert.alert(
          'Member Added',
          `${found.firstName} ${found.lastName} has been added to your group.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      })
      .catch(err => Alert.alert('Error', err?.response?.data?.message ?? 'Failed to add member'))
      .finally(() => setAdding(false));
  };

  // ── Create-new handlers
  const handleCreate = () => {
    if (!firstName.trim()) { Alert.alert('Validation', 'First name is required'); return; }
    if (!lastName.trim()) { Alert.alert('Validation', 'Last name is required'); return; }
    if (!newEmail.trim() || !newEmail.includes('@')) { Alert.alert('Validation', 'Valid email is required'); return; }
    if (!password.trim() || password.length < 6) { Alert.alert('Validation', 'Password must be at least 6 characters'); return; }

    setCreating(true);
    GroupService.createRealtor({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: newEmail.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      password,
      commissionPercent: createCommission ? parseFloat(createCommission) : undefined,
      monthlyTarget: createTarget ? parseInt(createTarget, 10) : undefined,
    })
      .then(() => {
        Alert.alert(
          'Realtor Created',
          `${firstName} ${lastName} account created and added to your group. They can now log in with their email and password.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      })
      .catch(err => Alert.alert('Error', err?.response?.data?.message ?? 'Failed to create realtor'))
      .finally(() => setCreating(false));
  };

  const TabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, mode === 'search' && styles.tabActive]}
        onPress={() => setMode('search')}
      >
        <Ionicons name="search-outline" size={16} color={mode === 'search' ? colors.primary : colors.textSecondary} />
        <Text style={[styles.tabText, mode === 'search' && styles.tabTextActive]}>Find Existing</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, mode === 'create' && styles.tabActive]}
        onPress={() => setMode('create')}
      >
        <Ionicons name="person-add-outline" size={16} color={mode === 'create' ? colors.primary : colors.textSecondary} />
        <Text style={[styles.tabText, mode === 'create' && styles.tabTextActive]}>Create New</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Add Realtor</Text>
        <View style={{ width: 40 }} />
      </View>

      <TabBar />

      {mode === 'search' ? (
        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          {/* Step 1 — search */}
          <View style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View>
              <Text style={styles.stepTitle}>Find Realtor by Email</Text>
            </View>
            <Text style={styles.stepDesc}>
              Enter the registered email of an existing REALTOR account.
            </Text>

            <View style={styles.searchRow}>
              <TextInput
                style={[styles.input, styles.searchInput]}
                value={email}
                onChangeText={v => { setEmail(v); setSearchError(''); setFound(null); }}
                placeholder="realtor@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity
                style={[styles.searchBtn, searching && styles.btnDisabled]}
                onPress={handleSearch}
                disabled={searching}
              >
                {searching
                  ? <ActivityIndicator size="small" color={colors.white} />
                  : <Ionicons name="search" size={20} color={colors.white} />
                }
              </TouchableOpacity>
            </View>

            {!!searchError && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                <Text style={styles.errorText}>{searchError}</Text>
              </View>
            )}
          </View>

          {found && (
            <View style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepBadge, { backgroundColor: colors.success }]}>
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                </View>
                <Text style={styles.stepTitle}>Realtor Found</Text>
              </View>

              <View style={styles.realtorCard}>
                <View style={styles.realtorAvatar}>
                  <Text style={styles.realtorAvatarText}>{found.firstName?.[0]}{found.lastName?.[0]}</Text>
                </View>
                <View style={styles.realtorInfo}>
                  <Text style={styles.realtorName}>{found.firstName} {found.lastName}</Text>
                  <Text style={styles.realtorEmail}>{found.email}</Text>
                  {found.phone ? <Text style={styles.realtorEmail}>{found.phone}</Text> : null}
                </View>
              </View>

              <Text style={styles.sectionLabel}>Optional Settings</Text>

              <Text style={styles.label}>Commission (%)</Text>
              <TextInput
                style={styles.input}
                value={addCommission}
                onChangeText={setAddCommission}
                placeholder="e.g. 2.5"
                keyboardType="decimal-pad"
              />
              <Text style={styles.label}>Monthly Target</Text>
              <TextInput
                style={styles.input}
                value={addTarget}
                onChangeText={setAddTarget}
                placeholder="e.g. 3"
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={[styles.primaryBtn, adding && styles.btnDisabled]}
                onPress={handleAdd}
                disabled={adding}
              >
                {adding
                  ? <ActivityIndicator color={colors.white} />
                  : <>
                      <Ionicons name="person-add-outline" size={18} color={colors.white} />
                      <Text style={styles.primaryBtnText}>Add to Group</Text>
                    </>
                }
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          <View style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}><Ionicons name="person-add-outline" size={14} color={colors.white} /></View>
              <Text style={styles.stepTitle}>Create Realtor Account</Text>
            </View>
            <Text style={styles.stepDesc}>
              Create a new REALTOR account. They can log in immediately with their email and password.
            </Text>

            <Text style={styles.label}>First Name *</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First name" autoCapitalize="words" />

            <Text style={styles.label}>Last Name *</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last name" autoCapitalize="words" />

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="realtor@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="Min 6 characters"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(p => !p)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>Optional Settings</Text>

            <Text style={styles.label}>Commission (%)</Text>
            <TextInput
              style={styles.input}
              value={createCommission}
              onChangeText={setCreateCommission}
              placeholder="e.g. 2.5"
              keyboardType="decimal-pad"
            />
            <Text style={styles.label}>Monthly Target</Text>
            <TextInput
              style={styles.input}
              value={createTarget}
              onChangeText={setCreateTarget}
              placeholder="e.g. 3"
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={[styles.primaryBtn, creating && styles.btnDisabled]}
              onPress={handleCreate}
              disabled={creating}
            >
              {creating
                ? <ActivityIndicator color={colors.white} />
                : <>
                    <Ionicons name="checkmark-circle-outline" size={18} color={colors.white} />
                    <Text style={styles.primaryBtnText}>Create & Add to Group</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
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
  topBarTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 12,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: typography.fontWeight.bold },

  form: { flex: 1, padding: spacing.md },
  stepCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: { color: colors.white, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  stepTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.text },
  stepDesc: { fontSize: typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.md },

  searchRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  searchInput: { flex: 1, marginBottom: 0 },
  searchBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    backgroundColor: colors.errorSurface,
    borderRadius: 10,
    padding: spacing.sm,
  },
  errorText: { fontSize: typography.fontSize.sm, color: colors.error, flex: 1 },

  realtorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.successSurface,
  },
  realtorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  realtorAvatarText: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.primary },
  realtorInfo: { flex: 1 },
  realtorName: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.text },
  realtorEmail: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },

  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
    letterSpacing: 0.3,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: spacing.md,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 52,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 14,
    marginTop: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnText: { color: colors.white, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
  btnDisabled: { opacity: 0.55 },
});

export default AddMemberScreen;
