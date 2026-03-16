import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchCities,
  selectCity,
  selectLocality,
  confirmLocation,
  searchLocalities,
  clearLocalities,
} from '@/store/slices/locationSlice';
import { logout } from '@/store/slices/authSlice';
import { colors, typography, spacing } from '@/theme';
import Button from '@/components/common/Button';
import type { AppDispatch, RootState } from '@/store';
import type { City, Locality } from '@/api/types/location.type';
import Header from '@/components/common/Header';
import { SafeAreaView } from 'react-native-safe-area-context';

const LocationSelectionScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { cities, localities, selectedCity, selectedLocality, loading, searchingLocalities } =
    useSelector((state: RootState) => state.location);

  const [showCityPicker, setShowCityPicker] = useState(false);
  const [localitySearch, setLocalitySearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    dispatch(fetchCities());
  }, []);

  const handleCitySelect = (city: City) => {
    dispatch(selectCity(city));
    setShowCityPicker(false);
    setLocalitySearch('');
    dispatch(clearLocalities());
  };

  const handleLocalitySearch = (text: string) => {
    setLocalitySearch(text);

    if (searchTimeout) clearTimeout(searchTimeout);

    if (text.length >= 2 && selectedCity) {
      const timeout = setTimeout(() => {
        dispatch(searchLocalities({ cityId: selectedCity.id, keyword: text }));
      }, 500);
      setSearchTimeout(timeout);
    } else {
      dispatch(clearLocalities());
    }
  };

  const handleLocalitySelect = (locality: Locality) => {
    dispatch(selectLocality(locality));
    setLocalitySearch(locality.name);
    dispatch(clearLocalities());
  };

  const handleConfirm = () => {
    if (selectedCity) {
      dispatch(confirmLocation());
      navigation.replace('MainApp');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  return (<SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Location</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="location" size={48} color={colors.primary} />
          <Text style={styles.title}>Select Your Location</Text>
          <Text style={styles.subtitle}>Help us show properties near you</Text>
        </View>

        {/* City Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>City *</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowCityPicker(!showCityPicker)}
          >
            <Text style={[styles.selectorText, !selectedCity && styles.placeholder]}>
              {selectedCity ? selectedCity.name : 'Select city'}
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
                <Text style={styles.emptyText}>No cities available</Text>
              ) : (
                <ScrollView style={styles.dropdownScroll}>
                  {cities.map((city) => (
                    <TouchableOpacity
                      key={city.id}
                      style={styles.dropdownItem}
                      onPress={() => handleCitySelect(city)}
                    >
                      <Text style={styles.dropdownItemText}>{city.name}</Text>
                      <Text style={styles.dropdownItemSubtext}>{city.stateName}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
        </View>

        {/* Locality Search */}
        {selectedCity && (
          <View style={styles.section}>
            <Text style={styles.label}>Locality (Optional)</Text>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search locality..."
                value={localitySearch}
                onChangeText={handleLocalitySearch}
              />
              {searchingLocalities && <ActivityIndicator size="small" color={colors.primary} />}
            </View>

            {localities.length > 0 && (
              <View style={styles.dropdown}>
                <ScrollView style={styles.dropdownScroll}>
                  {localities.map((locality) => (
                    <TouchableOpacity
                      key={locality.id}
                      style={styles.dropdownItem}
                      onPress={() => handleLocalitySelect(locality)}
                    >
                      <Text style={styles.dropdownItemText}>{locality.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Selected Info */}
        {selectedCity && (
          <View style={styles.selectedInfo}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.selectedText}>
              {selectedCity.name}
              {selectedLocality && `, ${selectedLocality.name}`}
            </Text>
          </View>
        )}

        <Button onPress={handleConfirm} disabled={!selectedCity} style={styles.confirmButton}>
          Continue
        </Button>
      </ScrollView></SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  logoutButton: { padding: spacing.xs },
  container: { flex: 1 },
  content: { padding: spacing.lg },
  iconContainer: { alignItems: 'center', marginBottom: spacing.xl },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  section: { marginBottom: spacing.lg },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  selectorText: { fontSize: typography.fontSize.md, color: colors.text },
  placeholder: { color: colors.textSecondary },
  dropdown: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.white,
    maxHeight: 250,
  },
  dropdownScroll: { maxHeight: 250 },
  dropdownItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dropdownItemText: { fontSize: typography.fontSize.md, color: colors.text },
  dropdownItemSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: typography.fontSize.md, color: colors.text },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  selectedText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  confirmButton: { marginTop: spacing.md },
  loader: { padding: spacing.md },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.md,
  },
});

export default LocationSelectionScreen;