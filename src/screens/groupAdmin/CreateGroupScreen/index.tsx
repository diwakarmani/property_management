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
import type { CreateGroupRequest } from '@/api/types/group.types';

const CreateGroupScreen = ({ navigation }: any) => {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateGroupRequest>({
    name: '',
    companyName: '',
    businessLicense: '',
    address: '',
    description: '',
    website: '',
  });

  const set = (key: keyof CreateGroupRequest) => (val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    if (!form.name.trim()) {
      Alert.alert('Required', 'Group name is required');
      return;
    }

    setSubmitting(true);
    const payload: CreateGroupRequest = {
      name: form.name.trim(),
      ...(form.companyName?.trim() && { companyName: form.companyName.trim() }),
      ...(form.businessLicense?.trim() && { businessLicense: form.businessLicense.trim() }),
      ...(form.address?.trim() && { address: form.address.trim() }),
      ...(form.description?.trim() && { description: form.description.trim() }),
      ...(form.website?.trim() && { website: form.website.trim() }),
    };

    GroupService.createGroup(payload)
      .then(() => {
        Alert.alert(
          'Group Created',
          'Your group is now active. You can start adding realtors and managing listings.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      })
      .catch(err => {
        const msg = err?.response?.data?.message ?? 'Failed to create group';
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
        <Text style={styles.topBarTitle}>Create Group</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
        <View style={styles.infoCard}>
          <Ionicons name="people-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Create your group to start managing realtors and approving their listings.
          </Text>
        </View>

        <Text style={styles.label}>Group Name *</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={set('name')}
          placeholder="e.g. Elite Realtors Mumbai"
          maxLength={100}
        />

        <Text style={styles.label}>Company Name</Text>
        <TextInput
          style={styles.input}
          value={form.companyName}
          onChangeText={set('companyName')}
          placeholder="Registered company name"
          maxLength={100}
        />

        <Text style={styles.label}>Business License</Text>
        <TextInput
          style={styles.input}
          value={form.businessLicense}
          onChangeText={set('businessLicense')}
          placeholder="License or registration number"
        />

        <Text style={styles.label}>Office Address</Text>
        <TextInput
          style={styles.input}
          value={form.address}
          onChangeText={set('address')}
          placeholder="Street, city"
        />

        <Text style={styles.label}>Website</Text>
        <TextInput
          style={styles.input}
          value={form.website}
          onChangeText={set('website')}
          placeholder="https://yourwebsite.com"
          keyboardType="url"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={form.description}
          onChangeText={set('description')}
          placeholder="Describe your group and what you specialize in..."
          multiline
          numberOfLines={4}
          maxLength={500}
        />

        <TouchableOpacity
          style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="business-outline" size={18} color={colors.white} />
              <Text style={styles.primaryBtnText}>Submit for Approval</Text>
            </>
          )}
        </TouchableOpacity>
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
  form: { flex: 1, padding: spacing.lg },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.warningSurface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#F6E05E',
  },
  infoText: { fontSize: typography.fontSize.sm, color: colors.warning, flex: 1, lineHeight: 20 },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: spacing.md,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 52,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  textarea: { height: 100, textAlignVertical: 'top', paddingTop: spacing.sm, paddingVertical: spacing.sm },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 14,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnDisabled: { opacity: 0.55 },
  primaryBtnText: { color: colors.white, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
});

export default CreateGroupScreen;
