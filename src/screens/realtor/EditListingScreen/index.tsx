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
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryClient';
import { PropertyService } from '@/api/services/property.service';
import type { PropertyDTO, PropertyTypeDTO } from '@/api/types/property.types';

interface FormData {
  title: string;
  description: string;
  listingType: string;
  price: string;
  depositAmount: string;
  maintenanceCharge: string;
  propertyTypeId: string;
  addressLine1: string;
  locality: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  bedrooms: string;
  bathrooms: string;
  balconies: string;
  carpetArea: string;
  builtUpArea: string;
  floorNumber: string;
  totalFloors: string;
  furnishedStatus: string;
  facingDirection: string;
  parkingCovered: string;
  parkingOpen: string;
  ageOfProperty: string;
  ownershipType: string;
  possessionStatus: string;
  kitchenType: string;
  waterSupply: string;
}

const LISTING_TYPES = ['SALE', 'RENT', 'LEASE'];
const FURNISHED_OPTIONS = ['FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED'];
const FACING_OPTIONS = ['NORTH', 'SOUTH', 'EAST', 'WEST', 'NORTH_EAST', 'NORTH_WEST', 'SOUTH_EAST', 'SOUTH_WEST'];
const OWNERSHIP_OPTIONS = [
  { key: 'FREEHOLD', label: 'Freehold' },
  { key: 'LEASEHOLD', label: 'Leasehold' },
  { key: 'CO_OPERATIVE_SOCIETY', label: 'Co-op Society' },
  { key: 'POWER_OF_ATTORNEY', label: 'Power of Attorney' },
];
const POSSESSION_OPTIONS = [
  { key: 'READY_TO_MOVE', label: 'Ready to Move' },
  { key: 'WITHIN_15_DAYS', label: '15 Days' },
  { key: 'WITHIN_1_MONTH', label: '1 Month' },
  { key: 'WITHIN_3_MONTHS', label: '3 Months' },
  { key: 'WITHIN_6_MONTHS', label: '6 Months' },
  { key: 'WITHIN_1_YEAR', label: '1 Year' },
  { key: 'UNDER_CONSTRUCTION', label: 'Under Construction' },
];
const KITCHEN_OPTIONS = [
  { key: 'MODULAR_KITCHEN', label: 'Modular' },
  { key: 'OPEN_KITCHEN', label: 'Open Kitchen' },
  { key: 'CLOSED_KITCHEN', label: 'Closed Kitchen' },
  { key: 'NO_KITCHEN', label: 'No Kitchen' },
];
const WATER_OPTIONS = [
  { key: 'CORPORATION_WATER', label: 'Corporation' },
  { key: 'BOREWELL', label: 'Borewell' },
  { key: 'BOTH', label: 'Both' },
  { key: '24_7_SUPPLY', label: '24/7 Supply' },
  { key: 'TANKER', label: 'Tanker' },
];

const TOTAL_STEPS = 4;
const STEP_ICONS = ['information-circle-outline', 'location-outline', 'layers-outline', 'star-outline'];
const STEP_LABELS = ['Basic', 'Location', 'Specs', 'Profile'];

const EMPTY_FORM: FormData = {
  title: '', description: '', listingType: 'SALE', price: '', depositAmount: '',
  maintenanceCharge: '', propertyTypeId: '',
  addressLine1: '', locality: '', city: '', state: '', country: 'USA', postalCode: '',
  bedrooms: '', bathrooms: '', balconies: '', carpetArea: '', builtUpArea: '',
  floorNumber: '', totalFloors: '', furnishedStatus: 'UNFURNISHED', facingDirection: '',
  parkingCovered: '', parkingOpen: '', ageOfProperty: '',
  ownershipType: '', possessionStatus: '', kitchenType: '', waterSupply: '',
};

