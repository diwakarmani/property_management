import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '@/theme';
import { useCompareFavoritesQuery } from '@/api/hooks/useFavorites';
import type { PropertyCompareDTO } from '@/api/types/property.types';
import { formatPrice } from '@/utils/helpers/formatPrice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LABEL_COL = 112;

// ─── Label formatters ─────────────────────────────────────────────────────────

const FURNISHED: Record<string, string> = {
  FURNISHED: 'Furnished',
  SEMI_FURNISHED: 'Semi',
  UNFURNISHED: 'Unfurnished',
};
const POSSESSION: Record<string, string> = {
  READY_TO_MOVE: 'Ready',
  WITHIN_15_DAYS: '15 Days',
  WITHIN_1_MONTH: '1 Month',
  WITHIN_3_MONTHS: '3 Months',
  WITHIN_6_MONTHS: '6 Months',
  WITHIN_1_YEAR: '1 Year',
  UNDER_CONSTRUCTION: 'U/C',
};
const OWNERSHIP: Record<string, string> = {
  FREEHOLD: 'Freehold',
  LEASEHOLD: 'Leasehold',
  CO_OPERATIVE_SOCIETY: 'Co-op',
  POWER_OF_ATTORNEY: 'PoA',
};
const KITCHEN: Record<string, string> = {
  MODULAR_KITCHEN: 'Modular',
  OPEN_KITCHEN: 'Open',
  CLOSED_KITCHEN: 'Closed',
  NO_KITCHEN: 'None',
};
const WATER: Record<string, string> = {
  CORPORATION_WATER: 'Corp.',
  BOREWELL: 'Borewell',
  BOTH: 'Both',
  '24_7_SUPPLY': '24/7',
  TANKER: 'Tanker',
};

const fmtLabel = (map: Record<string, string>, val?: string) =>
  val ? (map[val] ?? val.replace(/_/g, ' ')) : '—';
const fmtNum = (v?: number | null) => (v != null ? String(v) : '—');
const fmtArea = (v?: number | null) => (v != null ? `${v.toLocaleString()} sqft` : '—');
const fmtCurrency = (v?: number | null) => (v != null ? formatPrice(v) : '—');
const fmtParking = (p?: PropertyCompareDTO) => {
  if (p?.parkingCovered == null && p?.parkingOpen == null) return '—';
  const total = (p?.parkingCovered ?? 0) + (p?.parkingOpen ?? 0);
  return total > 0 ? String(total) : 'None';
};
const fmtFloor = (p?: PropertyCompareDTO) => {
  if (p?.floorNumber == null) return '—';
  return p.totalFloors ? `${p.floorNumber} / ${p.totalFloors}` : String(p.floorNumber);
};

// ─── Row & Section types ──────────────────────────────────────────────────────

type Highlight = 'lower_better' | 'higher_better' | 'none';

interface RowDef {
  key: string;
  label: string;
  icon: string;
  highlight: Highlight;
  getValue: (p: PropertyCompareDTO) => string;
  getNumeric?: (p: PropertyCompareDTO) => number | null;
  isBool?: boolean;
  getBool?: (p: PropertyCompareDTO) => boolean;
}

interface Section {
  title: string;
  icon: string;
  accentColor: string;
  rows: RowDef[];
}

