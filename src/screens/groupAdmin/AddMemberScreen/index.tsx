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
import { GroupService } from '@/api/services/group.service';
import type { GroupMemberDTO } from '@/api/types/group.types';

const AddMemberScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState<GroupMemberDTO | null>(null);
  const [searchError, setSearchError] = useState('');

  const [commissionPercent, setCommissionPercent] = useState('');
  const [monthlyTarget, setMonthlyTarget] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
        if (status === 404 || status === 400) {
          setSearchError(
            err?.response?.data?.message ?? 'No realtor found with that email'
          );
        } else {
          setSearchError('Search failed. Please try again.');
        }
      })
      .finally(() => setSearching(false));
  };

  const handleAdd = () => {
    if (!found) return;

    setSubmitting(true);
    GroupService.addMember({
      userId: found.userId,
      ...(commissionPercent && { commissionPercent: parseFloat(commissionPercent) }),
      ...(monthlyTarget && { monthlyTarget: parseFloat(monthlyTarget) }),
    })
      .then(() => {
        Alert.alert(
          'Member Added',
          `${found.firstName} ${found.lastName} has been added to your group.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      })
      .catch(err => {
        const msg = err?.response?.data?.message ?? 'Failed to add member';
        Alert.alert('Error', msg);
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Add Realtor</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
        {/* Step 1 — search */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Find Realtor</Text>
          </View>
          <Text style={styles.stepDesc}>
            Enter the realtor's registered email address to look them up.
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
              style={[styles.searchBtn, searching && styles.searchBtnDisabled]}
              onPress={handleSearch}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="search" size={20} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>

          {searchError ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={styles.errorText}>{searchError}</Text>
            </View>
          ) : null}
        </View>

        {/* Step 2 — found realtor card */}
        {found && (
          <View style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepBadge, styles.stepBadgeSuccess]}>
                <Ionicons name="checkmark" size={14} color={colors.white} />
              </View>
              <Text style={styles.stepTitle}>Realtor Found</Text>
            </View>

            <View style={styles.realtorCard}>
              <View style={styles.realtorAvatar}>
                <Text style={styles.realtorAvatarText}>
                  {found.firstName?.[0]}{found.lastName?.[0]}
                </Text>
              </View>
              <View style={styles.realtorInfo}>
                <Text style={styles.realtorName}>{found.firstName} {found.lastName}</Text>
                <Text style={styles.realtorEmail}>{found.email}</Text>
                {found.phone ? (
                  <Text style={styles.realtorPhone}>{found.phone}</Text>
                ) : null}
              </View>
              <View style={styles.realtorBadge}>
                <Ionicons name="shield-checkmark" size={14} color={colors.success} />
                <Text style={styles.realtorBadgeText}>Realtor</Text>
              </View>
            </View>

            {/* Step 3 — optional settings */}
            <Text style={styles.optionalLabel}>Optional Settings</Text>

            <Text style={styles.label}>Commission (%)</Text>
            <TextInput
              style={styles.input}
              value={commissionPercent}
              onChangeText={setCommissionPercent}
              placeholder="e.g. 2.5"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Monthly Target ($)</Text>
            <TextInput
              style={styles.input}
              value={monthlyTarget}
              onChangeText={setMonthlyTarget}
              placeholder="e.g. 500000"
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={[styles.addBtn, submitting && styles.addBtnDisabled]}
              onPress={handleAdd}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={18} color={colors.white} />
                  <Text style={styles.addBtnText}>Add to Group</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  topBarTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
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
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeSuccess: { backgroundColor: colors.success },
  stepBadgeText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  stepTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  stepDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
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
  searchBtnDisabled: { opacity: 0.55 },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    backgroundColor: colors.errorSurface,
    borderRadius: 10,
    padding: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    flex: 1,
  },

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
  realtorAvatarText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  realtorInfo: { flex: 1 },
  realtorName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  realtorEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  realtorPhone: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 1,
  },
  realtorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successSurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  realtorBadgeText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: typography.fontWeight.semibold,
  },

  optionalLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
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
    marginBottom: spacing.xs,
  },
  addBtn: {
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
  addBtnDisabled: { opacity: 0.55 },
  addBtnText: { color: colors.white, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
});

export default AddMemberScreen;
