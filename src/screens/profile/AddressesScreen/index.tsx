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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { UserService, type UserAddressDTO } from '@/api/services/user.service';

const ADDRESS_TYPES = ['HOME', 'WORK', 'OTHER'];

const EMPTY_FORM: Omit<UserAddressDTO, 'id'> = {
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: 'India',
  postalCode: '',
  addressType: 'HOME',
  isDefault: false,
};

const AddressesScreen = ({ navigation }: any) => {
  const [addresses, setAddresses] = useState<UserAddressDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Omit<UserAddressDTO, 'id'>>({ ...EMPTY_FORM });

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

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>My Addresses</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {addresses.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={64} color={colors.border} />
            <Text style={styles.emptyTitle}>No addresses yet</Text>
            <Text style={styles.emptySub}>Tap + to add your first address</Text>
          </View>
        ) : (
          addresses.map(addr => (
            <View key={addr.id} style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.typeTag}>
                  <Text style={styles.typeText}>{addr.addressType ?? 'HOME'}</Text>
                </View>
                <Text style={styles.addressLine1}>{addr.addressLine1}</Text>
                {addr.addressLine2 ? <Text style={styles.addressLine2}>{addr.addressLine2}</Text> : null}
                <Text style={styles.addressLine2}>
                  {addr.city}, {addr.state} {addr.postalCode}
                </Text>
                <Text style={styles.addressLine2}>{addr.country}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(addr)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Address</Text>
              <TouchableOpacity onPress={() => { setShowModal(false); setForm({ ...EMPTY_FORM }); }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Address Type</Text>
              <View style={styles.chipRow}>
                {ADDRESS_TYPES.map(t => (
                  <TouchableOpacity key={t}
                    style={[styles.chip, form.addressType === t && styles.chipActive]}
                    onPress={() => set('addressType')(t)}>
                    <Text style={[styles.chipText, form.addressType === t && styles.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Address Line 1 *</Text>
              <TextInput style={styles.input} value={form.addressLine1} onChangeText={set('addressLine1')}
                placeholder="Building, street, area" />

              <Text style={styles.label}>Address Line 2</Text>
              <TextInput style={styles.input} value={form.addressLine2} onChangeText={set('addressLine2')}
                placeholder="Landmark, floor (optional)" />

              <Text style={styles.label}>City *</Text>
              <TextInput style={styles.input} value={form.city} onChangeText={set('city')} placeholder="e.g. Mumbai" />

              <Text style={styles.label}>State *</Text>
              <TextInput style={styles.input} value={form.state} onChangeText={set('state')} placeholder="e.g. Maharashtra" />

              <Text style={styles.label}>Country *</Text>
              <TextInput style={styles.input} value={form.country} onChangeText={set('country')} placeholder="India" />

              <Text style={styles.label}>Postal Code *</Text>
              <TextInput style={styles.input} value={form.postalCode} onChangeText={set('postalCode')}
                placeholder="e.g. 400050" keyboardType="numeric" maxLength={6} />

              <TouchableOpacity
                style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
                onPress={handleAdd}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Save Address</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 40 },
  addBtn: { width: 40, alignItems: 'flex-end' },
  topBarTitle: { fontSize: typography.fontSize.lg, fontWeight: 'bold' },
  list: { padding: spacing.md },
  empty: { alignItems: 'center', paddingTop: spacing.xl * 3 },
  emptyTitle: { fontSize: typography.fontSize.lg, fontWeight: 'bold', color: colors.text, marginTop: spacing.md },
  emptySub: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  card: {
    backgroundColor: colors.white, borderRadius: 12, padding: spacing.md,
    marginBottom: spacing.md, flexDirection: 'row', alignItems: 'flex-start',
  },
  cardLeft: { flex: 1 },
  typeTag: {
    backgroundColor: colors.primary + '15', borderRadius: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: spacing.xs,
  },
  typeText: { fontSize: typography.fontSize.xs, color: colors.primary, fontWeight: '600' },
  addressLine1: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text },
  addressLine2: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  deleteBtn: { padding: spacing.xs },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.lg, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: typography.fontSize.xl, fontWeight: 'bold' },
  label: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.backgroundSecondary ?? '#F5F5F5', borderWidth: 1, borderColor: colors.border,
    borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: typography.fontSize.md, color: colors.text,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.fontSize.sm, color: colors.text },
  chipTextActive: { color: colors.white, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    padding: spacing.md, borderRadius: 10, marginTop: spacing.xl, marginBottom: spacing.xl,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: colors.white, fontSize: typography.fontSize.md, fontWeight: '600' },
});

export default AddressesScreen;
