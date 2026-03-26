import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { FavoriteService } from '@/api/services/favorite.service';
import type { PropertyDTO } from '@/api/types/property.types';
import OptimizedImage from '@/components/common/OptimizedImage';

const formatPrice = (price: number) => {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
};

const FavoritesScreen = () => {
  const navigation = useNavigation<any>();
  const [favorites, setFavorites] = useState<PropertyDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    FavoriteService.getFavorites(0, 50)
      .then(res => setFavorites(res.data.data?.content ?? []))
      .catch(err => console.error('Failed to load favorites', err))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemove = (property: PropertyDTO) => {
    Alert.alert(
      'Remove Favorite',
      `Remove "${property.title}" from favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            FavoriteService.removeFavorite(property.id)
              .then(() => setFavorites(prev => prev.filter(p => p.id !== property.id)))
              .catch(() => Alert.alert('Error', 'Failed to remove from favorites'));
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Properties</Text>
        <Text style={styles.headerCount}>{favorites.length} saved</Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchFavorites(true)} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
            activeOpacity={0.9}
          >
            <View style={styles.imageWrap}>
              <OptimizedImage uri={item.primaryImageUrl ?? ''} style={styles.image} />
              {item.listingType && (
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{item.listingType}</Text>
                </View>
              )}
            </View>

            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <View style={styles.cardInfo}>
                  <Text style={styles.price}>{formatPrice(item.price)}</Text>
                  <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.location} numberOfLines={1}>
                      {item.locality}, {item.city}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.heartBtn}
                  onPress={() => handleRemove(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="heart" size={22} color={colors.error} />
                </TouchableOpacity>
              </View>

              {(item.bedrooms || item.bathrooms || item.carpetArea) ? (
                <View style={styles.meta}>
                  {item.bedrooms ? (
                    <View style={styles.metaItem}>
                      <Ionicons name="bed-outline" size={13} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{item.bedrooms} BHK</Text>
                    </View>
                  ) : null}
                  {item.bathrooms ? (
                    <View style={styles.metaItem}>
                      <Ionicons name="water-outline" size={13} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{item.bathrooms} Bath</Text>
                    </View>
                  ) : null}
                  {item.carpetArea ? (
                    <View style={styles.metaItem}>
                      <Ionicons name="resize-outline" size={13} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{item.carpetArea} sqft</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={56} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No saved properties</Text>
            <Text style={styles.emptySubtext}>
              Tap the heart icon on any property to save it here
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  headerTitle: { fontSize: typography.fontSize.xl, fontWeight: 'bold' },
  headerCount: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  list: { padding: spacing.md, gap: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  imageWrap: { position: 'relative', height: 180 },
  image: { width: '100%', height: '100%' },
  typeBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  cardBody: { padding: spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1, marginRight: spacing.sm },
  price: { fontSize: typography.fontSize.lg, fontWeight: 'bold', color: colors.primary },
  title: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text, marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  location: { fontSize: typography.fontSize.sm, color: colors.textSecondary, flex: 1 },
  heartBtn: { padding: 4 },
  meta: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: spacing.xl, gap: spacing.md },
  emptyTitle: { fontSize: typography.fontSize.lg, fontWeight: '600', color: colors.text },
  emptySubtext: { fontSize: typography.fontSize.md, color: colors.textSecondary, textAlign: 'center' },
});

export default FavoritesScreen;
