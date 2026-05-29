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

const EditGroupScreen = ({ navigation, route }: any) => {
  // Group data can arrive via route.params.group (from GroupsList),
  // or we fall back to getMyGroup() for the legacy single-group flow.
  const routeGroup: RealtorGroupDTO | undefined = route?.params?.group;

  const [group, setGroup] = useState<RealtorGroupDTO | null>(routeGroup ?? null);
  const [loading, setLoading] = useState(!routeGroup);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(routeGroup?.name ?? '');
  const [companyName, setCompanyName] = useState(routeGroup?.companyName ?? '');
  const [businessLicense, setBusinessLicense] = useState(routeGroup?.businessLicense ?? '');
  const [address, setAddress] = useState(routeGroup?.address ?? '');
  const [website, setWebsite] = useState(routeGroup?.website ?? '');
  const [description, setDescription] = useState(routeGroup?.description ?? '');

  useEffect(() => {
    if (routeGroup) return; // already have data from params
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
      .catch(err => {
        const status = err?.response?.status;
        if (status === 404 || status === 400) {
          navigation.replace('CreateGroup');
        } else {
          Alert.alert('Error', 'Failed to load group details');
        }
      })
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
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    backgroundColor: colors.surface,
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
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  content: { padding: spacing.md, gap: spacing.sm },
  field: { gap: 6 },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 52,
    fontSize: typography.fontSize.md,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  textArea: { height: 100, paddingTop: spacing.sm, paddingVertical: spacing.sm },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  statusLabel: { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontWeight: typography.fontWeight.medium },
  statusValue: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
  saveBtn: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtnText: { color: colors.white, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.md },
});

export default EditGroupScreen;
