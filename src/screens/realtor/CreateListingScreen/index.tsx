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
import type { PropertyTypeDTO } from '@/api/types/property.types';

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

const STEP_ICONS = ['information-circle-outline', 'location-outline', 'layers-outline'];
const STEP_LABELS = ['Basic Info', 'Address', 'Details'];

const CreateListingScreen = ({ navigation }: any) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeDTO[]>([]);
  const [form, setForm] = useState<FormData>({
    title: '', description: '', listingType: 'SALE', price: '', propertyTypeId: '',
    addressLine1: '', city: '', state: '', country: 'USA', postalCode: '', locality: '',
    bedrooms: '', bathrooms: '', carpetArea: '', furnishedStatus: 'UNFURNISHED', depositAmount: '',
  });

  useEffect(() => {
    PropertyService.getPropertyTypes()
      .then(res => setPropertyTypes(res.data.data ?? []))
      .catch(() => {});
  }, []);

  const set = (key: keyof FormData) => (val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!form.title.trim()) { Alert.alert('Required', 'Title is required'); return false; }
      if (!form.description.trim()) { Alert.alert('Required', 'Description is required'); return false; }
      if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) {
        Alert.alert('Required', 'Enter a valid price'); return false;
      }
      if (!form.propertyTypeId) { Alert.alert('Required', 'Select a property type'); return false; }
    }
    if (step === 2) {
      if (!form.addressLine1.trim()) { Alert.alert('Required', 'Address is required'); return false; }
      if (!form.city.trim()) { Alert.alert('Required', 'City is required'); return false; }
      if (!form.state.trim()) { Alert.alert('Required', 'State is required'); return false; }
      if (!form.country.trim()) { Alert.alert('Required', 'Country is required'); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep(s => s + 1);
  };

  const handleSubmit = () => {
    if (!validateStep()) return;
    setSubmitting(true);

    const payload: Record<string, any> = {
      title: form.title,
      description: form.description,
      listingType: form.listingType,
      price: Number(form.price),
      propertyTypeId: Number(form.propertyTypeId),
      addressLine1: form.addressLine1,
      city: form.city,
      state: form.state,
      country: form.country,
      ...(form.postalCode && { postalCode: form.postalCode }),
      ...(form.locality && { locality: form.locality }),
      ...(form.bedrooms && { bedrooms: Number(form.bedrooms) }),
      ...(form.bathrooms && { bathrooms: Number(form.bathrooms) }),
      ...(form.carpetArea && { carpetArea: Number(form.carpetArea) }),
      ...(form.furnishedStatus && { furnishedStatus: form.furnishedStatus }),
      ...(form.depositAmount && { depositAmount: Number(form.depositAmount) }),
    };

    PropertyService.createProperty(payload)
      .then(res => {
        Alert.alert(
          'Listing Created',
          `"${res.data.data.title}" saved as Draft. Publish it from My Listings.`,
          [{ text: 'View Listings', onPress: () => navigation.navigate('MyListings') }]
        );
      })
      .catch(err => {
        const msg = err?.response?.data?.message ?? 'Failed to create listing';
        Alert.alert('Error', msg);
      })
      .finally(() => setSubmitting(false));
  };

  const renderStep1 = () => (
    <ScrollView style={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepSubtitle}>Tell us about the property you're listing</Text>

      <Text style={styles.label}>Title *</Text>
      <TextInput
        style={styles.input}
        value={form.title}
        onChangeText={set('title')}
        placeholder="e.g. 3BHK Apartment in Bandra"
        placeholderTextColor={colors.textLight}
        maxLength={200}
      />

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={form.description}
        onChangeText={set('description')}
        placeholder="Describe the property, features, amenities..."
        placeholderTextColor={colors.textLight}
        multiline
        numberOfLines={4}
        maxLength={5000}
        textAlignVertical="top"
      />

      <Text style={styles.label}>Listing Type *</Text>
      <View style={styles.chipRow}>
        {LISTING_TYPES.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, form.listingType === t && styles.chipActive]}
            onPress={() => set('listingType')(t)}
          >
            <Text style={[styles.chipText, form.listingType === t && styles.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Price ($) *</Text>
      <View style={styles.inputRow}>
        <Ionicons name="cash-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
        <TextInput
          style={styles.inputInner}
          value={form.price}
          onChangeText={set('price')}
          placeholder={form.listingType === 'SALE' ? 'e.g. 5000000' : 'Monthly e.g. 25000'}
          placeholderTextColor={colors.textLight}
          keyboardType="numeric"
        />
      </View>

      {form.listingType !== 'SALE' && (
        <>
          <Text style={styles.label}>Deposit Amount ($)</Text>
          <View style={styles.inputRow}>
            <Ionicons name="wallet-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.inputInner}
              value={form.depositAmount}
              onChangeText={set('depositAmount')}
              placeholder="e.g. 100000"
              placeholderTextColor={colors.textLight}
              keyboardType="numeric"
            />
          </View>
        </>
      )}

      <Text style={styles.label}>Property Type *</Text>
      <View style={styles.chipRow}>
        {propertyTypes.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.chip, form.propertyTypeId === String(t.id) && styles.chipActive]}
            onPress={() => set('propertyTypeId')(String(t.id))}
          >
            <Text style={[styles.chipText, form.propertyTypeId === String(t.id) && styles.chipTextActive]}>
              {t.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Property Address</Text>
      <Text style={styles.stepSubtitle}>Where is the property located?</Text>

      <Text style={styles.label}>Address Line 1 *</Text>
      <TextInput
        style={styles.input}
        value={form.addressLine1}
        onChangeText={set('addressLine1')}
        placeholder="Building name, street, area"
        placeholderTextColor={colors.textLight}
      />

      <Text style={styles.label}>Locality / Area</Text>
      <TextInput
        style={styles.input}
        value={form.locality}
        onChangeText={set('locality')}
        placeholder="e.g. Bandra West"
        placeholderTextColor={colors.textLight}
      />

      <View style={styles.row2}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            value={form.city}
            onChangeText={set('city')}
            placeholder="e.g. Austin"
            placeholderTextColor={colors.textLight}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>State *</Text>
          <TextInput
            style={styles.input}
            value={form.state}
            onChangeText={set('state')}
            placeholder="e.g. MH"
            placeholderTextColor={colors.textLight}
          />
        </View>
      </View>

      <View style={styles.row2}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Country *</Text>
          <TextInput
            style={styles.input}
            value={form.country}
            onChangeText={set('country')}
            placeholder="USA"
            placeholderTextColor={colors.textLight}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Postal Code</Text>
          <TextInput
            style={styles.input}
            value={form.postalCode}
            onChangeText={set('postalCode')}
            placeholder="e.g. 400050"
            placeholderTextColor={colors.textLight}
            keyboardType="numeric"
            maxLength={6}
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Property Details</Text>
      <Text style={styles.stepSubtitle}>Specific features and amenities</Text>

      <View style={styles.row2}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Bedrooms</Text>
          <TextInput
            style={styles.input}
            value={form.bedrooms}
            onChangeText={set('bedrooms')}
            placeholder="e.g. 3"
            placeholderTextColor={colors.textLight}
            keyboardType="numeric"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Bathrooms</Text>
          <TextInput
            style={styles.input}
            value={form.bathrooms}
            onChangeText={set('bathrooms')}
            placeholder="e.g. 2"
            placeholderTextColor={colors.textLight}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text style={styles.label}>Carpet Area (sq ft)</Text>
      <TextInput
        style={styles.input}
        value={form.carpetArea}
        onChangeText={set('carpetArea')}
        placeholder="e.g. 1200"
        placeholderTextColor={colors.textLight}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Furnished Status</Text>
      <View style={styles.chipRow}>
        {FURNISHED_OPTIONS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, form.furnishedStatus === f && styles.chipActive]}
            onPress={() => set('furnishedStatus')(f)}
          >
            <Text style={[styles.chipText, form.furnishedStatus === f && styles.chipTextActive]}>
              {f.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="document-text-outline" size={18} color={colors.primary} />
          <Text style={styles.summaryTitle}>Preview</Text>
        </View>
        <Text style={styles.summaryLine}>{form.title}</Text>
        <Text style={styles.summaryPrice}>
          {form.listingType} · ${Number(form.price || 0).toLocaleString('en-US')}
        </Text>
        <Text style={styles.summaryLocation}>{form.addressLine1}{form.city ? `, ${form.city}` : ''}</Text>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        {step > 1 ? (
          <TouchableOpacity onPress={() => setStep(s => s - 1)} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.topBarTitle}>Create Listing</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{step}/{TOTAL_STEPS}</Text>
        </View>
      </View>

      {/* Step indicators */}
      <View style={styles.stepIndicator}>
        {STEP_LABELS.map((label, i) => {
          const idx = i + 1;
          const active = idx === step;
          const done = idx < step;
          return (
            <React.Fragment key={label}>
              <View style={styles.stepDot}>
                <View style={[styles.dotCircle, (active || done) && styles.dotCircleActive]}>
                  {done ? (
                    <Ionicons name="checkmark" size={12} color={colors.white} />
                  ) : (
                    <Ionicons name={STEP_ICONS[i] as any} size={12} color={active ? colors.white : colors.textLight} />
                  )}
                </View>
                <Text style={[styles.dotLabel, active && styles.dotLabelActive]}>{label}</Text>
              </View>
              {i < STEP_LABELS.length - 1 && (
                <View style={[styles.stepLine, done && styles.stepLineDone]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Step content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      {/* Footer */}
      <View style={styles.footer}>
        {step < TOTAL_STEPS ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
            <Text style={styles.primaryBtnText}>Next Step</Text>
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
                <Ionicons name="cloud-upload-outline" size={18} color={colors.white} />
                <Text style={styles.primaryBtnText}>Save as Draft</Text>
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
  iconBtn: {
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
  stepBadge: {
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  stepBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },

  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  stepDot: { alignItems: 'center', gap: 4 },
  dotCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    fontWeight: typography.fontWeight.medium,
  },
  dotLabelActive: { color: colors.primary, fontWeight: typography.fontWeight.bold },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginBottom: 16,
    marginHorizontal: 4,
  },
  stepLineDone: { backgroundColor: colors.primary },

  form: { flex: 1, padding: spacing.lg },
  stepTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
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
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 52,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  inputIcon: {},
  inputInner: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  textarea: { height: 100, paddingTop: spacing.sm, paddingVertical: spacing.sm },
  row2: { flexDirection: 'row', gap: spacing.sm },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  chipTextActive: { color: colors.white, fontWeight: typography.fontWeight.bold },

  summaryCard: {
    backgroundColor: colors.primarySurface,
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  summaryTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  summaryLine: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  summaryPrice: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  summaryLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  footer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 14,
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

export default CreateListingScreen;