const EditListingScreen = ({ navigation, route }: any) => {
  const propertyId: number = route?.params?.propertyId;
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeDTO[]>([]);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

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
          propertyTypeId: '',
          addressLine1: p.addressLine1 ?? '',
          locality: p.locality ?? '',
          city: p.city ?? '',
          state: p.state ?? '',
          country: p.country ?? 'USA',
          postalCode: p.postalCode ?? '',
          depositAmount: p.depositAmount != null ? String(p.depositAmount) : '',
          maintenanceCharge: p.maintenanceCharge != null ? String(p.maintenanceCharge) : '',
          bedrooms: p.bedrooms != null ? String(p.bedrooms) : '',
          bathrooms: p.bathrooms != null ? String(p.bathrooms) : '',
          balconies: p.balconies != null ? String(p.balconies) : '',
          carpetArea: p.carpetArea != null ? String(p.carpetArea) : '',
          builtUpArea: p.builtUpArea != null ? String(p.builtUpArea) : '',
          floorNumber: p.floorNumber != null ? String(p.floorNumber) : '',
          totalFloors: p.totalFloors != null ? String(p.totalFloors) : '',
          furnishedStatus: p.furnishedStatus ?? 'UNFURNISHED',
          facingDirection: p.facingDirection ?? '',
          parkingCovered: p.parkingCovered != null ? String(p.parkingCovered) : '',
          parkingOpen: p.parkingOpen != null ? String(p.parkingOpen) : '',
          ageOfProperty: p.ageOfProperty != null ? String(p.ageOfProperty) : '',
          ownershipType: p.ownershipType ?? '',
          possessionStatus: p.possessionStatus ?? '',
          kitchenType: p.kitchenType ?? '',
          waterSupply: p.waterSupply ?? '',
        });
        setPropertyTypes(prev => {
          const match = prev.find(t => t.name === p.propertyTypeName);
          if (match) setForm(f => ({ ...f, propertyTypeId: String(match.id) }));
          return prev;
        });
      })
      .catch(() => Alert.alert('Error', 'Failed to load property details'))
      .finally(() => setLoading(false));
  }, [propertyId]);

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

  const toggle = (key: keyof FormData, val: string) =>
    setForm(prev => ({ ...prev, [key]: prev[key] === val ? '' : val }));

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
      ...(form.depositAmount && { depositAmount: Number(form.depositAmount) }),
      ...(form.maintenanceCharge && { maintenanceCharge: Number(form.maintenanceCharge) }),
      ...(form.bedrooms && { bedrooms: Number(form.bedrooms) }),
      ...(form.bathrooms && { bathrooms: Number(form.bathrooms) }),
      ...(form.balconies && { balconies: Number(form.balconies) }),
      ...(form.carpetArea && { carpetArea: Number(form.carpetArea) }),
      ...(form.builtUpArea && { builtUpArea: Number(form.builtUpArea) }),
      ...(form.floorNumber && { floorNumber: Number(form.floorNumber) }),
      ...(form.totalFloors && { totalFloors: Number(form.totalFloors) }),
      ...(form.parkingCovered && { parkingCovered: Number(form.parkingCovered) }),
      ...(form.parkingOpen && { parkingOpen: Number(form.parkingOpen) }),
      ...(form.ageOfProperty && { ageOfProperty: Number(form.ageOfProperty) }),
      ...(form.furnishedStatus && { furnishedStatus: form.furnishedStatus }),
      ...(form.facingDirection && { facingDirection: form.facingDirection }),
      ...(form.ownershipType && { ownershipType: form.ownershipType }),
      ...(form.possessionStatus && { possessionStatus: form.possessionStatus }),
      ...(form.kitchenType && { kitchenType: form.kitchenType }),
      ...(form.waterSupply && { waterSupply: form.waterSupply }),
    };

    PropertyService.updateProperty(propertyId, payload)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.myListings });
        queryClient.invalidateQueries({ queryKey: queryKeys.property(propertyId) });
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

  // ── Step renders ────────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <ScrollView style={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Basic Information</Text>

      <Text style={styles.label}>Title *</Text>
      <TextInput style={styles.input} value={form.title} onChangeText={set('title')}
        placeholder="e.g. 3BHK Apartment in Bandra" placeholderTextColor={colors.textLight} maxLength={200} />

      <Text style={styles.label}>Description * <Text style={styles.labelHint}>(up to 5000 chars)</Text></Text>
      <TextInput style={[styles.input, styles.textarea]} value={form.description}
        onChangeText={set('description')}
        placeholder="Describe the property in detail..."
        placeholderTextColor={colors.textLight}
        multiline numberOfLines={6} maxLength={5000} textAlignVertical="top" />
      <Text style={styles.charCount}>{form.description.length}/5000</Text>

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

      <Text style={styles.label}>Price ($) *</Text>
      <View style={styles.inputRow}>
        <Ionicons name="cash-outline" size={18} color={colors.textLight} />
        <TextInput style={styles.inputInner} value={form.price} onChangeText={set('price')}
          placeholder="e.g. 5000000" placeholderTextColor={colors.textLight} keyboardType="numeric" />
      </View>

      {form.listingType !== 'SALE' && (
        <>
          <Text style={styles.label}>Deposit Amount ($)</Text>
          <View style={styles.inputRow}>
            <Ionicons name="wallet-outline" size={18} color={colors.textLight} />
            <TextInput style={styles.inputInner} value={form.depositAmount} onChangeText={set('depositAmount')}
              placeholder="e.g. 100000" placeholderTextColor={colors.textLight} keyboardType="numeric" />
          </View>
          <Text style={styles.label}>Maintenance Charge ($/mo)</Text>
          <View style={styles.inputRow}>
            <Ionicons name="construct-outline" size={18} color={colors.textLight} />
            <TextInput style={styles.inputInner} value={form.maintenanceCharge} onChangeText={set('maintenanceCharge')}
              placeholder="e.g. 2000" placeholderTextColor={colors.textLight} keyboardType="numeric" />
          </View>
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
    <ScrollView style={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Property Address</Text>

      <Text style={styles.label}>Address Line 1 *</Text>
      <TextInput style={styles.input} value={form.addressLine1} onChangeText={set('addressLine1')}
        placeholder="Building name, street, area" placeholderTextColor={colors.textLight} />

      <Text style={styles.label}>Locality / Area</Text>
      <TextInput style={styles.input} value={form.locality} onChangeText={set('locality')}
        placeholder="e.g. Bandra West" placeholderTextColor={colors.textLight} />

      <View style={styles.row2}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>City *</Text>
          <TextInput style={styles.input} value={form.city} onChangeText={set('city')}
            placeholder="e.g. Austin" placeholderTextColor={colors.textLight} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>State *</Text>
          <TextInput style={styles.input} value={form.state} onChangeText={set('state')}
            placeholder="e.g. TX" placeholderTextColor={colors.textLight} />
        </View>
      </View>

      <View style={styles.row2}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Country</Text>
          <TextInput style={styles.input} value={form.country} onChangeText={set('country')}
            placeholder="USA" placeholderTextColor={colors.textLight} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Postal Code</Text>
          <TextInput style={styles.input} value={form.postalCode} onChangeText={set('postalCode')}
            placeholder="e.g. 400050" placeholderTextColor={colors.textLight} keyboardType="numeric" maxLength={10} />
        </View>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Property Specifications</Text>

      <View style={styles.row3}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Bedrooms</Text>
          <TextInput style={styles.input} value={form.bedrooms} onChangeText={set('bedrooms')}
            placeholder="3" placeholderTextColor={colors.textLight} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Bathrooms</Text>
          <TextInput style={styles.input} value={form.bathrooms} onChangeText={set('bathrooms')}
            placeholder="2" placeholderTextColor={colors.textLight} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Balconies</Text>
          <TextInput style={styles.input} value={form.balconies} onChangeText={set('balconies')}
            placeholder="1" placeholderTextColor={colors.textLight} keyboardType="numeric" />
        </View>
      </View>

      <View style={styles.row2}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Carpet Area (sqft)</Text>
          <TextInput style={styles.input} value={form.carpetArea} onChangeText={set('carpetArea')}
            placeholder="1200" placeholderTextColor={colors.textLight} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Built-up Area (sqft)</Text>
          <TextInput style={styles.input} value={form.builtUpArea} onChangeText={set('builtUpArea')}
            placeholder="1400" placeholderTextColor={colors.textLight} keyboardType="numeric" />
        </View>
      </View>

      <View style={styles.row3}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Floor No.</Text>
          <TextInput style={styles.input} value={form.floorNumber} onChangeText={set('floorNumber')}
            placeholder="5" placeholderTextColor={colors.textLight} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Total Floors</Text>
          <TextInput style={styles.input} value={form.totalFloors} onChangeText={set('totalFloors')}
            placeholder="12" placeholderTextColor={colors.textLight} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Age (yrs)</Text>
          <TextInput style={styles.input} value={form.ageOfProperty} onChangeText={set('ageOfProperty')}
            placeholder="0=New" placeholderTextColor={colors.textLight} keyboardType="numeric" />
        </View>
      </View>

      <View style={styles.row2}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Covered Parking</Text>
          <TextInput style={styles.input} value={form.parkingCovered} onChangeText={set('parkingCovered')}
            placeholder="1" placeholderTextColor={colors.textLight} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Open Parking</Text>
          <TextInput style={styles.input} value={form.parkingOpen} onChangeText={set('parkingOpen')}
            placeholder="0" placeholderTextColor={colors.textLight} keyboardType="numeric" />
        </View>
      </View>

      <Text style={styles.label}>Furnishing</Text>
      <View style={styles.chipRow}>
        {FURNISHED_OPTIONS.map(f => (
          <TouchableOpacity key={f}
            style={[styles.chip, form.furnishedStatus === f && styles.chipActive]}
            onPress={() => toggle('furnishedStatus', f)}>
            <Text style={[styles.chipText, form.furnishedStatus === f && styles.chipTextActive]}>
              {f.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Facing Direction</Text>
      <View style={styles.chipRow}>
        {FACING_OPTIONS.map(f => (
          <TouchableOpacity key={f}
            style={[styles.chip, form.facingDirection === f && styles.chipActive]}
            onPress={() => toggle('facingDirection', f)}>
            <Text style={[styles.chipText, form.facingDirection === f && styles.chipTextActive]}>
              {f.replace(/_/g, '-')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderStep4 = () => (
    <ScrollView style={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Property Profile</Text>

      <Text style={styles.label}>Ownership Type</Text>
      <View style={styles.chipRow}>
        {OWNERSHIP_OPTIONS.map(o => (
          <TouchableOpacity key={o.key}
            style={[styles.chip, form.ownershipType === o.key && styles.chipActive]}
            onPress={() => toggle('ownershipType', o.key)}>
            <Text style={[styles.chipText, form.ownershipType === o.key && styles.chipTextActive]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Possession</Text>
      <View style={styles.chipRow}>
        {POSSESSION_OPTIONS.map(o => (
          <TouchableOpacity key={o.key}
            style={[styles.chip, form.possessionStatus === o.key && styles.chipActive]}
            onPress={() => toggle('possessionStatus', o.key)}>
            <Text style={[styles.chipText, form.possessionStatus === o.key && styles.chipTextActive]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Kitchen Type</Text>
      <View style={styles.chipRow}>
        {KITCHEN_OPTIONS.map(o => (
          <TouchableOpacity key={o.key}
            style={[styles.chip, form.kitchenType === o.key && styles.chipActive]}
            onPress={() => toggle('kitchenType', o.key)}>
            <Text style={[styles.chipText, form.kitchenType === o.key && styles.chipTextActive]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Water Supply</Text>
      <View style={styles.chipRow}>
        {WATER_OPTIONS.map(o => (
          <TouchableOpacity key={o.key}
            style={[styles.chip, form.waterSupply === o.key && styles.chipActive]}
            onPress={() => toggle('waterSupply', o.key)}>
            <Text style={[styles.chipText, form.waterSupply === o.key && styles.chipTextActive]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Summary</Text>
        <Text style={styles.summaryLine}>{form.title}</Text>
        <Text style={styles.summaryLine}>{form.listingType} · ${Number(form.price || 0).toLocaleString('en-US')}</Text>
        <Text style={styles.summaryLine}>{[form.addressLine1, form.city].filter(Boolean).join(', ')}</Text>
      </View>
    </ScrollView>
  );

  // ── Layout ──────────────────────────────────────────────────────────────────

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

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      <View style={styles.footer}>
        {step < TOTAL_STEPS ? (
          <TouchableOpacity style={styles.primaryBtn}
            onPress={() => { if (validateStep()) setStep(s => s + 1); }}>
            <Text style={styles.primaryBtnText}>Next Step</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
            onPress={handleSubmit} disabled={submitting}>
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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: colors.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  topBarTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text },
  stepBadge: { backgroundColor: colors.primarySurface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  stepBadgeText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.primary },

  stepIndicator: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  stepDot: { alignItems: 'center', gap: 4 },
  dotCircle: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: colors.backgroundSecondary,
    borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  dotCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotLabel: { fontSize: 10, color: colors.textLight, fontWeight: typography.fontWeight.medium },
  dotLabelActive: { color: colors.primary, fontWeight: typography.fontWeight.bold },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginBottom: 16, marginHorizontal: 3 },
  stepLineDone: { backgroundColor: colors.primary },

  form: { flex: 1, padding: spacing.lg },
  stepTitle: {
    fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold,
    color: colors.text, marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary, marginBottom: 6, marginTop: spacing.md, letterSpacing: 0.2,
  },
  labelHint: { fontWeight: typography.fontWeight.normal, color: colors.textLight },
  charCount: { fontSize: 11, color: colors.textLight, textAlign: 'right', marginTop: 3 },

  input: {
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: spacing.md, height: 50,
    fontSize: typography.fontSize.md, color: colors.text,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, height: 50,
    paddingHorizontal: spacing.md, gap: spacing.sm,
  },
  inputInner: { flex: 1, fontSize: typography.fontSize.md, color: colors.text },
  textarea: { height: 120, paddingTop: spacing.sm, paddingVertical: spacing.sm },

  row2: { flexDirection: 'row', gap: spacing.sm },
  row3: { flexDirection: 'row', gap: spacing.sm },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontWeight: typography.fontWeight.medium },
  chipTextActive: { color: colors.white, fontWeight: typography.fontWeight.bold },

  summaryCard: {
    backgroundColor: colors.primarySurface, borderRadius: 16, padding: spacing.md,
    marginTop: spacing.xl, borderWidth: 1, borderColor: colors.border, gap: spacing.xs,
  },
  summaryTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.primary },
  summaryLine: { fontSize: typography.fontSize.sm, color: colors.text },

  footer: {
    padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 4,
  },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, height: 52, borderRadius: 14,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  primaryBtnDisabled: { opacity: 0.55 },
  primaryBtnText: { color: colors.white, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
});

export default EditListingScreen;