const SECTIONS: Section[] = [
  {
    title: 'Price & Type',
    icon: 'cash-outline',
    accentColor: colors.primary,
    rows: [
      {
        key: 'price', label: 'Price', icon: 'cash-outline', highlight: 'lower_better',
        getValue: p => fmtCurrency(p.price),
        getNumeric: p => p.price ?? null,
      },
      {
        key: 'listingType', label: 'Listing Type', icon: 'pricetag-outline', highlight: 'none',
        getValue: p => p.listingType ?? '—',
      },
      {
        key: 'propertyType', label: 'Property Type', icon: 'home-outline', highlight: 'none',
        getValue: p => [p.propertyTypeName, p.propertySubTypeName].filter(Boolean).join(' · ') || '—',
      },
    ],
  },
  {
    title: 'Space & Rooms',
    icon: 'resize-outline',
    accentColor: '#2980B9',
    rows: [
      {
        key: 'bedrooms', label: 'Bedrooms', icon: 'bed-outline', highlight: 'higher_better',
        getValue: p => fmtNum(p.bedrooms),
        getNumeric: p => p.bedrooms ?? null,
      },
      {
        key: 'bathrooms', label: 'Bathrooms', icon: 'water-outline', highlight: 'higher_better',
        getValue: p => fmtNum(p.bathrooms),
        getNumeric: p => p.bathrooms ?? null,
      },
      {
        key: 'balconies', label: 'Balconies', icon: 'sunny-outline', highlight: 'higher_better',
        getValue: p => fmtNum(p.balconies),
        getNumeric: p => p.balconies ?? null,
      },
      {
        key: 'carpetArea', label: 'Carpet Area', icon: 'resize-outline', highlight: 'higher_better',
        getValue: p => fmtArea(p.carpetArea),
        getNumeric: p => p.carpetArea ?? null,
      },
      {
        key: 'builtUpArea', label: 'Built-up Area', icon: 'expand-outline', highlight: 'higher_better',
        getValue: p => fmtArea(p.builtUpArea),
        getNumeric: p => p.builtUpArea ?? null,
      },
    ],
  },
  {
    title: 'Property Details',
    icon: 'document-text-outline',
    accentColor: '#8E44AD',
    rows: [
      {
        key: 'furnished', label: 'Furnishing', icon: 'cube-outline', highlight: 'none',
        getValue: p => fmtLabel(FURNISHED, p.furnishedStatus),
      },
      {
        key: 'possession', label: 'Possession', icon: 'key-outline', highlight: 'none',
        getValue: p => fmtLabel(POSSESSION, p.possessionStatus),
      },
      {
        key: 'floor', label: 'Floor', icon: 'business-outline', highlight: 'none',
        getValue: p => fmtFloor(p),
      },
      {
        key: 'age', label: 'Property Age', icon: 'time-outline', highlight: 'lower_better',
        getValue: p => p.ageOfProperty != null ? `${p.ageOfProperty} yr` : '—',
        getNumeric: p => p.ageOfProperty ?? null,
      },
      {
        key: 'parking', label: 'Parking', icon: 'car-outline', highlight: 'higher_better',
        getValue: p => fmtParking(p),
        getNumeric: p => {
          if (p.parkingCovered == null && p.parkingOpen == null) return null;
          return (p.parkingCovered ?? 0) + (p.parkingOpen ?? 0);
        },
      },
    ],
  },
  {
    title: 'Infrastructure',
    icon: 'construct-outline',
    accentColor: '#16A085',
    rows: [
      {
        key: 'kitchen', label: 'Kitchen', icon: 'restaurant-outline', highlight: 'none',
        getValue: p => fmtLabel(KITCHEN, p.kitchenType),
      },
      {
        key: 'water', label: 'Water Supply', icon: 'water-outline', highlight: 'none',
        getValue: p => fmtLabel(WATER, p.waterSupply),
      },
      {
        key: 'ownership', label: 'Ownership', icon: 'document-outline', highlight: 'none',
        getValue: p => fmtLabel(OWNERSHIP, p.ownershipType),
      },
      {
        key: 'facing', label: 'Facing', icon: 'compass-outline', highlight: 'none',
        getValue: p => p.facingDirection?.replace(/_/g, ' ') ?? '—',
      },
    ],
  },
  {
    title: 'Financials',
    icon: 'wallet-outline',
    accentColor: '#E67E22',
    rows: [
      {
        key: 'deposit', label: 'Deposit', icon: 'wallet-outline', highlight: 'lower_better',
        getValue: p => fmtCurrency(p.depositAmount),
        getNumeric: p => p.depositAmount ?? null,
      },
      {
        key: 'maintenance', label: 'Maintenance', icon: 'construct-outline', highlight: 'lower_better',
        getValue: p => fmtCurrency(p.maintenanceCharge),
        getNumeric: p => p.maintenanceCharge ?? null,
      },
    ],
  },
  {
    title: 'Overview',
    icon: 'star-outline',
    accentColor: '#27AE60',
    rows: [
      {
        key: 'verified', label: 'Verified', icon: 'shield-checkmark-outline', highlight: 'none',
        getValue: p => p.verified ? 'Yes' : 'No',
        isBool: true,
        getBool: p => p.verified,
      },
      {
        key: 'premium', label: 'Premium', icon: 'star-outline', highlight: 'none',
        getValue: p => p.premium ? 'Yes' : 'No',
        isBool: true,
        getBool: p => p.premium,
      },
      {
        key: 'amenities', label: 'Amenities', icon: 'apps-outline', highlight: 'higher_better',
        getValue: p => fmtNum(p.amenities?.length ?? 0),
        getNumeric: p => p.amenities?.length ?? 0,
      },
      {
        key: 'location', label: 'Location', icon: 'location-outline', highlight: 'none',
        getValue: p => [p.locality, p.city].filter(Boolean).join(', ') || '—',
      },
    ],
  },
];

