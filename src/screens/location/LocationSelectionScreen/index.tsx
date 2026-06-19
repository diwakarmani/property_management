import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import {
  fetchCities,
  fetchLocalities,
  selectCity,
  toggleLocality,
  setNearMe,
  confirmLocation,
  MAX_LOCALITIES,
} from '@/store/slices/locationSlice';
import { logout } from '@/store/slices/authSlice';
import { colors, typography, spacing } from '@/theme';
import Button from '@/components/common/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AppDispatch, RootState } from '@/store';
import type { City } from '@/api/types/location.type';

const LocationSelectionScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    cities,
    localities,
    selectedCity,
    selectedLocalities,
    loading,
    loadingLocalities,
    error,
  } = useSelector((state: RootState) => state.location);

  const [showCityPicker, setShowCityPicker] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const isReselect = navigation.canGoBack();

  useEffect(() => {
    dispatch(fetchCities());
  }, [dispatch]);

  useEffect(() => {
    if (selectedCity && localities.length === 0 && !loadingLocalities) {
      dispatch(fetchLocalities(selectedCity.id));
    }
  }, [dispatch, selectedCity, localities.length, loadingLocalities]);

  const handleCitySelect = (city: City) => {
    dispatch(selectCity(city));
    dispatch(fetchLocalities(city.id));
    setShowCityPicker(false);
  };

  const handleRetry = () => {
    dispatch(fetchCities());
    if (selectedCity) {
      dispatch(fetchLocalities(selectedCity.id));
    }
  };

  const handleConfirm = () => {
    if (!selectedCity) return;
    dispatch(confirmLocation());
    // Re-selection → return to where we came from. First run → AppNavigator
    // swaps the root stack to MainApp once `hasSelected` flips.
    if (navigation.canGoBack()) navigation.goBack();
  };

  // One-tap "near me": permission → GPS fix → confirm.
  const handleNearMe = async () => {
    setCapturing(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location permission needed',
          'Enable location access to find properties near you, or pick a city instead.'
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      dispatch(
        setNearMe({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
      );
      dispatch(confirmLocation());
      if (navigation.canGoBack()) navigation.goBack();
    } catch {
      Alert.alert(
        'Could not get your location',
        'Please try again, or pick a city instead.'
      );
    } finally {
      setCapturing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  const isLocalitySelected = (id: number) =>
    selectedLocalities.some((l) => l.id === id);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        {isReselect ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <Text style={styles.headerTitle}>Choose location</Text>
        {isReselect ? (
          <View style={styles.headerSpacer} />
        ) : (
          <TouchableOpacity onPress={handleLogout} style={styles.headerBtn}>
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Where are you looking?</Text>
        <Text style={styles.subtitle}>
          Search near you, or pick a city and up to {MAX_LOCALITIES} areas.
        </Text>

        {/* ── Near me ───────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.nearMeCard}
          onPress={handleNearMe}
          disabled={capturing}
          activeOpacity={0.85}
        >
          <View style={styles.nearMeIcon}>
            {capturing ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Ionicons name="navigate" size={22} color={colors.white} />
            )}
          </View>
          <View style={styles.nearMeTextWrap}>
            <Text style={styles.nearMeTitle}>
              {capturing ? 'Getting your location…' : 'Search properties near me'}
            </Text>
            <Text style={styles.nearMeSubtitle}>
              Use your current location to find nearby homes
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.white} />
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or browse by city</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ── City ──────────────────────────────────────────────────────── */}
        <Text style={styles.label}>City</Text>
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={handleRetry} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setShowCityPicker((v) => !v)}
        >
          <Text style={[styles.selectorText, !selectedCity && styles.placeholder]}>
            {selectedCity ? selectedCity.name : 'Select a city'}
          </Text>
          <Ionicons
            name={showCityPicker ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {showCityPicker && (
          <View style={styles.dropdown}>
            {loading ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : cities.length === 0 ? (
              <TouchableOpacity style={styles.emptyState} onPress={handleRetry}>
                <Text style={styles.emptyText}>No cities available</Text>
                <Text style={styles.emptySubtext}>Tap to reload</Text>
              </TouchableOpacity>
            ) : (
              cities.map((city) => (
                <TouchableOpacity
                  key={city.id}
                  style={styles.dropdownItem}
                  onPress={() => handleCitySelect(city)}
                >
                  <Ionicons
                    name="business-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <View style={styles.dropdownItemTextWrap}>
                    <Text style={styles.dropdownItemText}>{city.name}</Text>
                    <Text style={styles.dropdownItemSubtext}>{city.stateName}</Text>
                  </View>
                  {selectedCity?.id === city.id && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* ── Areas ─────────────────────────────────────────────────────── */}
        {selectedCity && (
          <View style={styles.areaSection}>
            <View style={styles.areaHeader}>
              <Text style={styles.label}>Areas (optional)</Text>
              <Text style={styles.areaCount}>
                {selectedLocalities.length}/{MAX_LOCALITIES} selected
              </Text>
            </View>

            {loadingLocalities ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : localities.length === 0 ? (
              <TouchableOpacity style={styles.emptyState} onPress={handleRetry}>
                <Text style={styles.emptyText}>No areas listed for this city</Text>
                <Text style={styles.emptySubtext}>Tap to reload</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.chipWrap}>
                {localities.map((loc) => {
                  const selected = isLocalitySelected(loc.id);
                  const atLimit =
                    !selected && selectedLocalities.length >= MAX_LOCALITIES;
                  return (
                    <TouchableOpacity
                      key={loc.id}
                      style={[
                        styles.chip,
                        selected && styles.chipSelected,
                        atLimit && styles.chipDisabled,
                      ]}
                      disabled={atLimit}
                      onPress={() => dispatch(toggleLocality(loc))}
                    >
                      {selected && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={colors.white}
                          style={{ marginRight: 4 }}
                        />
                      )}
                      <Text
                        style={[
                          styles.chipText,
                          selected && styles.chipTextSelected,
                          atLimit && styles.chipTextDisabled,
                        ]}
                      >
                        {loc.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Selected summary */}
        {selectedCity && (
          <View style={styles.summary}>
            <Ionicons name="location" size={18} color={colors.primary} />
            <Text style={styles.summaryText}>
              {selectedCity.name}
              {selectedLocalities.length > 0 &&
                ` · ${selectedLocalities.map((l) => l.name).join(', ')}`}
            </Text>
          </View>
        )}

        <Button
          onPress={handleConfirm}
          disabled={!selectedCity}
          style={styles.confirmButton}
        >
          {isReselect ? 'Update location' : 'Continue'}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerBtn: {
    width: 38, height: 38,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerSpacer: {
    width: 38,
    height: 38,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },

  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },

  nearMeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  nearMeIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearMeTextWrap: { flex: 1 },
  nearMeTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  nearMeSubtitle: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },

  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  selectorText: { fontSize: typography.fontSize.md, color: colors.text, fontWeight: typography.fontWeight.medium },
  placeholder: { color: colors.textLight },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 10,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  retryBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primarySurface,
  },
  retryText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  dropdown: {
    marginTop: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dropdownItemTextWrap: { flex: 1 },
  dropdownItemText: { fontSize: typography.fontSize.md, color: colors.text, fontWeight: typography.fontWeight.medium },
  dropdownItemSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  areaSection: { marginTop: spacing.lg },
  areaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  areaCount: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipDisabled: { opacity: 0.4 },
  chipText: { fontSize: typography.fontSize.sm, color: colors.text, fontWeight: typography.fontWeight.medium },
  chipTextSelected: { color: colors.white, fontWeight: typography.fontWeight.bold },
  chipTextDisabled: { color: colors.textSecondary },

  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.primarySurface,
    borderRadius: 12,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },

  confirmButton: { marginTop: spacing.lg },
  loader: { padding: spacing.md },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  emptySubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
    paddingBottom: spacing.sm,
  },
});

export default LocationSelectionScreen;
