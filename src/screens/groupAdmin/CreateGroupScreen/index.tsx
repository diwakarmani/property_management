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
          'Your group has been submitted for approval. You will be notified once it is reviewed.',
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
          <Ionicons name="information-circle-outline" size={20} color={colors.warning} />
          <Text style={styles.infoText}>
            New groups require admin approval before becoming active.
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 40 },
  topBarTitle: { fontSize: typography.fontSize.lg, fontWeight: 'bold' },
  form: { flex: 1, padding: spacing.lg },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.warning + '15', borderRadius: 8,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  infoText: { fontSize: typography.fontSize.sm, color: colors.text, flex: 1, lineHeight: 20 },
  label: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: typography.fontSize.md, color: colors.text,
  },
  textarea: { height: 100, textAlignVertical: 'top', paddingTop: spacing.sm },
  primaryBtn: {
    backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', padding: spacing.md, borderRadius: 10,
    marginTop: spacing.xl, marginBottom: spacing.xl, gap: spacing.sm,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: colors.white, fontSize: typography.fontSize.md, fontWeight: '600' },
});

export default CreateGroupScreen;
