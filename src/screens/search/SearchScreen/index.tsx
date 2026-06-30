import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import { colors, typography, spacing } from '@/theme';
import { useSearchInfiniteQuery, usePropertyTypesQuery } from '@/api/hooks/useProperties';
import { useFavoriteIdsSet, useAddFavoriteMutation, useRemoveFavoriteMutation } from '@/api/hooks/useFavorites';
import { useLocalitySearch } from '@/api/hooks/useLocation';
import PropertyCard from '@/components/property/PropertyCard';
import AsyncBoundary from '@/components/common/AsyncBoundary';
import type { RootState } from '@/store';
import { isBuyerExperience } from '@/utils/rbac/permissions';

const MAX_LOCALITIES = 3;

type ListingType = '' | 'SALE' | 'RENT' | 'LEASE';
type Furnishing = '' | 'FURNISHED' | 'SEMI_FURNISHED' | 'UNFURNISHED';
type SortBy = '' | 'price_asc' | 'price_desc' | 'newest';

interface Filters {
  listingType: ListingType;
  propertyTypeId: number | null;
  minPrice: string;
  maxPrice: string;
  bedrooms: number[];
  minBathrooms: number | null;
  furnishing: Furnishing;
  minArea: string;
  maxArea: string;
  sortBy: SortBy;
}

const EMPTY_FILTERS: Filters = {
  listingType: '', propertyTypeId: null, minPrice: '', maxPrice: '',
  bedrooms: [], minBathrooms: null, furnishing: '', minArea: '', maxArea: '',
  sortBy: '',
};

const FURNISHING_OPTS: { label: string; value: Furnishing; icon: string }[] = [
  { label: 'Furnished', value: 'FURNISHED', icon: 'bed-outline' },
  { label: 'Semi-Furnished', value: 'SEMI_FURNISHED', icon: 'tv-outline' },
  { label: 'Unfurnished', value: 'UNFURNISHED', icon: 'cube-outline' },
];

const SORT_OPTS: { label: string; value: SortBy; icon: string }[] = [
  { label: 'Price: Low to High', value: 'price_asc', icon: 'trending-up-outline' },
  { label: 'Price: High to Low', value: 'price_desc', icon: 'trending-down-outline' },
  { label: 'Newest First', value: 'newest', icon: 'time-outline' },
];

export const getSearchGridLayout = (screenWidth: number) => {
  const horizontalPadding = spacing.md * 2;
  const columns = screenWidth >= 700 ? 3 : 2;
  const gap = spacing.sm + spacing.xs;
  const cardWidth = (screenWidth - horizontalPadding - gap * (columns - 1)) / columns;
  return { columns, gap, cardWidth };
};

export const buildSearchParams = (f: Filters, text: string, areaList: string[]) => {
  const p: Record<string, any> = {};
  if (text.trim()) p.city = text.trim();
  if (areaList.length) p.localities = areaList.join(',');
  if (f.listingType) p.listingType = f.listingType;
  if (f.propertyTypeId != null) p.propertyTypeId = f.propertyTypeId;
  if (f.minPrice) p.minPrice = Number(f.minPrice);
  if (f.maxPrice) p.maxPrice = Number(f.maxPrice);
  if (f.bedrooms.length) {
    p.minBedrooms = Math.min(...f.bedrooms);
    p.maxBedrooms = Math.max(...f.bedrooms);
  }
  if (f.minBathrooms != null) p.minBathrooms = f.minBathrooms;
  if (f.furnishing) p.furnishedStatus = f.furnishing;
  if (f.minArea) p.minArea = Number(f.minArea);
  if (f.maxArea) p.maxArea = Number(f.maxArea);
  if (f.sortBy === 'price_asc') { p.sortBy = 'price'; p.sortDir = 'asc'; }
  if (f.sortBy === 'price_desc') { p.sortBy = 'price'; p.sortDir = 'desc'; }
  if (f.sortBy === 'newest') { p.sortBy = 'createdAt'; p.sortDir = 'desc'; }
  return p;
};

