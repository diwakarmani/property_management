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
import { PropertyService } from '@/api/services/property.service';
import type { PropertyDTO, PropertyTypeDTO } from '@/api/types/property.types';

interface FormData {
  title: string;
  description: string;
  listingType: string;
  price: string;
  propertyTypeId: string;
  addressLine1: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  locality: string;
  bedrooms: string;
  bathrooms: string;
  carpetArea: string;
  furnishedStatus: string;
  depositAmount: string;
}

const LISTING_TYPES = ['SALE', 'RENT', 'LEASE'];
const FURNISHED_OPTIONS = ['FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED'];
const TOTAL_STEPS = 3;

const EditListingScreen = ({ navigation, route }: any) => {
  const propertyId: number = route?.params?.propertyId;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeDTO[]>([]);
  const [form, setForm] = useState<FormData>({
    title: '', description: '', listingType: 'SALE', price: '', propertyTypeId: '',
    addressLine1: '', city: '', state: '', country: 'India', postalCode: '', locality: '',
    bedrooms: '', bathrooms: '', carpetArea: '', furnishedStatus: 'UNFURNISHED', depositAmount: '',
  });

  useEffect(() => {
    PropertyService.getPropertyTypes()
      .then(res => setPropertyTypes(res.data.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!propertyId) { setLoading(false); return; }
    PropertyService.getById(propertyId)
      .then(res => {
        const p: PropertyDTO = res.data.data;
        setForm({
          title: p.title ?? '',
          description: p.description ?? '',
          listingType: p.listingType ?? 'SALE',
          price: p.price != null ? String(p.price) : '',
          propertyTypeId: '', // will be matched below
          addressLine1: p.addressLine1 ?? '',
          city: p.city ?? '',
          state: p.state ?? '',
          country: p.country ?? 'India',
          postalCode: p.postalCode ?? '',
          locality: p.locality ?? '',
          bedrooms: p.bedrooms != null ? String(p.bedrooms) : '',
          bathrooms: p.bathrooms != null ? String(p.bathrooms) : '',
          carpetArea: p.carpetArea != null ? String(p.carpetArea) : '',
          furnishedStatus: p.furnishedStatus ?? 'UNFURNISHED',
          depositAmount: p.depositAmount != null ? String(p.depositAmount) : '',
        });
        // match propertyTypeId by name against loaded types
        setPropertyTypes(prev => {
          const match = prev.find(t => t.name === p.propertyTypeName);
          if (match) setForm(f => ({ ...f, propertyTypeId: String(match.id) }));
          return prev;
        });
      })
      .catch(() => Alert.alert('Error', 'Failed to load property details'))
      .finally(() => setLoading(false));
  }, [propertyId]);

  // When types load after property, try to match
  useEffect(() => {
    if (propertyTypes.length > 0 && form.propertyTypeId === '') {
      PropertyService.getById(propertyId)
        .then(res => {
          const name = res.data.data?.propertyTypeName;
          const match = propertyTypes.find(t => t.name === name);
          if (match) setForm(f => ({ ...f, propertyTypeId: String(match.id) }));
        })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyTypes]);

  const set = (key: keyof FormData) => (val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!form.title.trim()) { Alert.alert('Required', 'Title is required'); return false; }
      if (!form.description.trim()) { Alert.alert('Required', 'Description is required'); return false; }
      if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) {
        Alert.alert('Required', 'Enter a valid price'); return false;
      }
    }
    if (step === 2) {
      if (!form.addressLine1.trim()) { Alert.alert('Required', 'Address is required'); return false; }
      if (!form.city.trim()) { Alert.alert('Required', 'City is required'); return false; }
      if (!form.state.trim()) { Alert.alert('Required', 'State is required'); return false; }
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateStep()) return;
    setSubmitting(true);

    const payload: Record<string, any> = {
      title: form.title,
      description: form.description,
      listingType: form.listingType,
      price: Number(form.price),
      addressLine1: form.addressLine1,
      city: form.city,
      state: form.state,
      country: form.country,
      ...(form.propertyTypeId && { propertyTypeId: Number(form.propertyTypeId) }),
      ...(form.postalCode && { postalCode: form.postalCode }),
      ...(form.locality && { locality: form.locality }),
      ...(form.bedrooms && { bedrooms: Number(form.bedrooms) }),
      ...(form.bathrooms && { bathrooms: Number(form.bathrooms) }),
      ...(form.carpetArea && { carpetArea: Number(form.carpetArea) }),
      ...(form.furnishedStatus && { furnishedStatus: form.furnishedStatus }),
      ...(form.depositAmount && { depositAmount: Number(form.depositAmount) }),
    };

    PropertyService.updateProperty(propertyId, payload)
      .then(() => {
        Alert.alert('Updated', 'Listing updated successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      })
      .catch(err => {
        const msg = err?.response?.data?.message ?? 'Failed to update listing';
        Alert.alert('Error', msg);
      })
      .finally(() => setSubmitting(false));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderStep1 = () => (
    <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepTitle}>Basic Information</Text>

      <Text style={styles.label}>Title *</Text>
      <TextInput style={styles.input} value={form.title} onChangeText={set('title')}
        placeholder="e.g. 3BHK Apartment in Bandra" maxLength={200} />

      <Text style={styles.label}>Description *</Text>
      <TextInput style={[styles.input, styles.textarea]} value={form.description}
        onChangeText={set('description')} placeholder="Describe the property..."
        multiline numberOfLines={4} maxLength={5000} />

      <Text style={styles.label}>Listing Type</Text>
      <View style={styles.chipRow}>
        {LISTING_TYPES.map(t => (
          <TouchableOpacity key={t}
            style={[styles.chip, form.listingType === t && styles.chipActive]}
            onPress={() => set('listingType')(t)}>
            <Text style={[styles.chipText, form.listingType === t && styles.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Price (₹) *</Text>
      <TextInput style={styles.input} value={form.price} onChangeText={set('price')}
        placeholder="e.g. 5000000" keyboardType="numeric" />

      {form.listingType !== 'SALE' && (
        <>
          <Text style={styles.label}>Deposit Amount (₹)</Text>
          <TextInput style={styles.input} value={form.depositAmount}
            onChangeText={set('depositAmount')} placeholder="e.g. 100000" keyboardType="numeric" />
        </>
      )}

      <Text style={styles.label}>Property Type</Text>
      <View style={styles.chipRow}>
        {propertyTypes.map(t => (
          <TouchableOpacity key={t.id}
            style={[styles.chip, form.propertyTypeId === String(t.id) && styles.chipActive]}
            onPress={() => set('propertyTypeId')(String(t.id))}>
            <Text style={[styles.chipText, form.propertyTypeId === String(t.id) && styles.chipTextActive]}>
              {t.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepTitle}>Property Address</Text>

      <Text style={styles.label}>Address Line 1 *</Text>
      <TextInput style={styles.input} value={form.addressLine1} onChangeText={set('addressLine1')}
        placeholder="Building name, street, area" />

      <Text style={styles.label}>Locality / Area</Text>
      <TextInput style={styles.input} value={form.locality} onChangeText={set('locality')}
        placeholder="e.g. Bandra West" />

      <Text style={styles.label}>City *</Text>
      <TextInput style={styles.input} value={form.city} onChangeText={set('city')} placeholder="e.g. Mumbai" />

      <Text style={styles.label}>State *</Text>
      <TextInput style={styles.input} value={form.state} onChangeText={set('state')} placeholder="e.g. Maharashtra" />

      <Text style={styles.label}>Country</Text>
      <TextInput style={styles.input} value={form.country} onChangeText={set('country')} placeholder="India" />

      <Text style={styles.label}>Postal Code</Text>
      <TextInput style={styles.input} value={form.postalCode} onChangeText={set('postalCode')}
        placeholder="e.g. 400050" keyboardType="numeric" maxLength={6} />
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepTitle}>Property Details</Text>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Bedrooms</Text>
          <TextInput style={styles.input} value={form.bedrooms} onChangeText={set('bedrooms')}
            placeholder="e.g. 3" keyboardType="numeric" />
        </View>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Bathrooms</Text>
          <TextInput style={styles.input} value={form.bathrooms} onChangeText={set('bathrooms')}
            placeholder="e.g. 2" keyboardType="numeric" />
        </View>
      </View>

      <Text style={styles.label}>Carpet Area (sq ft)</Text>
      <TextInput style={styles.input} value={form.carpetArea} onChangeText={set('carpetArea')}
        placeholder="e.g. 1200" keyboardType="numeric" />

      <Text style={styles.label}>Furnished Status</Text>
      <View style={styles.chipRow}>
        {FURNISHED_OPTIONS.map(f => (
          <TouchableOpacity key={f}
            style={[styles.chip, form.furnishedStatus === f && styles.chipActive]}
            onPress={() => set('furnishedStatus')(f)}>
            <Text style={[styles.chipText, form.furnishedStatus === f && styles.chipTextActive]}>
              {f.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Summary</Text>
        <Text style={styles.summaryLine}>{form.title}</Text>
        <Text style={styles.summaryLine}>{form.listingType} · ₹{Number(form.price).toLocaleString('en-IN')}</Text>
        <Text style={styles.summaryLine}>{form.addressLine1}, {form.city}</Text>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        {step > 1 ? (
          <TouchableOpacity onPress={() => setStep(s => s - 1)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.topBarTitle}>Edit Listing</Text>
        <Text style={styles.stepCount}>{step}/{TOTAL_STEPS}</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
      </View>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      <View style={styles.footer}>
        {step < TOTAL_STEPS ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={() => { if (validateStep()) setStep(s => s + 1); }}>
            <Text style={styles.primaryBtnText}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.white} />
                <Text style={styles.primaryBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
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
  backBtn: { width: 40, alignItems: 'flex-start' },
  topBarTitle: { fontSize: typography.fontSize.lg, fontWeight: 'bold' },
  stepCount: { fontSize: typography.fontSize.sm, color: colors.textSecondary, width: 40, textAlign: 'right' },
  progressBar: { height: 3, backgroundColor: colors.border },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  form: { flex: 1, padding: spacing.lg },
  stepTitle: { fontSize: typography.fontSize.xl, fontWeight: 'bold', color: colors.text, marginBottom: spacing.lg },
  label: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: typography.fontSize.md, color: colors.text,
  },
  textarea: { height: 100, textAlignVertical: 'top', paddingTop: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.fontSize.sm, color: colors.text },
  chipTextActive: { color: colors.white, fontWeight: '600' },
  row: { flexDirection: 'row', gap: spacing.md },
  halfInput: { flex: 1 },
  summaryCard: {
    backgroundColor: colors.primary + '10', borderRadius: 12, padding: spacing.md,
    marginTop: spacing.xl, gap: spacing.xs, borderLeftWidth: 4, borderLeftColor: colors.primary,
  },
  summaryTitle: { fontSize: typography.fontSize.md, fontWeight: 'bold', color: colors.primary },
  summaryLine: { fontSize: typography.fontSize.sm, color: colors.text },
  footer: { padding: spacing.md, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  primaryBtn: {
    backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', padding: spacing.md, borderRadius: 10, gap: spacing.sm,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: colors.white, fontSize: typography.fontSize.md, fontWeight: '600' },
});

export default EditListingScreen;
