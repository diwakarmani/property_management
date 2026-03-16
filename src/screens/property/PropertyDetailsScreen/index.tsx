import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Linking, Share, SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { MOCK_PROPERTIES } from '@/utils/mockData';
import Header from '@/components/common/Header';

const PropertyDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params as any;
  const [property, setProperty] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    // Mock API call - replace with: await PropertyService.getById(id)
    const mockProperty = MOCK_PROPERTIES.find(p => p.id === id) || {
      ...MOCK_PROPERTIES[0],
      id,
      amenities: ['Swimming Pool', 'Gym', 'Parking', 'Security', 'Garden', 'Power Backup'],
      ownerName: 'John Doe',
      ownerPhone: '+91 98765 43210',
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      ],
    };
    setProperty(mockProperty);
  }, [id]);

  const handleShare = async () => {
    await Share.share({ message: `Check out this property: ${property.title}` });
  };

  const handleContact = () => {
    Linking.openURL(`tel:${property.ownerPhone}`);
  };

  const toggleFavorite = () => {
    // API call: POST/DELETE /api/favorites
    setIsFavorite(!isFavorite);
  };

  if (!property) return null;

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
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
        {/* Image Gallery */}
        <ScrollView horizontal pagingEnabled style={styles.imageGallery}>
          {property.images?.map((img: string, idx: number) => (
            <Image key={idx} source={{ uri: img }} style={styles.image} />
          ))}
        </ScrollView>

        {/* Price & Title */}
        <View style={styles.content}>
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>{formatPrice(property.price)}</Text>
              {property.listingType === 'RENT' && <Text style={styles.priceSubtext}>/month</Text>}
            </View>
            {property.verified && (
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

          {/* Key Details */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailBox}>
              <Ionicons name="bed-outline" size={24} color={colors.primary} />
              <Text style={styles.detailLabel}>{property.bedrooms} Bedrooms</Text>
            </View>
            <View style={styles.detailBox}>
              <Ionicons name="water-outline" size={24} color={colors.primary} />
              <Text style={styles.detailLabel}>{property.bathrooms} Bathrooms</Text>
            </View>
            <View style={styles.detailBox}>
              <Ionicons name="resize-outline" size={24} color={colors.primary} />
              <Text style={styles.detailLabel}>{property.carpetArea} sqft</Text>
            </View>
            <View style={styles.detailBox}>
              <Ionicons name="cube-outline" size={24} color={colors.primary} />
              <Text style={styles.detailLabel}>{property.furnishedStatus}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>

          {/* Amenities */}
          {property.amenities && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {property.amenities.map((amenity: string, idx: number) => (
                  <View key={idx} style={styles.amenityChip}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Similar Properties */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Similar Properties</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {MOCK_PROPERTIES.slice(0, 3).map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.similarCard}
                  onPress={() => navigation.push('PropertyDetail', { id: p.id })}
                >
                  <Image source={{ uri: p.primaryImageUrl }} style={styles.similarImage} />
                  <Text style={styles.similarTitle} numberOfLines={1}>{p.title}</Text>
                  <Text style={styles.similarPrice}>{formatPrice(p.price)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Contact Button */}
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
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
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
  similarCard: {
    width: 150,
    marginRight: spacing.md,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
  },
  similarImage: { width: '100%', height: 100 },
  similarTitle: {
    fontSize: typography.fontSize.sm,
    padding: spacing.sm,
    fontWeight: '500',
  },
  similarPrice: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    fontWeight: '600',
  },
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
  contactButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
});

export default PropertyDetailScreen;