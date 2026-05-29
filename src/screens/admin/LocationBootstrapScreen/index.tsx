import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { AdminService, type AdminCountryDTO, type AdminStateDTO, type AdminCityDTO } from '@/api/services/admin.service';

type Step = 'countries' | 'states' | 'cities';

const LocationBootstrapScreen = () => {
  const [step, setStep] = useState<Step>('countries');
  const [countries, setCountries] = useState<AdminCountryDTO[]>([]);
  const [states, setStates] = useState<AdminStateDTO[]>([]);
  const [cities, setCities] = useState<AdminCityDTO[]>([]);

  const [selectedCountry, setSelectedCountry] = useState<AdminCountryDTO | null>(null);
  const [selectedState, setSelectedState] = useState<AdminStateDTO | null>(null);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Import country form
  const [countryName, setCountryName] = useState('');
  const [importingCountry, setImportingCountry] = useState(false);

  const loadCountries = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    AdminService.getAdminCountries()
      .then(res => setCountries((res as any).data ?? res ?? []))
      .catch(err => console.error('Failed to load countries', err))
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  const loadStates = (countryId: number, isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    AdminService.getAdminStates(countryId)
      .then(res => setStates((res as any).data ?? res ?? []))
      .catch(err => console.error('Failed to load states', err))
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  const loadCities = (stateId: number, isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    AdminService.getAdminCities(stateId)
      .then(res => setCities((res as any).data ?? res ?? []))
      .catch(err => console.error('Failed to load cities', err))
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { loadCountries(); }, []);

  const handleImportCountry = () => {
    if (!countryName.trim()) { Alert.alert('Validation', 'Enter a country name'); return; }
    setImportingCountry(true);
    AdminService.importCountry(countryName.trim())
      .then(() => {
        Alert.alert('Success', `Country "${countryName}" import started`);
        setCountryName('');
        loadCountries(true);
      })
      .catch(err => Alert.alert('Error', err?.response?.data?.message ?? 'Import failed'))
      .finally(() => setImportingCountry(false));
  };

  const handleImportStates = (countryId: number) => {
    setActionLoading(countryId);
    AdminService.importStates(countryId)
      .then(() => {
        Alert.alert('Success', 'States import started');
        loadStates(countryId, true);
      })
      .catch(err => Alert.alert('Error', err?.response?.data?.message ?? 'Import failed'))
      .finally(() => setActionLoading(null));
  };

  const handleImportCities = (stateId: number) => {
    setActionLoading(stateId);
    AdminService.importCities(stateId)
      .then(() => {
        Alert.alert('Success', 'Cities import started');
        if (selectedState) loadCities(selectedState.id, true);
      })
      .catch(err => Alert.alert('Error', err?.response?.data?.message ?? 'Import failed'))
      .finally(() => setActionLoading(null));
  };

  const handleActivateCity = (cityId: number) => {
    setActionLoading(cityId);
    AdminService.activateCity(cityId)
      .then(() => {
        Alert.alert('Success', 'City activation started');
        setCities(prev => prev.map(c => c.id === cityId ? { ...c, isActive: true } : c));
      })
      .catch(err => Alert.alert('Error', err?.response?.data?.message ?? 'Activation failed'))
      .finally(() => setActionLoading(null));
  };

  const selectCountry = (country: AdminCountryDTO) => {
    setSelectedCountry(country);
    setSelectedState(null);
    setCities([]);
    setStep('states');
    loadStates(country.id);
  };

  const selectState = (state: AdminStateDTO) => {
    setSelectedState(state);
    setCities([]);
    setStep('cities');
    loadCities(state.id);
  };

  const goBack = () => {
    if (step === 'cities') {
      setStep('states');
      setSelectedState(null);
    } else if (step === 'states') {
      setStep('countries');
      setSelectedCountry(null);
    }
  };

  // ── Breadcrumb ──────────────────────────────────────────────────────────────
  const Breadcrumb = () => (
    <View style={styles.breadcrumb}>
      <TouchableOpacity onPress={() => { setStep('countries'); setSelectedCountry(null); setSelectedState(null); }}>
        <Text style={[styles.breadcrumbItem, step === 'countries' && styles.breadcrumbActive]}>Countries</Text>
      </TouchableOpacity>
      {selectedCountry && (
        <>
          <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
          <TouchableOpacity onPress={() => { setStep('states'); setSelectedState(null); }}>
            <Text style={[styles.breadcrumbItem, step === 'states' && styles.breadcrumbActive]}>{selectedCountry.name}</Text>
          </TouchableOpacity>
        </>
      )}
      {selectedState && (
        <>
          <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
          <Text style={[styles.breadcrumbItem, styles.breadcrumbActive]}>{selectedState.name}</Text>
        </>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ── Countries ────────────────────────────────────────────────────────────────
  if (step === 'countries') {
    return (
      <View style={styles.container}>
        <Breadcrumb />
        {/* Import form */}
        <View style={styles.importCard}>
          <Text style={styles.importTitle}>Import Country from OSM</Text>
          <View style={styles.importRow}>
            <TextInput
              style={styles.importInput}
              value={countryName}
              onChangeText={setCountryName}
              placeholder="Country name (e.g. USA)"
              autoCapitalize="words"
            />
            <TouchableOpacity
              style={[styles.importBtn, importingCountry && styles.importBtnDisabled]}
              onPress={handleImportCountry}
              disabled={importingCountry}
            >
              {importingCountry
                ? <ActivityIndicator size="small" color={colors.white} />
                : <Text style={styles.importBtnText}>Import</Text>
              }
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Imported Countries ({countries.length})</Text>
        <FlatList
          data={countries}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCountries(true)} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity style={styles.cardMain} onPress={() => selectCountry(item)}>
                <View style={styles.cardIcon}>
                  <Ionicons name="globe-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  {item.isoCode && <Text style={styles.cardSub}>{item.isoCode}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleImportStates(item.id)}
                disabled={actionLoading === item.id}
              >
                {actionLoading === item.id
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <>
                      <Ionicons name="download-outline" size={14} color={colors.primary} />
                      <Text style={styles.actionBtnText}>Import States</Text>
                    </>
                }
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="globe-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No countries imported yet</Text>
            </View>
          }
        />
      </View>
    );
  }

  // ── States ───────────────────────────────────────────────────────────────────
  if (step === 'states') {
    return (
      <View style={styles.container}>
        <Breadcrumb />
        <View style={styles.stepHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.importAllBtn}
            onPress={() => selectedCountry && handleImportStates(selectedCountry.id)}
            disabled={!selectedCountry || actionLoading === selectedCountry?.id}
          >
            {actionLoading === selectedCountry?.id
              ? <ActivityIndicator size="small" color={colors.white} />
              : <Text style={styles.importAllBtnText}>Import States</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>States in {selectedCountry?.name} ({states.length})</Text>
        <FlatList
          data={states}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => selectedCountry && loadStates(selectedCountry.id, true)} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity style={styles.cardMain} onPress={() => selectState(item)}>
                <View style={styles.cardIcon}>
                  <Ionicons name="map-outline" size={20} color="#8E44AD" />
                </View>
                <Text style={styles.cardName}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleImportCities(item.id)}
                disabled={actionLoading === item.id}
              >
                {actionLoading === item.id
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <>
                      <Ionicons name="download-outline" size={14} color={colors.primary} />
                      <Text style={styles.actionBtnText}>Import Cities</Text>
                    </>
                }
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="map-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No states imported yet</Text>
            </View>
          }
        />
      </View>
    );
  }

  // ── Cities ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Breadcrumb />
      <View style={styles.stepHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.importAllBtn}
          onPress={() => selectedState && handleImportCities(selectedState.id)}
          disabled={!selectedState || actionLoading === selectedState?.id}
        >
          {actionLoading === selectedState?.id
            ? <ActivityIndicator size="small" color={colors.white} />
            : <Text style={styles.importAllBtnText}>Import Cities</Text>
          }
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>Cities in {selectedState?.name} ({cities.length})</Text>
      <FlatList
        data={cities}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => selectedState && loadCities(selectedState.id, true)} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardMain}>
              <View style={styles.cardIcon}>
                <Ionicons name="business-outline" size={20} color="#00B894" />
              </View>
              <Text style={[styles.cardName, { flex: 1 }]}>{item.name}</Text>
              {item.isActive ? (
                <View style={styles.activeTag}>
                  <Text style={styles.activeTagText}>Active</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.activateBtn, actionLoading === item.id && styles.importBtnDisabled]}
                  onPress={() => handleActivateCity(item.id)}
                  disabled={actionLoading === item.id}
                >
                  {actionLoading === item.id
                    ? <ActivityIndicator size="small" color={colors.white} />
                    : <Text style={styles.activateBtnText}>Activate</Text>
                  }
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="business-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No cities imported yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.xs,
    flexWrap: 'wrap',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  breadcrumbItem: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  breadcrumbActive: { color: colors.primary, fontWeight: typography.fontWeight.semibold },

  importCard: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  importTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.text },
  importRow: { flexDirection: 'row', gap: spacing.sm },
  importInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 48,
    fontSize: typography.fontSize.md,
    backgroundColor: colors.background,
    color: colors.text,
  },
  importBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    justifyContent: 'center',
    minWidth: 80,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  importBtnDisabled: { opacity: 0.6 },
  importBtnText: { color: colors.white, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.sm },

  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  list: { padding: spacing.md, gap: spacing.sm },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  emptyText: { fontSize: typography.fontSize.md, color: colors.textSecondary },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.text },
  cardSub: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: 0,
  },
  actionBtnText: { fontSize: typography.fontSize.sm, color: colors.primary, fontWeight: typography.fontWeight.semibold },

  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backBtnText: { color: colors.primary, fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.sm },
  importAllBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  importAllBtnText: { color: colors.white, fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.sm },

  activeTag: { backgroundColor: colors.successSurface, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  activeTagText: { fontSize: 11, color: colors.success, fontWeight: typography.fontWeight.semibold },
  activateBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 72,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  activateBtnText: { color: colors.white, fontSize: 12, fontWeight: typography.fontWeight.semibold },
});

export default LocationBootstrapScreen;
