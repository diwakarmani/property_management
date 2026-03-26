import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Linking, Share, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { PropertyService } from '@/api/services/property.service';
import { FavoriteService } from '@/api/services/favorite.service';
import type { PropertyDTO } from '@/api/types/property.types';

const PropertyDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params as any;
  const [property, setProperty] = useState<PropertyDTO | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    PropertyService.getById(id)
      .then(res => setProperty(res.data.data))
      .catch(err => console.error('Failed to load property', err))
      .finally(() => setLoading(false));
    FavoriteService.checkFavorite(id)
      .then(res => setIsFavorite(res.data.data ?? false))
      .catch(() => {/* not authenticated or not a buyer — ignore */});
  }, [id]);

  const handleShare = async () => {
    if (!property) return;
    await Share.share({ message: `Check out this property: ${property.title}` });
  };

  const handleContact = () => {
    if (!property?.ownerPhone) return;
    Linking.openURL(`tel:${property.ownerPhone}`);
  };

  const toggleFavorite = () => {
    if (favoriteLoading) return;
    setFavoriteLoading(true);
    const action = isFavorite
      ? FavoriteService.removeFavorite(id)
      : FavoriteService.addFavorite(id);
    action
      .then(() => setIsFavorite(prev => !prev))
      .catch(() => {/* silently ignore — user may not be logged in */})
      .finally(() => setFavoriteLoading(false));
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!property) return null;

  const imageUrls = property.images?.map(img => img.imageUrl) ?? (property.primaryImageUrl ? [property.primaryImageUrl] : []);
  const amenityNames = property.amenities?.map(a => a.name) ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Property Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleFavorite} style={styles.iconButton}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? colors.error : colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
            <Ionicons name="share-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container}>
        {imageUrls.length > 0 && (
          <ScrollView horizontal pagingEnabled style={styles.imageGallery}>
            {imageUrls.map((url, idx) => (
              <Image key={idx} source={{ uri: url }} style={styles.image} />
            ))}
          </ScrollView>
        )}

        <View style={styles.content}>
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>{formatPrice(property.price)}</Text>
              {property.listingType === 'RENT' && <Text style={styles.priceSubtext}>/month</Text>}
            </View>
            {property.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.badgeText}>Verified</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{property.title}</Text>

          <View style={styles.location}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.locationText}>
              {property.locality}, {property.city}
            </Text>
          </View>

          <View style={styles.detailsGrid}>
            {property.bedrooms != null && (
              <View style={styles.detailBox}>
                <Ionicons name="bed-outline" size={24} color={colors.primary} />
                <Text style={styles.detailLabel}>{property.bedrooms} Bedrooms</Text>
              </View>
            )}
            {property.bathrooms != null && (
              <View style={styles.detailBox}>
                <Ionicons name="water-outline" size={24} color={colors.primary} />
                <Text style={styles.detailLabel}>{property.bathrooms} Bathrooms</Text>
              </View>
            )}
            {property.carpetArea != null && (
              <View style={styles.detailBox}>
                <Ionicons name="resize-outline" size={24} color={colors.primary} />
                <Text style={styles.detailLabel}>{property.carpetArea} sqft</Text>
              </View>
            )}
            {property.furnishedStatus && (
              <View style={styles.detailBox}>
                <Ionicons name="cube-outline" size={24} color={colors.primary} />
                <Text style={styles.detailLabel}>{property.furnishedStatus}</Text>
              </View>
            )}
          </View>

          {property.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{property.description}</Text>
            </View>
          )}

          {amenityNames.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {amenityNames.map((name, idx) => (
                  <View key={idx} style={styles.amenityChip}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.amenityText}>{name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
          <Ionicons name="call" size={20} color={colors.white} />
          <Text style={styles.contactButtonText}>Contact Owner</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  iconButton: { padding: spacing.xs },
  container: { flex: 1 },
  imageGallery: { height: 300 },
  image: { width: 400, height: 300 },
  content: { padding: spacing.lg },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: typography.fontSize['3xl'], fontWeight: 'bold', color: colors.primary },
  priceSubtext: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 4 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  badgeText: { fontSize: typography.fontSize.xs, color: colors.success, fontWeight: '600' },
  title: { fontSize: typography.fontSize.xl, fontWeight: '600', marginTop: spacing.sm },
  location: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: 4 },
  locationText: { fontSize: typography.fontSize.md, color: colors.textSecondary },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.lg, gap: spacing.md },
  detailBox: {
    width: '47%',
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailLabel: { fontSize: typography.fontSize.sm, color: colors.text, fontWeight: '500' },
  section: { marginTop: spacing.xl },
  sectionTitle: { fontSize: typography.fontSize.lg, fontWeight: 'bold', marginBottom: spacing.sm },
  description: { fontSize: typography.fontSize.md, color: colors.textSecondary, lineHeight: 24 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  amenityText: { fontSize: typography.fontSize.sm, color: colors.text },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  contactButtonText: { color: colors.white, fontSize: typography.fontSize.md, fontWeight: '600' },
});

export default PropertyDetailScreen;