// Flat rows for highlight computation (same order as sections)
const ALL_ROWS = SECTIONS.flatMap(s => s.rows);

// ─── Highlight logic ──────────────────────────────────────────────────────────

function getHighlights(row: RowDef, props: PropertyCompareDTO[]): ('best' | 'worst' | 'neutral')[] {
  if (row.highlight === 'none' || !row.getNumeric) return props.map(() => 'neutral');
  const nums = props.map(p => row.getNumeric!(p));
  const valid = nums.filter(n => n != null) as number[];
  if (valid.length < 2) return props.map(() => 'neutral');
  const mn = Math.min(...valid);
  const mx = Math.max(...valid);
  if (mn === mx) return props.map(() => 'neutral');
  return nums.map(n => {
    if (n == null) return 'neutral';
    if (row.highlight === 'lower_better') return n === mn ? 'best' : n === mx ? 'worst' : 'neutral';
    return n === mx ? 'best' : n === mn ? 'worst' : 'neutral';
  });
}

// ─── Property header card ─────────────────────────────────────────────────────

const PropertyCard = ({
  prop, colW, onRemove, canRemove,
}: {
  prop: PropertyCompareDTO; colW: number; onRemove: () => void; canRemove: boolean;
}) => (
  <View style={[styles.propCard, { width: colW }]}>
    {/* Image */}
    <View style={styles.propImageWrap}>
      {prop.primaryImageUrl ? (
        <Image source={{ uri: prop.primaryImageUrl }} style={styles.propImage} />
      ) : (
        <View style={[styles.propImage, styles.propImagePlaceholder]}>
          <Ionicons name="home-outline" size={28} color={colors.primaryLight} />
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(26,26,46,0.55)']}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      {/* Listing type badge */}
      {prop.listingType && (
        <View style={[styles.listingBadge, prop.listingType === 'RENT' ? styles.rentBadge : styles.saleBadge]}>
          <Text style={styles.listingBadgeText}>{prop.listingType}</Text>
        </View>
      )}
      {canRemove && (
        <TouchableOpacity
          style={styles.removePropBtn}
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={12} color={colors.white} />
        </TouchableOpacity>
      )}
    </View>

    {/* Card body */}
    <View style={styles.propCardBody}>
      <Text style={styles.propPrice}>
        {formatPrice(prop.price)}
        {prop.listingType === 'RENT' && <Text style={styles.propPriceUnit}>/mo</Text>}
      </Text>
      <Text style={styles.propTitle} numberOfLines={2}>{prop.title}</Text>
      <View style={styles.propLocationRow}>
        <Ionicons name="location" size={10} color={colors.primary} />
        <Text style={styles.propLocationText} numberOfLines={1}>
          {[prop.locality, prop.city].filter(Boolean).join(', ') || '—'}
        </Text>
      </View>
    </View>
  </View>
);

// ─── Section header row ───────────────────────────────────────────────────────

const SectionHeader = ({ section, colCount }: { section: Section; colCount: number }) => {
  const colW = (SCREEN_WIDTH - LABEL_COL) / Math.max(colCount, 2);
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={[styles.sectionLabelCell, { width: LABEL_COL }]}>
        <View style={[styles.sectionIconWrap, { backgroundColor: section.accentColor + '20' }]}>
          <Ionicons name={section.icon as any} size={12} color={section.accentColor} />
        </View>
      </View>
      <View style={[styles.sectionTitleCell, { width: colW * colCount }]}>
        <Text style={[styles.sectionTitle, { color: section.accentColor }]}>{section.title.toUpperCase()}</Text>
      </View>
    </View>
  );
};

// ─── Attribute cell ───────────────────────────────────────────────────────────

const Cell = ({
  row, prop, highlight, colW,
}: {
  row: RowDef; prop: PropertyCompareDTO; highlight: 'best' | 'worst' | 'neutral'; colW: number;
}) => {
  const isBest = highlight === 'best';
  const isWorst = highlight === 'worst';
  const bg = isBest ? colors.successSurface : isWorst ? colors.errorSurface : undefined;
  const textColor = isBest ? colors.success : isWorst ? colors.error : colors.text;
  const borderColor = isBest ? colors.success : isWorst ? colors.error : undefined;

  if (row.isBool && row.getBool) {
    const val = row.getBool(prop);
    return (
      <View style={[styles.cell, { width: colW }, bg ? { backgroundColor: bg } : undefined,
        borderColor ? { borderLeftColor: borderColor, borderLeftWidth: 2 } : undefined]}>
        <View style={[styles.boolWrap, { backgroundColor: val ? colors.successSurface : colors.errorSurface }]}>
          <Ionicons
            name={val ? 'checkmark-circle' : 'close-circle'}
            size={18}
            color={val ? colors.success : colors.error}
          />
          <Text style={[styles.boolText, { color: val ? colors.success : colors.error }]}>
            {val ? 'Yes' : 'No'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.cell, { width: colW }, bg ? { backgroundColor: bg } : undefined,
      borderColor ? { borderLeftColor: borderColor, borderLeftWidth: 2 } : undefined]}>
      {(isBest || isWorst) && (
        <View style={[styles.highlightBadge, { backgroundColor: bg }]}>
          <Ionicons
            name={isBest ? 'trending-up' : 'trending-down'}
            size={10}
            color={textColor}
          />
        </View>
      )}
      <Text style={[styles.cellText, { color: textColor, fontWeight: (isBest || isWorst) ? typography.fontWeight.bold : typography.fontWeight.medium }]} numberOfLines={2}>
        {row.getValue(prop)}
      </Text>
    </View>
  );
};

// ─── Label cell ───────────────────────────────────────────────────────────────

const LabelCell = ({ row }: { row: RowDef }) => (
  <View style={[styles.labelCell, { width: LABEL_COL }]}>
    <View style={styles.labelIconWrap}>
      <Ionicons name={row.icon as any} size={12} color={colors.primary} />
    </View>
    <Text style={styles.labelText} numberOfLines={2}>{row.label}</Text>
  </View>
);

// ─── Main screen ──────────────────────────────────────────────────────────────

const CompareScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { ids } = route.params as { ids: number[] };

  const { data: properties = [], isLoading, isError, error, refetch } = useCompareFavoritesQuery(ids);

  const colW = useMemo(
    () => (SCREEN_WIDTH - LABEL_COL) / Math.max(properties.length, 2),
    [properties.length],
  );

  const handleRemove = (id: number) => {
    const remaining = (properties.map(p => p.id) as number[]).filter(pid => pid !== id);
    if (remaining.length < 2) navigation.goBack();
    else navigation.setParams({ ids: remaining });
  };

  const TopBar = ({ subtitle }: { subtitle?: string }) => (
    <View style={styles.topBar}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.topBarTextWrap}>
        <Text style={styles.topBarTitle}>Compare</Text>
        {subtitle ? <Text style={styles.topBarSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.topBarIconWrap}>
        <Ionicons name="git-compare-outline" size={16} color={colors.primary} />
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <TopBar />
        <View style={styles.center}>
          <View style={styles.loadingIconWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={styles.loadingText}>Loading comparison…</Text>
          <Text style={styles.loadingSubtext}>Fetching property details</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || properties.length < 2) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <TopBar />
        <View style={styles.center}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.error} />
          </View>
          <Text style={styles.errorTitle}>Could not load comparison</Text>
          <Text style={styles.errorText}>
            {(error as any)?.response?.data?.message ?? 'Please try again.'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <TopBar subtitle={`Comparing ${properties.length} ${properties.length === 1 ? 'property' : 'properties'}`} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Property header cards ── */}
        <View style={styles.headerRow}>
          {/* empty corner above label column */}
          <View style={[styles.headerCorner, { width: LABEL_COL }]}>
            <Ionicons name="stats-chart-outline" size={14} color={colors.primaryLight} />
          </View>
          {properties.map(p => (
            <PropertyCard
              key={p.id}
              prop={p}
              colW={colW}
              canRemove={properties.length > 2}
              onRemove={() => handleRemove(p.id)}
            />
          ))}
        </View>

        {/* ── Attribute sections ── */}
        {SECTIONS.map(section => (
          <View key={section.title}>
            <SectionHeader section={section} colCount={properties.length} />
            {section.rows.map((row, rowIdx) => {
              const highlights = getHighlights(row, properties);
              const isEven = rowIdx % 2 === 0;
              return (
                <View key={row.key} style={[styles.row, isEven ? styles.rowEven : styles.rowOdd]}>
                  <LabelCell row={row} />
                  {properties.map((p, i) => (
                    <Cell key={p.id} row={row} prop={p} highlight={highlights[i]} colW={colW} />
                  ))}
                </View>
              );
            })}
          </View>
        ))}

        {/* ── Amenities detail ── */}
        {properties.some(p => (p.amenities?.length ?? 0) > 0) && (
          <View style={styles.amenitiesCard}>
            <View style={styles.amenitiesHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: colors.primarySurface }]}>
                <Ionicons name="apps-outline" size={13} color={colors.primary} />
              </View>
              <Text style={styles.amenitiesHeaderTitle}>Amenities Breakdown</Text>
            </View>
            <View style={styles.amenitiesGrid}>
              {properties.map((p, i) => (
                <View
                  key={p.id}
                  style={[
                    styles.amenitiesCol,
                    { width: (SCREEN_WIDTH - LABEL_COL) / properties.length },
                    i < properties.length - 1 && styles.amenitiesColBorder,
                  ]}
                >
                  <View style={styles.amenitiesColHeader}>
                    <Text style={styles.amenitiesColNum}>#{i + 1}</Text>
                    <Text style={styles.amenitiesColTitle} numberOfLines={1}>{p.title}</Text>
                  </View>
                  {(p.amenities ?? []).length === 0 ? (
                    <Text style={styles.noAmenity}>None listed</Text>
                  ) : (
                    (p.amenities ?? []).map(a => (
                      <View key={a.id} style={styles.amenityRow}>
                        <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                        <Text style={styles.amenityName} numberOfLines={1}>{a.name}</Text>
                      </View>
                    ))
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Legend ── */}
        <View style={styles.legendCard}>
          <View style={styles.legendCardHeader}>
            <Ionicons name="information-circle-outline" size={15} color={colors.primary} />
            <Text style={styles.legendCardTitle}>How to read this comparison</Text>
          </View>
          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: colors.successSurface }]}>
                <Ionicons name="trending-up" size={13} color={colors.success} />
              </View>
              <View style={styles.legendTextWrap}>
                <Text style={[styles.legendLabel, { color: colors.success }]}>Best Value</Text>
                <Text style={styles.legendDesc}>Better than others</Text>
              </View>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: colors.errorSurface }]}>
                <Ionicons name="trending-down" size={13} color={colors.error} />
              </View>
              <View style={styles.legendTextWrap}>
                <Text style={[styles.legendLabel, { color: colors.error }]}>Worst Value</Text>
                <Text style={styles.legendDesc}>Lower than others</Text>
              </View>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: colors.successSurface }]}>
                <Ionicons name="checkmark-circle" size={13} color={colors.success} />
              </View>
              <View style={styles.legendTextWrap}>
                <Text style={[styles.legendLabel, { color: colors.success }]}>Yes / Verified</Text>
                <Text style={styles.legendDesc}>Feature present</Text>
              </View>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: colors.errorSurface }]}>
                <Ionicons name="close-circle" size={13} color={colors.error} />
              </View>
              <View style={styles.legendTextWrap}>
                <Text style={[styles.legendLabel, { color: colors.error }]}>No</Text>
                <Text style={styles.legendDesc}>Feature absent</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: spacing.xl + 8 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 0 },

  // ── Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  topBarTextWrap: { flex: 1 },
  topBarTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    lineHeight: 22,
  },
  topBarSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  topBarIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Loading / Error
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: spacing.xl },
  loadingIconWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  loadingText: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.text },
  loadingSubtext: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  errorIconWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: colors.errorSurface,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  errorTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text },
  errorText: { fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg, paddingVertical: 10,
    borderRadius: 12, marginTop: 4,
  },
  retryText: { color: colors.white, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.sm },

  // ── Header row (property cards)
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  headerCorner: {
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },

  // ── Property card
  propCard: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    backgroundColor: colors.surface,
  },
  propImageWrap: {
    height: 150,
    position: 'relative',
    overflow: 'hidden',
  },
  propImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  propImagePlaceholder: {
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingBadge: {
    position: 'absolute', top: 8, left: 8,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 6,
  },
  saleBadge: { backgroundColor: colors.primary },
  rentBadge: { backgroundColor: '#2980B9' },
  listingBadgeText: {
    fontSize: 9, fontWeight: typography.fontWeight.bold,
    color: colors.white, letterSpacing: 0.4,
  },
  removePropBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  propCardBody: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  propPrice: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.extrabold,
    color: colors.primary,
    marginBottom: 3,
  },
  propPriceUnit: {
    fontSize: 10,
    fontWeight: typography.fontWeight.normal,
    color: colors.textSecondary,
  },
  propTitle: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    lineHeight: 15,
    marginBottom: 4,
  },
  propLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  propLocationText: {
    fontSize: 9,
    color: colors.textSecondary,
    flex: 1,
  },

  // ── Section header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 2,
  },
  sectionLabelCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  sectionIconWrap: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitleCell: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },

  // ── Attribute row
  row: {
    flexDirection: 'row',
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    alignItems: 'stretch',
  },
  rowEven: { backgroundColor: colors.surface },
  rowOdd: { backgroundColor: colors.background },

  // ── Label cell
  labelCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  labelIconWrap: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  labelText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    flex: 1,
    lineHeight: 14,
  },

  // ── Value cell
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderLeftWidth: 1,
    borderLeftColor: colors.borderLight,
    gap: 4,
  },
  highlightBadge: {
    width: 18, height: 18, borderRadius: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  cellText: {
    fontSize: 12,
    textAlign: 'center',
    flexShrink: 1,
    lineHeight: 16,
  },
  boolWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  boolText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
  },

  // ── Amenities card
  amenitiesCard: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  amenitiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  amenitiesHeaderTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  amenitiesGrid: { flexDirection: 'row' },
  amenitiesCol: {
    padding: spacing.sm,
    flex: 1,
    gap: 5,
  },
  amenitiesColBorder: {
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
  },
  amenitiesColHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  amenitiesColNum: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    backgroundColor: colors.primary,
    width: 16, height: 16, borderRadius: 5,
    textAlign: 'center',
    lineHeight: 16,
  },
  amenitiesColTitle: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    flex: 1,
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amenityName: { fontSize: 10, color: colors.text, flex: 1 },
  noAmenity: { fontSize: 10, color: colors.textLight, fontStyle: 'italic' },

  // ── Legend card
  legendCard: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  legendCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.primarySurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  legendCardTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '47%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  legendSwatch: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  legendTextWrap: { flex: 1 },
  legendLabel: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
  },
  legendDesc: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 1,
  },
});

export default CompareScreen;
