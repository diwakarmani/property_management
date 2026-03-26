import React, { useEffect, useState } from 'react';
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
import type { RealtorGroupDTO } from '@/api/types/group.types';

const EditGroupScreen = ({ navigation }: any) => {
  const [group, setGroup] = useState<RealtorGroupDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [businessLicense, setBusinessLicense] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    GroupService.getMyGroup()
      .then(res => {
        const g = res.data.data;
        if (g) {
          setGroup(g);
          setName(g.name ?? '');
          setCompanyName(g.companyName ?? '');
          setBusinessLicense(g.businessLicense ?? '');
          setAddress(g.address ?? '');
          setWebsite(g.website ?? '');
          setDescription(g.description ?? '');
        }
      })
      .catch(() => Alert.alert('Error', 'Failed to load group details'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Group name is required');
      return;
    }
    if (!group?.id) return;

    setSaving(true);
    GroupService.updateGroup(group.id, {
      name: name.trim(),
      companyName: companyName.trim() || undefined,
      businessLicense: businessLicense.trim() || undefined,
      address: address.trim() || undefined,
      website: website.trim() || undefined,
      description: description.trim() || undefined,
    })
      .then(() => {
        Alert.alert('Success', 'Group updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      })
      .catch(err => {
        const msg = err?.response?.data?.message ?? 'Failed to update group';
        Alert.alert('Error', msg);
      })
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const Field = ({
    label,
    value,
    onChangeText,
    placeholder,
    multiline,
  }: {
    label: string;
    value: string;
    onChangeText: (t: string) => void;
    placeholder?: string;
    multiline?: boolean;
  }) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'auto'}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Group</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field
          label="Group Name *"
          value={name}
          onChangeText={setName}
          placeholder="Enter group name"
        />
        <Field
          label="Company Name"
          value={companyName}
          onChangeText={setCompanyName}
          placeholder="Company / Agency name"
        />
        <Field
          label="Business License"
          value={businessLicense}
          onChangeText={setBusinessLicense}
          placeholder="License number"
        />
        <Field
          label="Address"
          value={address}
          onChangeText={setAddress}
          placeholder="Office address"
        />
        <Field
          label="Website"
          value={website}
          onChangeText={setWebsite}
          placeholder="https://yourwebsite.com"
        />
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Tell realtors about your group..."
          multiline
        />

        {group?.status && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status: </Text>
            <Text style={[styles.statusValue, { color: STATUS_COLORS[group.status] ?? colors.textSecondary }]}>
              {group.status}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#27AE60',
  PENDING_APPROVAL: '#F39C12',
  REJECTED: '#E74C3C',
  SUSPENDED: '#95A5A6',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: '600' },
  content: { padding: spacing.md, gap: spacing.md },
  field: { gap: 6 },
  label: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.md,
    backgroundColor: colors.white,
    color: colors.text,
  },
  textArea: { height: 100, paddingTop: spacing.sm },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusLabel: { fontSize: typography.fontSize.md, color: colors.textSecondary },
  statusValue: { fontSize: typography.fontSize.md, fontWeight: '700' },
  saveBtn: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: typography.fontSize.md },
});

export default EditGroupScreen;