const FilterSection = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
  <View style={filterStyles.section}>
    <View style={filterStyles.sectionHeader}>
      <View style={filterStyles.sectionIconWrap}>
        <Ionicons name={icon as any} size={14} color={colors.primary} />
      </View>
      <Text style={filterStyles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const filterStyles = StyleSheet.create({
  section: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
});

const SearchScreen = ({ navigation }: any) => {
  const { width: screenWidth } = useWindowDimensions();
  const grid = getSearchGridLayout(screenWidth);
  const { selectedCity, selectedLocalities } = useSelector((state: RootState) => state.location);
  const isBuyer = useSelector((state: RootState) =>
    isBuyerExperience(state.auth.user?.roles, state.auth.activeRole)
  );

  const [localityInput, setLocalityInput] = useState('');
  const [debouncedLocality, setDebouncedLocality] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [areas, setAreas] = useState<string[]>(selectedLocalities.map((l) => l.name));
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [searched, setSearched] = useState(!!selectedCity);
  const [committed, setCommitted] = useState<Record<string, any>>(() =>
    buildSearchParams(EMPTY_FILTERS, selectedCity?.name ?? '', selectedLocalities.map((l) => l.name))
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedLocality(localityInput.trim()), 350);
    return () => clearTimeout(t);
  }, [localityInput]);

  const { data: localitySuggestions = [], isFetching: isSearching } = useLocalitySearch(
    selectedCity?.id,
    debouncedLocality,
  );

  const { ids: favoriteIds, isLoading: idsLoading } = useFavoriteIdsSet(isBuyer);
  const addFavorite = useAddFavoriteMutation();
  const removeFavorite = useRemoveFavoriteMutation();
  const isToggling = addFavorite.isPending || removeFavorite.isPending;

  const toggleFavorite = (id: number) => {
    if (idsLoading || isToggling) return;
    if (favoriteIds.has(id)) removeFavorite.mutate(id);
    else addFavorite.mutate(id);
  };

  const { data: propertyTypes = [] } = usePropertyTypesQuery();

  const cityName = selectedCity?.name ?? '';

  const runSearch = useCallback((f: Filters, areaList: string[]) => {
    setShowFilters(false);
    setSearched(true);
    setCommitted(buildSearchParams(f, cityName, areaList));

  }, [cityName]);

  const selectedLocalityKey = selectedLocalities.map((l) => l.id).join(',');

  useEffect(() => {
    const city = selectedCity?.name ?? '';
    const localityNames = selectedLocalities.map((l) => l.name);
    setAreas(localityNames);
    if (city) setSearched(true);
    setCommitted((prev) => {
      const next = { ...prev };
      if (city) next.city = city;
      else delete next.city;
      if (localityNames.length) next.localities = localityNames.join(',');
      else delete next.localities;
      return next;
    });
  }, [selectedCity?.id, selectedCity?.name, selectedLocalityKey]);

  const addArea = (name: string) => {
    if (areas.includes(name) || areas.length >= MAX_LOCALITIES) return;
    const next = [...areas, name];
    setAreas(next);
    setLocalityInput('');
    setDebouncedLocality('');
    setIsFocused(false);
    runSearch(filters, next);
  };

  const handleSearch = () => runSearch(filters, areas);
  const removeArea = (name: string) => {
    const next = areas.filter((a) => a !== name);
    setAreas(next);
    runSearch(filters, next);
  };

  const atLimit = areas.length >= MAX_LOCALITIES;
  const showSuggestions = isFocused && localityInput.trim().length >= 1;

  const { data, isLoading, isError, error, refetch, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useSearchInfiniteQuery(committed, { enabled: searched });
  const results = data?.items ?? [];
  const errorMessage = isError ? (error as any)?.response?.data?.message ?? 'Could not run that search.' : null;

  const activeCount = useMemo(() => {
    let n = 0;
    if (filters.listingType) n++;
    if (filters.propertyTypeId != null) n++;
    if (filters.minPrice || filters.maxPrice) n++;
    if (filters.bedrooms.length) n++;
    if (filters.minBathrooms != null) n++;
    if (filters.furnishing) n++;
    if (filters.minArea || filters.maxArea) n++;
    if (filters.sortBy) n++;
    return n;
  }, [filters]);

  const toggleBedroom = (b: number) =>
    setFilters((p) => ({ ...p, bedrooms: p.bedrooms.includes(b) ? p.bedrooms.filter((x) => x !== b) : [...p.bedrooms, b] }));

  return (
    <View style={styles.safeArea}>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
          <View style={styles.searchIconWrap}>
            {isSearching
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Ionicons name="search" size={16} color={colors.primary} />}
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder={
              !selectedCity
                ? 'Select a city from the header first'
                : atLimit
                ? 'Max 3 neighborhoods selected'
                : 'Search neighborhoods…'
            }
            placeholderTextColor={colors.textLight}
            value={localityInput}
            onChangeText={setLocalityInput}
            onFocus={() => {
              if (blurTimer.current) clearTimeout(blurTimer.current);
              setIsFocused(true);
            }}
            onBlur={() => {
              blurTimer.current = setTimeout(() => setIsFocused(false), 200);
            }}
            onSubmitEditing={() => {
              if (blurTimer.current) clearTimeout(blurTimer.current);
              setIsFocused(true);
            }}
            returnKeyType="search"
            editable={!!selectedCity && !atLimit}
          />
          {localityInput.length > 0 && (
            <TouchableOpacity
              onPress={() => { setLocalityInput(''); setDebouncedLocality(''); }}
              style={styles.clearBtn}
            >
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, activeCount > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options" size={20} color={activeCount > 0 ? colors.white : colors.primary} />
          {activeCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {showSuggestions && (
        <View style={styles.suggestionBox}>
          {isSearching || localityInput.trim() !== debouncedLocality ? (
            <View style={styles.suggestionLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.suggestionLoadingText}>Searching…</Text>
            </View>
          ) : localitySuggestions.length === 0 ? (
            <View style={styles.suggestionEmpty}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.suggestionEmptyText}>No neighborhoods match "{debouncedLocality}"</Text>
            </View>
          ) : (
            localitySuggestions.map((loc, index) => {
              const alreadySelected = areas.includes(loc.name);
              return (
                <TouchableOpacity
                  key={loc.id}
                  style={[
                    styles.suggestionRow,
                    index < localitySuggestions.length - 1 && styles.suggestionRowBorder,
                    alreadySelected && styles.suggestionRowSelected,
                  ]}
                  onPress={() => addArea(loc.name)}
                  disabled={alreadySelected}
                >
                  <Ionicons
                    name={alreadySelected ? 'checkmark-circle' : 'location-outline'}
                    size={15}
                    color={alreadySelected ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.suggestionText, alreadySelected && styles.suggestionTextSelected]}>
                    {loc.name}
                  </Text>
                  {alreadySelected && (
                    <Text style={styles.suggestionAddedLabel}>Added</Text>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}

      {(areas.length > 0 || selectedCity) && (
        <View style={styles.chipBar}>
          {areas.length > 0 ? (
            <>
              <View style={[styles.counter, atLimit && styles.counterFull]}>
                <Text style={[styles.counterText, atLimit && styles.counterTextFull]}>
                  {areas.length}/{MAX_LOCALITIES}
                </Text>
              </View>
              {areas.map((a) => (
                <View key={a} style={styles.areaChip}>
                  <Ionicons name="location" size={11} color={colors.primary} />
                  <Text style={styles.areaChipText}>{a}</Text>
                  <TouchableOpacity onPress={() => removeArea(a)} hitSlop={8}>
                    <Ionicons name="close" size={13} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          ) : selectedCity ? (
            <Text style={styles.cityHint}>
              <Ionicons name="location-outline" size={12} color={colors.textSecondary} /> {selectedCity.name} · type to filter by neighborhood
            </Text>
          ) : null}
        </View>
      )}

      <AsyncBoundary loading={isLoading} error={errorMessage} onRetry={() => refetch()}>
        <FlatList
          key={`search-grid-${grid.columns}`}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            searched && results.length > 0 ? (
              <View style={styles.resultHeader}>
                <Text style={styles.resultCount}>{results.length} propert{results.length === 1 ? 'y' : 'ies'} found</Text>
                {filters.sortBy ? (
                  <View style={styles.sortBadge}>
                    <Ionicons name="funnel-outline" size={11} color={colors.primary} />
                    <Text style={styles.sortBadgeText}>{SORT_OPTS.find(s => s.value === filters.sortBy)?.label}</Text>
                  </View>
                ) : null}
              </View>
            ) : null
          }
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator color={colors.primary} style={{ paddingVertical: spacing.md }} /> : null
          }
          data={results}
          renderItem={({ item }) => (
            <PropertyCard
              property={item as any}
              onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
              style={[styles.card, { width: grid.cardWidth }]}
              isFavorited={isBuyer ? favoriteIds.has(item.id) : undefined}
              onFavoriteToggle={isBuyer ? () => toggleFavorite(item.id) : undefined}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          numColumns={grid.columns}
          columnWrapperStyle={[styles.row, { gap: grid.gap }]}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name={searched ? 'home-outline' : 'search-outline'} size={36} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {searched ? 'No properties found' : 'Start searching'}
              </Text>
              <Text style={styles.emptyText}>
                {searched ? 'Try adjusting filters or searching a different city' : 'Search by city name or use filters to narrow down'}
              </Text>
            </View>
          }
        />
      </AsyncBoundary>

      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalHeaderIcon}>
                  <Ionicons name="options" size={16} color={colors.primary} />
                </View>
                <Text style={styles.modalTitle}>Filters</Text>
                {activeCount > 0 && (
                  <View style={styles.activeCountBadge}>
                    <Text style={styles.activeCountText}>{activeCount} active</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>

              <FilterSection icon="home-outline" title="Looking to">
                <View style={styles.segment}>
                  {([{ label: 'Any', value: '' }, { label: 'Buy', value: 'SALE' }, { label: 'Rent', value: 'RENT' }, { label: 'Lease', value: 'LEASE' }] as { label: string; value: ListingType }[]).map((o) => (
                    <TouchableOpacity
                      key={o.label}
                      style={[styles.segmentItem, filters.listingType === o.value && styles.segmentItemActive]}
                      onPress={() => setFilters((p) => ({ ...p, listingType: o.value }))}
                    >
                      <Text style={[styles.segmentText, filters.listingType === o.value && styles.segmentTextActive]}>{o.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </FilterSection>

              <FilterSection icon="business-outline" title="Property Type">
                <View style={styles.chipWrap}>
                  {propertyTypes.map((t: any) => {
                    const active = filters.propertyTypeId === t.id;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setFilters((p) => ({ ...p, propertyTypeId: active ? null : t.id }))}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </FilterSection>

              <FilterSection icon="cash-outline" title="Budget ($)">
                <View style={styles.rangeRow}>
                  <View style={styles.rangeInputWrap}>
                    <Text style={styles.rangePrefix}>$</Text>
                    <TextInput
                      style={styles.rangeInput}
                      placeholder="Min"
                      placeholderTextColor={colors.textLight}
                      value={filters.minPrice}
                      onChangeText={(t) => setFilters((p) => ({ ...p, minPrice: t }))}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.rangeDivider}>
                    <Text style={styles.rangeSep}>to</Text>
                  </View>
                  <View style={styles.rangeInputWrap}>
                    <Text style={styles.rangePrefix}>$</Text>
                    <TextInput
                      style={styles.rangeInput}
                      placeholder="Max"
                      placeholderTextColor={colors.textLight}
                      value={filters.maxPrice}
                      onChangeText={(t) => setFilters((p) => ({ ...p, maxPrice: t }))}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.presetRow}>
                  {[
                    { label: 'Under $500K', min: '', max: '500000' },
                    { label: '$500K–$1M', min: '500000', max: '1000000' },
                    { label: '$1M–$3M', min: '1000000', max: '3000000' },
                    { label: '$3M+', min: '3000000', max: '' },
                  ].map(preset => {
                    const isActive = filters.minPrice === preset.min && filters.maxPrice === preset.max;
                    return (
                      <TouchableOpacity
                        key={preset.label}
                        style={[styles.presetChip, isActive && styles.presetChipActive]}
                        onPress={() => setFilters(p => ({ ...p, minPrice: isActive ? '' : preset.min, maxPrice: isActive ? '' : preset.max }))}
                      >
                        <Text style={[styles.presetChipText, isActive && styles.presetChipTextActive]}>{preset.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </FilterSection>

              <FilterSection icon="bed-outline" title="Bedrooms">
                <View style={styles.chipWrap}>
                  {[{ label: 'Studio', val: 0 }, { label: '1 BHK', val: 1 }, { label: '2 BHK', val: 2 }, { label: '3 BHK', val: 3 }, { label: '4+ BHK', val: 4 }].map(({ label, val }) => {
                    const active = filters.bedrooms.includes(val);
                    return (
                      <TouchableOpacity key={val} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleBedroom(val)}>
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </FilterSection>

              <FilterSection icon="water-outline" title="Min Bathrooms">
                <View style={styles.chipWrap}>
                  {[1, 2, 3, 4].map((b) => {
                    const active = filters.minBathrooms === b;
                    return (
                      <TouchableOpacity key={b} style={[styles.chip, active && styles.chipActive]} onPress={() => setFilters((p) => ({ ...p, minBathrooms: active ? null : b }))}>
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{b}+ Bath</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </FilterSection>

              <FilterSection icon="tv-outline" title="Furnishing">
                <View style={styles.chipWrap}>
                  {FURNISHING_OPTS.map((o) => {
                    const active = filters.furnishing === o.value;
                    return (
                      <TouchableOpacity key={o.value} style={[styles.chip, active && styles.chipActive]} onPress={() => setFilters((p) => ({ ...p, furnishing: active ? '' : o.value }))}>
                        <Ionicons name={o.icon as any} size={13} color={active ? colors.white : colors.textSecondary} />
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </FilterSection>

              <FilterSection icon="resize-outline" title="Carpet Area (sq ft)">
                <View style={styles.rangeRow}>
                  <View style={styles.rangeInputWrap}>
                    <TextInput
                      style={styles.rangeInput}
                      placeholder="Min sqft"
                      placeholderTextColor={colors.textLight}
                      value={filters.minArea}
                      onChangeText={(t) => setFilters((p) => ({ ...p, minArea: t }))}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.rangeDivider}>
                    <Text style={styles.rangeSep}>to</Text>
                  </View>
                  <View style={styles.rangeInputWrap}>
                    <TextInput
                      style={styles.rangeInput}
                      placeholder="Max sqft"
                      placeholderTextColor={colors.textLight}
                      value={filters.maxArea}
                      onChangeText={(t) => setFilters((p) => ({ ...p, maxArea: t }))}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </FilterSection>

              <FilterSection icon="swap-vertical-outline" title="Sort By">
                <View style={styles.sortCol}>
                  {SORT_OPTS.map(o => {
                    const active = filters.sortBy === o.value;
                    return (
                      <TouchableOpacity
                        key={o.value}
                        style={[styles.sortRow, active && styles.sortRowActive]}
                        onPress={() => setFilters(p => ({ ...p, sortBy: active ? '' : o.value }))}
                      >
                        <View style={[styles.sortIconWrap, active && styles.sortIconWrapActive]}>
                          <Ionicons name={o.icon as any} size={15} color={active ? colors.white : colors.primary} />
                        </View>
                        <Text style={[styles.sortRowText, active && styles.sortRowTextActive]}>{o.label}</Text>
                        {active && <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={{ marginLeft: 'auto' }} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </FilterSection>

            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.resetButton} onPress={() => { setFilters(EMPTY_FILTERS); runSearch(EMPTY_FILTERS, areas); }}>
                <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={handleSearch}>
                <Ionicons name="search" size={16} color={colors.white} />
                <Text style={styles.applyButtonText}>
                  {activeCount > 0 ? `Apply ${activeCount} Filter${activeCount > 1 ? 's' : ''}` : 'Search'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  searchContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 10,
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    height: 46,
  },
  searchBarFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  searchIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: { flex: 1, fontSize: typography.fontSize.md, color: colors.text },
  clearBtn: { padding: 4 },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    position: 'relative',
  },
  filterButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  filterBadgeText: { color: colors.white, fontSize: 9, fontWeight: 'bold' },

  suggestionBox: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    backgroundColor: colors.surface,
  },
  suggestionRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  suggestionRowSelected: { backgroundColor: colors.primarySurface },
  suggestionText: { flex: 1, fontSize: typography.fontSize.md, color: colors.text },
  suggestionTextSelected: { color: colors.primary, fontWeight: typography.fontWeight.semibold },
  suggestionAddedLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  suggestionLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  suggestionLoadingText: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  suggestionEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  suggestionEmptyText: { fontSize: typography.fontSize.sm, color: colors.textSecondary },

  chipBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  counter: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  counterFull: { backgroundColor: colors.primarySurface, borderColor: colors.primary },
  counterText: { fontSize: 11, color: colors.textSecondary, fontWeight: typography.fontWeight.bold },
  counterTextFull: { color: colors.primary },
  areaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySurface,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  areaChipText: { fontSize: typography.fontSize.xs, color: colors.primary, fontWeight: typography.fontWeight.semibold },
  cityHint: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    paddingVertical: 2,
  },

  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
  },
  resultCount: { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontWeight: typography.fontWeight.medium },
  sortBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  sortBadgeText: { fontSize: 10, color: colors.primary, fontWeight: typography.fontWeight.semibold },

  list: { padding: spacing.md, flexGrow: 1 },
  row: { justifyContent: 'flex-start' },
  card: { marginBottom: spacing.md },

  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.sm },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text },
  emptyText: { fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing.lg },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,26,46,0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  modalHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text },
  activeCountBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeCountText: { fontSize: 11, color: colors.white, fontWeight: typography.fontWeight.bold },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },

  segment: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 4,
  },
  segmentItem: { flex: 1, paddingVertical: spacing.sm, borderRadius: 10, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  segmentItemActive: { backgroundColor: colors.primary },
  segmentText: { fontSize: typography.fontSize.md, color: colors.text, fontWeight: typography.fontWeight.medium },
  segmentTextActive: { color: colors.white, fontWeight: typography.fontWeight.bold },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    minHeight: 40,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.fontSize.sm, color: colors.text, fontWeight: typography.fontWeight.medium },
  chipTextActive: { color: colors.white, fontWeight: typography.fontWeight.bold },

  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rangeInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
    height: 48,
    paddingHorizontal: spacing.sm,
  },
  rangePrefix: { fontSize: typography.fontSize.md, color: colors.textSecondary, fontWeight: typography.fontWeight.semibold, marginRight: 2 },
  rangeInput: { flex: 1, fontSize: typography.fontSize.md, color: colors.text },
  rangeDivider: { alignItems: 'center', paddingHorizontal: 4 },
  rangeSep: { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontWeight: typography.fontWeight.medium },

  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  presetChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  presetChipActive: { backgroundColor: colors.primarySurface, borderColor: colors.primary },
  presetChipText: { fontSize: typography.fontSize.xs, color: colors.textSecondary, fontWeight: typography.fontWeight.medium },
  presetChipTextActive: { color: colors.primary, fontWeight: typography.fontWeight.bold },

  sortCol: { gap: spacing.sm },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    minHeight: 48,
  },
  sortRowActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  sortIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortIconWrapActive: { backgroundColor: colors.primary },
  sortRowText: { fontSize: typography.fontSize.md, color: colors.text, fontWeight: typography.fontWeight.medium },
  sortRowTextActive: { color: colors.primary, fontWeight: typography.fontWeight.bold },

  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  resetButtonText: { fontSize: typography.fontSize.md, color: colors.textSecondary, fontWeight: typography.fontWeight.semibold },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  applyButtonText: { color: colors.white, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
});

export default SearchScreen;
