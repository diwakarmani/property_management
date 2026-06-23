import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@/theme';
import { UserService, type UserAddressDTO } from '@/api/services/user.service';

const ADDRESS_TYPES = ['HOME', 'WORK', 'OTHER'];

const EMPTY_FORM: Omit<UserAddressDTO, 'id'> = {
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: 'USA',
  postalCode: '',
  addressType: 'HOME',
  isDefault: false,
};

const TYPE_ICONS: Record<string, string> = {
  HOME: 'home-outline',
  WORK: 'briefcase-outline',
  OTHER: 'location-outline',
};

const AddressesScreen = ({ navigation }: any) => {
  const [addresses, setAddresses] = useState<UserAddressDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Omit<UserAddressDTO, 'id'>>({ ...EMPTY_FORM });
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const loadAddresses = () => {
    UserService.getMe()
      .then(res => setAddresses(res.data.data?.addresses ?? []))
      .catch(err => console.error('Failed to load addresses', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAddresses(); }, []);

  const set = (key: keyof typeof form) => (val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleAdd = () => {
    if (!form.addressLine1.trim()) { Alert.alert('Required', 'Address line 1 is required'); return; }
    if (!form.city.trim()) { Alert.alert('Required', 'City is required'); return; }
    if (!form.state.trim()) { Alert.alert('Required', 'State is required'); return; }
    if (!form.country.trim()) { Alert.alert('Required', 'Country is required'); return; }
    if (!form.postalCode.trim()) { Alert.alert('Required', 'Postal code is required'); return; }

    setSubmitting(true);
    UserService.addAddress(form)
      .then(res => {
        setAddresses(prev => [...prev, res.data.data]);
        setShowModal(false);
        setForm({ ...EMPTY_FORM });
      })
      .catch(err => {
        const msg = err?.response?.data?.message ?? 'Failed to add address';
        Alert.alert('Error', msg);
      })
      .finally(() => setSubmitting(false));
  };

  const handleDelete = (address: UserAddressDTO) => {
    Alert.alert(
      'Delete Address',
      `Delete address at ${address.addressLine1}, ${address.city}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            UserService.deleteAddress(address.id!)
              .then(() => setAddresses(prev => prev.filter(a => a.id !== address.id)))
              .catch(err => {
                const msg = err?.response?.data?.message ?? 'Failed to delete address';
                Alert.alert('Error', msg);
              });
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const fieldStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.list}>

        <View style={styles.backRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={18} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>My Addresses</Text>
          <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
            <Ionicons name="add" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {addresses.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="location-outline" size={40} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No addresses yet</Text>
            <Text style={styles.emptySub}>Tap + to add your first address</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowModal(true)}>
              <Ionicons name="add-circle-outline" size={18} color={colors.white} />
              <Text style={styles.emptyAddBtnText}>Add Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          addresses.map(addr => (
            <View key={addr.id} style={styles.card}>
              <View style={styles.cardIconWrap}>
                <Ionicons
                  name={(TYPE_ICONS[addr.addressType ?? 'OTHER'] ?? 'location-outline') as any}
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={styles.cardLeft}>
                <View style={styles.typeRow}>
                  <View style={styles.typeTag}>
                    <Text style={styles.typeText}>{addr.addressType ?? 'HOME'}</Text>
                  </View>
                </View>
                <Text style={styles.addressLine1}>{addr.addressLine1}</Text>
                {addr.addressLine2 ? <Text style={styles.addressLine2}>{addr.addressLine2}</Text> : null}
                <Text style={styles.addressLine2}>
                  {addr.city}, {addr.state} {addr.postalCode}
                </Text>
                <Text style={styles.addressLine2}>{addr.country}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(addr)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>

            <View style={styles.dragHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Address</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => { setShowModal(false); setForm({ ...EMPTY_FORM }); }}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

              <Text style={styles.fieldLabel}>Address Type</Text>
              <View style={styles.chipRow}>
                {ADDRESS_TYPES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, form.addressType === t && styles.chipActive]}
                    onPress={() => set('addressType')(t)}
                  >
                    <Ionicons
                      name={(TYPE_ICONS[t] ?? 'location-outline') as any}
                      size={14}
                      color={form.addressType === t ? colors.white : colors.textSecondary}
                    />
                    <Text style={[styles.chipText, form.addressType === t && styles.chipTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Address Line 1 *</Text>
              <TextInput
                style={fieldStyle('line1')}
                value={form.addressLine1}
                onChangeText={set('addressLine1')}
                placeholder="Building, street, area"
                placeholderTextColor={colors.textLight}
                onFocus={() => setFocusedField('line1')}
                onBlur={() => setFocusedField(null)}
              />

              <Text style={styles.fieldLabel}>Address Line 2</Text>
              <TextInput
                style={fieldStyle('line2')}
                value={form.addressLine2}
                onChangeText={set('addressLine2')}
                placeholder="Landmark, floor (optional)"
                placeholderTextColor={colors.textLight}
                onFocus={() => setFocusedField('line2')}
                onBlur={() => setFocusedField(null)}
              />

              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>City *</Text>
                  <TextInput
                    style={fieldStyle('city')}
                    value={form.city}
                    onChangeText={set('city')}
                    placeholder="e.g. Austin"
                    placeholderTextColor={colors.textLight}
                    onFocus={() => setFocusedField('city')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>State *</Text>
                  <TextInput
                    style={fieldStyle('state')}
                    value={form.state}
                    onChangeText={set('state')}
                    placeholder="e.g. MH"
                    placeholderTextColor={colors.textLight}
                    onFocus={() => setFocusedField('state')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Country *</Text>
                  <TextInput
                    style={fieldStyle('country')}
                    value={form.country}
                    onChangeText={set('country')}
                    placeholder="USA"
                    placeholderTextColor={colors.textLight}
                    onFocus={() => setFocusedField('country')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Postal Code *</Text>
                  <TextInput
                    style={fieldStyle('postal')}
                    value={form.postalCode}
                    onChangeText={set('postalCode')}
                    placeholder="400050"
                    placeholderTextColor={colors.textLight}
                    keyboardType="numeric"
                    maxLength={6}
                    onFocus={() => setFocusedField('postal')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
                onPress={handleAdd}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="location" size={18} color={colors.white} />
                    <Text style={styles.primaryBtnText}>Save Address</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  list: { padding: spacing.md, paddingBottom: spacing.xl },

  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptySub: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 14,
    marginTop: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  emptyAddBtnText: {
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.md,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    gap: spacing.md,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLeft: { flex: 1 },
  typeRow: { marginBottom: spacing.xs },
  typeTag: {
    backgroundColor: colors.primarySurface,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.3,
  },
  addressLine1: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginTop: 2,
  },
  addressLine2: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.errorSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fieldLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: spacing.md,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 48,
    fontSize: typography.fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputFocused: { borderColor: colors.primary, backgroundColor: colors.white },
  row2: { flexDirection: 'row', gap: spacing.sm },

  chipRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontWeight: typography.fontWeight.medium },
  chipTextActive: { color: colors.white, fontWeight: typography.fontWeight.bold },

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
  primaryBtnText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});

export default AddressesScreen;
