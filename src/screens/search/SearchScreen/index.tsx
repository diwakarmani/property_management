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
  ScrollView,
  Dimensions,
} from 'react-native';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { PropertyService } from '@/api/services/property.service';
import type { PropertyDTO } from '@/api/types/property.types';
import PropertyCard from '@/components/property/PropertyCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { City } from '@/api/types/location.type';
import Button from '@/components/common/Button';
import Slider from '@react-native-community/slider';
import DualRangeSlider from '@/components/common/DualRangeSlider';

const SearchScreen = ({ navigation }: any) => {
  const {cities} = useSelector((state: RootState) => state.location);
  const [filters, setFilters] = useState<any>({
    city: 'Search by city',
    searchType: 'locality',
    localities: [],
    propertyType: 'Gated Community Villa',
    bhkType: '4BHK',
    priceRange: [10000000, 1000000000],
    propertyStatus: 'Ready',
    furnishing: 'Full',
    parking: '2 Wheeler',
    lookingFor: 'Full House',
    includeNearby: false,
    newBuilderProjects: false,
  });
 
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [localityInputVisible, setLocalityInputVisible] = useState(false);
  const [localityInput, setLocalityInput] = useState('');
 
  const propertyTypes = ['Apartment', 'Gated Community Villa', 'Independent House/Villa', 'Standalone Building'];
  const bhkTypes = ['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '4+ BHK'];
  const furnishingTypes = ['Full', 'Semi', 'None'];
  const parkingTypes = ['2 Wheeler', '4 Wheeler'];
 const MIN_PRICE = filters.priceRange[0] >= 1000000 ? 1000000 : 10000;
  const MAX_PRICE = filters.priceRange[1] <= 1000000 ? 1000000 : 1000000;

  const handleMinPriceChange = (value:any) => {
    const newMin = Math.min(value, filters.priceRange[1] - 1000);
    setFilters({ ...filters, priceRange: [newMin, filters.priceRange[1]] });
  };

  const handleMaxPriceChange = (value:any) => {
    const newMax = Math.max(value, filters.priceRange[0] + 1000);
    setFilters({ ...filters, priceRange: [filters.priceRange[0], newMax] });
  };
  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity style={[styles.tab, styles.activeTab]}>
        <Text style={[styles.tabText, styles.activeTabText]}>Buy</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tab}>
        <Text style={styles.tabText}>Rent</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tab}>
        <Text style={styles.tabText}>Commercial</Text>
      </TouchableOpacity>
    </View>
  );
 
  const renderCityDropdown = () => (
    <>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setCityModalVisible(true)}
      >
        <Text style={styles.dropdownText}>{filters.city}</Text>
        <MaterialIcons name="expand-more" size={20} color="#666" />
      </TouchableOpacity>
 
      <Modal
        visible={cityModalVisible}
        transparent
        animationType="none"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City</Text>
              <TouchableOpacity onPress={() => setCityModalVisible(false)}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {cities.map((city:City) => (
                <TouchableOpacity
                  key={city.id}
                  style={styles.modalOption}
                  onPress={() => {
                    setFilters({ ...filters, city: city.name });
                    setCityModalVisible(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{city.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
 
  const renderSearchType = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Search Type</Text>
      <View style={styles.searchTypeContainer}>
        <TouchableOpacity
          style={[
            styles.searchTypeButton,
            filters.searchType === 'locality' && styles.searchTypeButtonActive,
          ]}
          onPress={() => setFilters({ ...filters, searchType: 'locality' })}
        >
          <Feather name="map-pin" size={16} color={filters.searchType === 'locality' ? colors.linkText : colors.textSecondary} />
          <Text
            style={[
              styles.searchTypeButtonText,
              filters.searchType === 'locality' && styles.searchTypeButtonTextActive,
            ]}
          >
            Locality Search
          </Text>
        </TouchableOpacity>
 
        <TouchableOpacity
          style={[
            styles.metroButton,
            filters.searchType === 'metro' && styles.searchTypeButtonActive,
          ]}
          onPress={() => setFilters({ ...filters, searchType: 'metro' })}
        >
          <MaterialIcons
            name="subway"
            size={16}
            color={filters.searchType === 'metro' ? colors.linkText : colors.textSecondary}
          />
          <Text
            style={[
              styles.metroButtonText,
              filters.searchType === 'metro' && styles.searchTypeButtonTextActive,
            ]}
          >
            Search along metro
          </Text>
        </TouchableOpacity>
      </View>
 
      <View style={styles.localitySearchInput}>
        <Feather name="search" size={18} color="#999" />
        <TextInput
          placeholder="Search up to 3 Localities or landmark"
          style={styles.input}
          placeholderTextColor="#999"
        />
        <TouchableOpacity>
          <MaterialIcons name="my-location" size={18} color={colors.darkGray} />
        </TouchableOpacity>
      </View>
    </View>
  );
 
  const renderLookingFor = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Looking For</Text>
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filters.lookingFor === 'Full House' && styles.filterButtonActive,
          ]}
          onPress={() => setFilters({ ...filters, lookingFor: 'Full House' })}
        >
          <Text
            style={[
              styles.filterButtonText,
              filters.lookingFor === 'Full House' && styles.filterButtonTextActive,
            ]}
          >
            Full House
          </Text>
        </TouchableOpacity>
 
        <TouchableOpacity
          style={[
            styles.filterButton,
            filters.lookingFor === 'Land/Plot' && styles.filterButtonActive,
          ]}
          onPress={() => setFilters({ ...filters, lookingFor: 'Land/Plot' })}
        >
          <Text
            style={[
              styles.filterButtonText,
              filters.lookingFor === 'Land/Plot' && styles.filterButtonTextActive,
            ]}
          >
            Land/Plot
          </Text>
        </TouchableOpacity>
      </View>
 
      <View style={styles.checkboxRow}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setFilters({ ...filters, newBuilderProjects: !filters.newBuilderProjects })}
        >
          {filters.newBuilderProjects && (
            <MaterialIcons name="check" size={14} color="#0066CC" />
          )}
        </TouchableOpacity>
        <View style={styles.badgeContainer}>
          <Text style={styles.checkboxLabel}>New Builder Projects</Text>
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>Offer</Text>
          </View>
        </View>
      </View>
    </View>
  );
 
  const renderPropertyType = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Property Type</Text>
      <View style={styles.propertyTypeGrid}>
        {propertyTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.propertyTypeButton,
              filters.propertyType === type && styles.propertyTypeButtonActive,
            ]}
            onPress={() => setFilters({ ...filters, propertyType: type })}
          >
            <Text
              style={[
                styles.propertyTypeText,
                filters.propertyType === type && styles.propertyTypeTextActive,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
 
  const renderBHKType = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>BHK Type</Text>
      <View style={styles.bhkGrid}>
        {bhkTypes.map((bhk) => (
          <TouchableOpacity
            key={bhk}
            style={[
              styles.bhkButton,
              filters.bhkType === bhk && styles.bhkButtonActive,
            ]}
            onPress={() => setFilters({ ...filters, bhkType: bhk })}
          >
            <Text
              style={[
                styles.bhkText,
                filters.bhkType === bhk && styles.bhkTextActive,
              ]}
            >
              {bhk}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
 
      <View style={styles.checkboxRow}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setFilters({ ...filters, includeNearby: !filters.includeNearby })}
        >
          {filters.includeNearby && (
            <MaterialIcons name="check" size={14} color="#0066CC" />
          )}
        </TouchableOpacity>
        <Text style={styles.checkboxLabel}>Include nearby properties</Text>
      </View>
    </View>
  );
 
  const renderPriceRange = () => (
      <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Price Range
      </Text>
      
       


   <DualRangeSlider
  minimumValue={0}
  maximumValue={1000000}
  step={1000}
  onValueChange={(values) => setFilters({ ...filters, priceRange: values })}
  minimumTrackTintColor="#FF6B6B"
  maximumTrackTintColor="#E0E0E0"
  thumbTintColor="#FF6B6B"
  thumbSize={24}
/>

      
    </View>
  );
 
  const renderPropertyStatus = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Property Status</Text>
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[
            styles.statusButton,
            filters.propertyStatus === 'Under Construction' && styles.statusButtonActive,
          ]}
          onPress={() => setFilters({ ...filters, propertyStatus: 'Under Construction' })}
        >
          <Text
            style={[
              styles.statusButtonText,
              filters.propertyStatus === 'Under Construction' && styles.statusButtonTextActive,
            ]}
          >
            Under Construction
          </Text>
        </TouchableOpacity>
 
        <TouchableOpacity
          style={[
            styles.statusButton,
            filters.propertyStatus === 'Ready' && styles.statusButtonActive,
          ]}
          onPress={() => setFilters({ ...filters, propertyStatus: 'Ready' })}
        >
          <Text
            style={[
              styles.statusButtonText,
              filters.propertyStatus === 'Ready' && styles.statusButtonTextActive,
            ]}
          >
            Ready
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
 
  const renderFurnishing = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Furnishing</Text>
      <View style={styles.buttonGroup}>
        {furnishingTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.furnishingButton,
              filters.furnishing === type && styles.furnishingButtonActive,
            ]}
            onPress={() => setFilters({ ...filters, furnishing: type })}
          >
            <Text
              style={[
                styles.furnishingButtonText,
                filters.furnishing === type && styles.furnishingButtonTextActive,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
 
  const renderParking = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Parking</Text>
      <View style={styles.buttonGroup}>
        {parkingTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.parkingButton,
              filters.parking === type && styles.parkingButtonActive,
            ]}
            onPress={() => setFilters({ ...filters, parking: type })}
          >
            <Text
              style={[
                styles.parkingButtonText,
                filters.parking === type && styles.parkingButtonTextActive,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
 
  const handleSearch = () => {
    console.log('Search with filters:', filters);
    // Navigate to search results or handle search
  };
 
  return (
    <View style={styles.container}>
      {renderTabBar()}
 
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderCityDropdown()}
 
        {renderSearchType()}
 
        {renderLookingFor()}
 
        {renderPropertyType()}
 
        {renderBHKType()}
 
        {renderPriceRange()}
 
        {renderPropertyStatus()}
 
        {renderFurnishing()}
 
        {renderParking()}
 
        <Button style={styles.searchButton} onPress={handleSearch} textStyle={styles.searchButtonText}>
         Search
        </Button>
 
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#0066CC',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#0066CC',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: Dimensions.get('window').height * 0.6,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  modalOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: typography.fontWeight.medium,
    color: '#000',
    marginBottom: 10,
    textTransform: 'capitalize',
  },
  searchTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  searchTypeButtonActive: {
    backgroundColor: colors.linkLight,
    borderColor: colors.linkText,
  },
  searchTypeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  searchTypeButtonTextActive: {
    color: colors.linkText,
  },
  metroButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  metroButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
  },
  localitySearchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#fff',
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    paddingVertical: 0,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  filterButton: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newBadge: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  propertyTypeGrid: {
    gap: 8,
  },
  propertyTypeButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    alignItems: 'flex-start',
  },
  propertyTypeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  propertyTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  propertyTypeTextActive: {
    color: '#fff',
  },
  bhkGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  bhkButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  bhkButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bhkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  bhkTextActive: {
    color: '#fff',
  },
  sliderPlaceholder: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  sliderTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ccc',
    borderWidth: 2,
    borderColor: '#fff',
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  furnishingButton: {
    flex: 1,
    minWidth: '31%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  furnishingButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  furnishingButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  furnishingButtonTextActive: {
    color: '#fff',
  },
  parkingButton: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  parkingButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  parkingButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  parkingButtonTextActive: {
    color: '#fff',
  },
  searchButton: {
    marginTop: 20,
    marginBottom: 16,
    paddingVertical: 14,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 20,
  },
   sliderContainer: {
    marginVertical: 20,
  },
  sliderWrapper: {
    height: 80,
    justifyContent: 'center',
    position: 'relative',
  },
  slider: {
    width: '100%',
    height: 40,
    position: 'absolute',
  },
 
});

export default SearchScreen;