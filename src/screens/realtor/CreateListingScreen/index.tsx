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
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { colors, typography, spacing } from '@/theme';
import { PropertyService } from '@/api/services/property.service';
import { LocationService } from '@/api/services/location.service';
import type { PropertyTypeDTO } from '@/api/types/property.types';
import type { Locality } from '@/api/types/location.type';
import type { RootState } from '@/store';

interface FormData {
  // Step 1
  title: string;
  description: string;
  listingType: string;
  price: string;
  depositAmount: string;
  maintenanceCharge: string;
  propertyTypeId: string;
  // Step 2
  addressLine1: string;
  locality: string;        // display name only
  localityId: number | null; // required by backend
  city: string;
  state: string;
  country: string;
  postalCode: string;
  // Step 3 — specs
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
  // Step 4 — profile & features
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
const STEP_ICONS = [
  'information-circle-outline',
  'location-outline',
  'layers-outline',
  'star-outline',
];
const STEP_LABELS = ['Basic', 'Location', 'Specs', 'Profile'];

const INITIAL_FORM: FormData = {
  title: '', description: '', listingType: 'SALE', price: '', depositAmount: '',
  maintenanceCharge: '', propertyTypeId: '',
  addressLine1: '', locality: '', localityId: null, city: '', state: '', country: 'USA', postalCode: '',
  bedrooms: '', bathrooms: '', balconies: '', carpetArea: '', builtUpArea: '',
  floorNumber: '', totalFloors: '', furnishedStatus: 'UNFURNISHED', facingDirection: '',
  parkingCovered: '', parkingOpen: '', ageOfProperty: '',
  ownershipType: '', possessionStatus: '', kitchenType: '', waterSupply: '',
};

const CreateListingScreen = ({ navigation }: any) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeDTO[]>([]);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [localitySearch, setLocalitySearch] = useState('');
  const [localityModal, setLocalityModal] = useState(false);

  const selectedCity = useSelector((state: RootState) => state.location.selectedCity);

