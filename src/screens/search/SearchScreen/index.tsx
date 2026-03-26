import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { PropertyService } from '@/api/services/property.service';
import type { PropertyDTO } from '@/api/types/property.types';
import PropertyCard from '@/components/property/PropertyCard';
import { SafeAreaView } from 'react-native-safe-area-context';

const SearchScreen = ({ navigation }: any) => {
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    bhk: [] as number[],
    furnishing: '',
  });
  const [results, setResults] = useState<PropertyDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(() => {
    setShowFilters(false);
    setLoading(true);
    setSearched(true);

    const params: Record<string, any> = {};
    if (searchText.trim()) params.city = searchText.trim();
    if (filters.minPrice) params.minPrice = Number(filters.minPrice);
    if (filters.maxPrice) params.maxPrice = Number(filters.maxPrice);
    if (filters.bhk.length > 0) params.minBedrooms = Math.min(...filters.bhk);
    if (filters.furnishing) params.furnishedStatus = filters.furnishing;
    params.page = 0;
    params.size = 20;

    PropertyService.search(params)
      .then(res => setResults(res.data.data?.content ?? []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [searchText, filters]);

  const toggleBHK = (bhk: number) => {
    setFilters(prev => ({
      ...prev,
      bhk: prev.bhk.includes(bhk) ? prev.bhk.filter(b => b !== bhk) : [...prev.bhk, bhk],
    }));
  };

  return (
     <SafeAreaView style={styles.safeArea}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search properties..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
          <Ionicons name="options-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={({ item }) => (
            <PropertyCard
              property={item as any}
              onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
              style={styles.card}
            />
          )}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            searched ? (
              <Text style={styles.emptyText}>No properties found</Text>
            ) : (
              <Text style={styles.emptyText}>Search by city, type or filter by price</Text>
            )
          }
        />
      )}

      {/* Filter Modal */}
      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Price Range */}
            <Text style={styles.filterLabel}>Price Range (₹)</Text>
            <View style={styles.priceRow}>
              <TextInput
                style={styles.priceInput}
                placeholder="Min"
                value={filters.minPrice}
                onChangeText={text => setFilters({ ...filters, minPrice: text })}
                keyboardType="numeric"
              />
              <Text style={styles.priceSeparator}>-</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max"
                value={filters.maxPrice}
                onChangeText={text => setFilters({ ...filters, maxPrice: text })}
                keyboardType="numeric"
              />
            </View>

            {/* BHK */}
            <Text style={styles.filterLabel}>BHK</Text>
            <View style={styles.bhkRow}>
              {[1, 2, 3, 4].map(bhk => (
                <TouchableOpacity
                  key={bhk}
                  style={[styles.bhkChip, filters.bhk.includes(bhk) && styles.bhkChipActive]}
                  onPress={() => toggleBHK(bhk)}
                >
                  <Text
                    style={[
                      styles.bhkChipText,
                      filters.bhk.includes(bhk) && styles.bhkChipTextActive,
                    ]}
                  >
                    {bhk} BHK
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Apply Button */}
            <TouchableOpacity style={styles.applyButton} onPress={handleSearch}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
   safeArea: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  searchContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: typography.fontSize.md, paddingVertical: spacing.sm },
  filterButton: { padding: spacing.sm },
  list: { padding: spacing.md },
  row: { justifyContent: 'space-between' },
  card: { width: '48%', marginBottom: spacing.md },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: { fontSize: typography.fontSize.xl, fontWeight: 'bold' },
  filterLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: typography.fontSize.md,
  },
  priceSeparator: { fontSize: typography.fontSize.md, color: colors.textSecondary },
  bhkRow: { flexDirection: 'row', gap: spacing.sm },
  bhkChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bhkChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  bhkChipText: { fontSize: typography.fontSize.sm, color: colors.text },
  bhkChipTextActive: { color: colors.white },
  applyButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  applyButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
});

export default SearchScreen;