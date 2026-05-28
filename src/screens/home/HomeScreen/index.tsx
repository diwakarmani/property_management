import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useHomeFeedQuery } from '@/api/hooks/useDiscovery';
import { useFavoriteIdsSet, useAddFavoriteMutation, useRemoveFavoriteMutation } from '@/api/hooks/useFavorites';
import { colors, spacing, typography } from '@/theme';
import PropertyCard from '@/components/property/PropertyCard';
import type { RootState } from '@/store';
import type { PropertyCardDTO } from '@/api/types/discovery.types';

type SectionKey = 'POPULAR' | 'RECOMMENDED' | 'NEAREST';

const SECTIONS: { key: SectionKey; title: string; subtitle: string; icon: string }[] = [
  { key: 'POPULAR', title: 'Popular', subtitle: 'Most viewed near you', icon: 'flame' },
  { key: 'RECOMMENDED', title: 'For You', subtitle: 'Picked for you', icon: 'sparkles' },
  { key: 'NEAREST', title: 'Nearest', subtitle: 'Closest to you', icon: 'navigate' },
];


const HomeScreen = ({ navigation }: any) => {
  const { selectedCity, coordinates } = useSelector((state: RootState) => state.location);
  const firstName = useSelector((state: RootState) => state.auth.user?.firstName);
  const isBuyer = useSelector((state: RootState) =>
    state.auth.user?.roles.includes('BUYER') ?? false
  );

  const { ids: favoriteIds, isLoading: idsLoading } = useFavoriteIdsSet(isBuyer);
  const addFavorite = useAddFavoriteMutation();
  const removeFavorite = useRemoveFavoriteMutation();

  const toggleFavorite = (id: number) => {
    if (idsLoading) return;
    if (favoriteIds.has(id)) removeFavorite.mutate(id);
    else addFavorite.mutate(id);
  };

  const { data: home, isLoading, isError, isFetching, refetch } = useHomeFeedQuery(
    selectedCity?.name,
    coordinates.latitude || undefined,
    coordinates.longitude || undefined
  );

  const sectionData = (key: SectionKey): PropertyCardDTO[] => {
    if (!home) return [];
    if (key === 'POPULAR') return home.popular ?? [];
    if (key === 'RECOMMENDED') return home.recommended ?? [];
    return home.nearest ?? [];
  };

  const allEmpty = !!home && SECTIONS.every((s) => sectionData(s.key).length === 0);

  const Hero = () => (
    <LinearGradient
      colors={[colors.primary, colors.gradientMid, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      {/* Top row */}
      <View style={styles.heroTopRow}>
        <View>
          <Text style={styles.greeting}>
            Hello{firstName ? `, ${firstName}` : ''} 👋
          </Text>
          <Text style={styles.heroTitle}>Find your{'\n'}dream home</Text>
        </View>
      </View>

      {/* Location pill */}
      {selectedCity?.name ? (
        <TouchableOpacity
          style={styles.locationPill}
          onPress={() => navigation.navigate('LocationSelection')}
          activeOpacity={0.85}
        >
          <View style={styles.locationPillIcon}>
            <Ionicons name="location" size={12} color={colors.primary} />
          </View>
          <Text style={styles.locationPillText}>{selectedCity.name}</Text>
          <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      ) : null}
    </LinearGradient>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centeredText}>Fetching properties…</Text>
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorCard}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="cloud-offline-outline" size={40} color={colors.primary} />
          </View>
          <Text style={styles.errorTitle}>Couldn't load properties</Text>
          <Text style={styles.errorSubtext}>Check your connection and try again.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Ionicons name="refresh" size={16} color={colors.white} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderSection = ({ key, title, subtitle, icon }: typeof SECTIONS[number]) => {
    const data = sectionData(key);
    return (
      <View key={key} style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLeft}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name={icon as any} size={14} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>{title}</Text>
              <Text style={styles.sectionSubtitle}>{subtitle}</Text>
            </View>
          </View>
          {data.length > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('ViewMore', { category: key, title })}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewMore}>View all</Text>
              <Ionicons name="arrow-forward" size={13} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        {data.length > 0 ? (
          <FlatList
            horizontal
            data={data}
            keyExtractor={(item) => `${key}-${item.id}`}
            renderItem={({ item }) => (
              <PropertyCard
                property={item}
                onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
                style={styles.card}
                isFavorited={isBuyer ? favoriteIds.has(item.id) : undefined}
                onFavoriteToggle={isBuyer ? () => toggleFavorite(item.id) : undefined}
              />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.sectionEmpty}>
            <Ionicons name="home-outline" size={28} color={colors.border} />
            <Text style={styles.sectionEmptyText}>
              No {title.toLowerCase()} listings in {selectedCity?.name || 'this area'} yet
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isLoading}
          onRefresh={() => refetch()}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <Hero />

      {allEmpty ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="home-outline" size={40} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No properties yet</Text>
          <Text style={styles.emptyText}>
            No listings in {selectedCity?.name || 'this area'} right now.{'\n'}Try another city or pull to refresh.
          </Text>
          <TouchableOpacity
            style={styles.changeCityBtn}
            onPress={() => navigation.navigate('LocationSelection')}
          >
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={styles.changeCityText}>Change city</Text>
          </TouchableOpacity>
        </View>
      ) : (
        SECTIONS.map(renderSection)
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xl },

  hero: {
    paddingTop: 20,
    paddingBottom: 28,
    paddingHorizontal: spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  greeting: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: typography.fontWeight.medium,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.white,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  locationPillIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPillText: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },

  section: { marginTop: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primarySurface,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  viewMore: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  listContent: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  card: { marginRight: 12 },
  sectionEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
  },
  sectionEmptyText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  centered: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  errorCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    width: '100%',
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  errorTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  errorSubtext: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  centeredText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  changeCityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySurface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  changeCityText: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  retryText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default HomeScreen;