  useEffect(() => {
    PropertyService.getPropertyTypes()
      .then(res => setPropertyTypes(res.data.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCity?.id) return;
    LocationService.getLocalities(selectedCity.id)
      .then(res => setLocalities(res.data.data ?? []))
      .catch(() => {});
    setForm(prev => ({
      ...prev,
      city: prev.city || selectedCity.name,
    }));
  }, [selectedCity?.id]);

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
      if (!form.propertyTypeId) { Alert.alert('Required', 'Select a property type'); return false; }
    }
    if (step === 2) {
      if (!form.addressLine1.trim()) { Alert.alert('Required', 'Address is required'); return false; }
      if (!form.localityId) { Alert.alert('Required', 'Select a neighbourhood / locality'); return false; }
      if (!form.city.trim()) { Alert.alert('Required', 'City is required'); return false; }
      if (!form.state.trim()) { Alert.alert('Required', 'State is required'); return false; }
      if (!form.country.trim()) { Alert.alert('Required', 'Country is required'); return false; }
    }
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep(s => s + 1); };
  const handleBack = () => setStep(s => s - 1);

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
      localityId: form.localityId,
      city: form.city,
      state: form.state,
      country: form.country,
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

  // ── Step renders ────────────────────────────────────────────────────────────

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

      <Text style={styles.label}>Description * <Text style={styles.labelHint}>(describe features, surroundings, etc.)</Text></Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={form.description}
        onChangeText={set('description')}
        placeholder="Describe the property in detail — surroundings, special features, neighbourhood, access to metro, schools, hospitals..."
        placeholderTextColor={colors.textLight}
        multiline
        numberOfLines={6}
        maxLength={5000}
        textAlignVertical="top"
      />
      <Text style={styles.charCount}>{form.description.length}/5000</Text>

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
        <Ionicons name="cash-outline" size={18} color={colors.textLight} />
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
            <Ionicons name="wallet-outline" size={18} color={colors.textLight} />
            <TextInput
              style={styles.inputInner}
              value={form.depositAmount}
              onChangeText={set('depositAmount')}
              placeholder="e.g. 100000"
              placeholderTextColor={colors.textLight}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.label}>Maintenance Charge ($/mo)</Text>
          <View style={styles.inputRow}>
            <Ionicons name="construct-outline" size={18} color={colors.textLight} />
            <TextInput
              style={styles.inputInner}
              value={form.maintenanceCharge}
              onChangeText={set('maintenanceCharge')}
              placeholder="e.g. 2000"
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

      <Text style={styles.label}>Neighbourhood / Area *</Text>
      <TouchableOpacity
        style={[styles.input, styles.pickerBtn]}
        onPress={() => { setLocalitySearch(''); setLocalityModal(true); }}
      >
        <Text style={form.locality ? styles.pickerBtnText : styles.pickerBtnPlaceholder}>
          {form.locality || 'Select neighbourhood'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textLight} />
      </TouchableOpacity>

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
            placeholder="e.g. TX"
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
            maxLength={10}
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Property Specifications</Text>
      <Text style={styles.stepSubtitle}>Rooms, areas, floors, and parking details</Text>

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
          <TouchableOpacity
            key={f}
            style={[styles.chip, form.furnishedStatus === f && styles.chipActive]}
            onPress={() => toggle('furnishedStatus', f)}
          >
            <Text style={[styles.chipText, form.furnishedStatus === f && styles.chipTextActive]}>
              {f.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Facing Direction</Text>
      <View style={styles.chipRow}>
        {FACING_OPTIONS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, form.facingDirection === f && styles.chipActive]}
            onPress={() => toggle('facingDirection', f)}
          >
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
      <Text style={styles.stepSubtitle}>Ownership, possession, and utility details (all optional)</Text>

      <Text style={styles.label}>Ownership Type</Text>
      <View style={styles.chipRow}>
        {OWNERSHIP_OPTIONS.map(o => (
          <TouchableOpacity
            key={o.key}
            style={[styles.chip, form.ownershipType === o.key && styles.chipActive]}
            onPress={() => toggle('ownershipType', o.key)}
          >
            <Text style={[styles.chipText, form.ownershipType === o.key && styles.chipTextActive]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Possession</Text>
      <View style={styles.chipRow}>
        {POSSESSION_OPTIONS.map(o => (
          <TouchableOpacity
            key={o.key}
            style={[styles.chip, form.possessionStatus === o.key && styles.chipActive]}
            onPress={() => toggle('possessionStatus', o.key)}
          >
            <Text style={[styles.chipText, form.possessionStatus === o.key && styles.chipTextActive]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Kitchen Type</Text>
      <View style={styles.chipRow}>
        {KITCHEN_OPTIONS.map(o => (
          <TouchableOpacity
            key={o.key}
            style={[styles.chip, form.kitchenType === o.key && styles.chipActive]}
            onPress={() => toggle('kitchenType', o.key)}
          >
            <Text style={[styles.chipText, form.kitchenType === o.key && styles.chipTextActive]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Water Supply</Text>
      <View style={styles.chipRow}>
        {WATER_OPTIONS.map(o => (
          <TouchableOpacity
            key={o.key}
            style={[styles.chip, form.waterSupply === o.key && styles.chipActive]}
            onPress={() => toggle('waterSupply', o.key)}
          >
            <Text style={[styles.chipText, form.waterSupply === o.key && styles.chipTextActive]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary preview */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="document-text-outline" size={18} color={colors.primary} />
          <Text style={styles.summaryTitle}>Listing Preview</Text>
        </View>
        <Text style={styles.summaryLine}>{form.title}</Text>
        <Text style={styles.summaryPrice}>
          {form.listingType} · ${Number(form.price || 0).toLocaleString('en-US')}
        </Text>
        <Text style={styles.summaryLocation}>
          {[form.addressLine1, form.city, form.state].filter(Boolean).join(', ')}
        </Text>
        {(form.bedrooms || form.bathrooms || form.carpetArea) ? (
          <Text style={styles.summarySpecs}>
            {[
              form.bedrooms && `${form.bedrooms} Beds`,
              form.bathrooms && `${form.bathrooms} Baths`,
              form.carpetArea && `${form.carpetArea} sqft`,
            ].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );

  // ── Layout ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        {step > 1 ? (
          <TouchableOpacity onPress={handleBack} style={styles.iconBtn}>
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

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      {/* Locality picker modal */}
      <Modal visible={localityModal} animationType="slide" transparent onRequestClose={() => setLocalityModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Neighbourhood</Text>
              <TouchableOpacity onPress={() => setLocalityModal(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalSearch}
              placeholder="Search neighbourhoods…"
              placeholderTextColor={colors.textLight}
              value={localitySearch}
              onChangeText={setLocalitySearch}
              autoFocus
            />
            {localities.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Text style={styles.modalEmptyText}>
                  {selectedCity ? 'No neighbourhoods found for this city.' : 'Select a city from the header first.'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={localities.filter(l =>
                  !localitySearch || l.name.toLowerCase().includes(localitySearch.toLowerCase())
                )}
                keyExtractor={l => l.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, form.localityId === item.id && styles.modalItemSelected]}
                    onPress={() => {
                      setForm(prev => ({ ...prev, locality: item.name, localityId: item.id }));
                      setLocalityModal(false);
                    }}
                  >
                    <Ionicons name="location-outline" size={16} color={colors.primary} />
                    <Text style={styles.modalItemText}>{item.name}</Text>
                    {form.localityId === item.id && (
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </View>
        </View>
      </Modal>

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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  iconBtn: {
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
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.backgroundSecondary, borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  dotCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotLabel: { fontSize: 10, color: colors.textLight, fontWeight: typography.fontWeight.medium },
  dotLabelActive: { color: colors.primary, fontWeight: typography.fontWeight.bold },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginBottom: 16, marginHorizontal: 3 },
  stepLineDone: { backgroundColor: colors.primary },

  form: { flex: 1, padding: spacing.lg },
  stepTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text, marginBottom: 4 },
  stepSubtitle: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginBottom: spacing.lg },

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
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  summaryTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.primary },
  summaryLine: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.text },
  summaryPrice: { fontSize: typography.fontSize.sm, color: colors.primary, fontWeight: typography.fontWeight.semibold },
  summaryLocation: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  summarySpecs: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 },

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

  // Locality picker
  pickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerBtnText: { color: colors.text, fontSize: typography.fontSize.md, flex: 1 },
  pickerBtnPlaceholder: { color: colors.textLight, fontSize: typography.fontSize.md, flex: 1 },

  // Locality modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '75%', paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  modalTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text },
  modalSearch: {
    margin: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    fontSize: typography.fontSize.md, color: colors.text, backgroundColor: colors.background,
  },
  modalEmpty: { alignItems: 'center', padding: spacing.xl },
  modalEmptyText: { color: colors.textSecondary, fontSize: typography.fontSize.sm, textAlign: 'center' },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight,
  },
  modalItemSelected: { backgroundColor: colors.primarySurface },
  modalItemText: { flex: 1, fontSize: typography.fontSize.md, color: colors.text },
});

export default CreateListingScreen;
