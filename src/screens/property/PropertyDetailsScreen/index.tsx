import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  Share,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '@/theme';
import { usePropertyQuery } from '@/api/hooks/useProperties';
import {
  useFavoriteCheckQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} from '@/api/hooks/useFavorites';
import AsyncBoundary from '@/components/common/AsyncBoundary';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PropertyDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params as any;
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);

  const { data: property, isLoading, isError, error, refetch } = usePropertyQuery(id);
  // `isFavorite` is undefined while loading — do NOT default to false here.
  // Defaulting to false causes toggleFavorite to call addFavorite when the user
  // taps before the check resolves (i.e. unfavourite tap fires add instead of remove).
  const { data: isFavorite, isLoading: checkLoading } = useFavoriteCheckQuery(id);
  const addFavorite = useAddFavoriteMutation();
  const removeFavorite = useRemoveFavoriteMutation();

  const handleShare = async () => {
    if (!property) return;
    await Share.share({ message: `Check out this property: ${property.title}` });
  };

  const handleContact = () => {
    if (!property?.ownerPhone) return;
    Linking.openURL(`tel:${property.ownerPhone}`);
  };

  const favoriteBlocked = checkLoading || addFavorite.isPending || removeFavorite.isPending;

  const toggleFavorite = () => {
    if (favoriteBlocked) return;
    if (isFavorite) removeFavorite.mutate(id);
    else addFavorite.mutate(id);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
    return `$${price.toLocaleString('en-US')}`;
  };

  const errorMessage = isError
    ? (error as any)?.response?.data?.message ?? 'Could not load this property.'
    : null;

  if (isLoading || errorMessage || !property) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AsyncBoundary
          loading={isLoading}
          error={errorMessage || (!property && !isLoading ? 'Property not found.' : null)}
          onRetry={() => refetch()}
        >
          <View />
        </AsyncBoundary>
      </SafeAreaView>
    );
  }

  const rawImages = property.images?.length
    ? (property.images.map((img: any) => img.imageUrl).filter(Boolean) as string[])
    : null;
  const imageUrls: string[] = rawImages ?? (property.primaryImageUrl ? [property.primaryImageUrl] : []);
  const amenityNames = property.amenities?.map(a => a.name) ?? [];

  const detailItems = [
    property.bedrooms != null && { icon: 'bed-outline', label: `${property.bedrooms} Bedroom${property.bedrooms !== 1 ? 's' : ''}`, sub: 'Bedrooms' },
    property.bathrooms != null && { icon: 'water-outline', label: `${property.bathrooms} Bathroom${property.bathrooms !== 1 ? 's' : ''}`, sub: 'Bathrooms' },
    property.carpetArea != null && { icon: 'resize-outline', label: `${property.carpetArea.toLocaleString('en-US')} sqft`, sub: 'Carpet Area' },
    property.furnishedStatus && { icon: 'cube-outline', label: property.furnishedStatus.replace(/_/g, ' '), sub: 'Furnishing' },
    property.floorNumber != null && { icon: 'business-outline', label: `Floor ${property.floorNumber}`, sub: 'Floor' },
    property.totalFloors != null && { icon: 'layers-outline', label: `${property.totalFloors} Floors`, sub: 'Total Floors' },
    property.facingDirection && { icon: 'compass-outline', label: property.facingDirection, sub: 'Facing' },
    (property.parkingCovered != null || property.parkingOpen != null) && {
      icon: 'car-outline',
      label: (() => {
        const total = (property.parkingCovered ?? 0) + (property.parkingOpen ?? 0);
        return total > 0 ? `${total} Parking` : 'No Parking';
      })(),
      sub: 'Parking',
    },
  ].filter(Boolean) as { icon: string; label: string; sub: string }[];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Floating Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Property Details</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={toggleFavorite}
            style={[styles.headerBtn, favoriteBlocked && { opacity: 0.45 }]}
            disabled={favoriteBlocked}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? colors.error : colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
            <Ionicons name="share-social-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        {imageUrls.length > 0 ? (
          <View style={styles.galleryWrap}>
            <ScrollView
              horizontal
              pagingEnabled
              style={styles.imageGallery}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveImageIndex(idx);
              }}
            >
              {imageUrls.map((url, idx) => (
                <Image key={idx} source={{ uri: url }} style={styles.image} />
              ))}
            </ScrollView>
            {imageUrls.length > 1 && (
              <View style={styles.imageDots}>
                {imageUrls.map((_, i) => (
                  <View key={i} style={[styles.dot, i === activeImageIndex && styles.dotActive]} />
                ))}
              </View>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(26,26,46,0.4)']}
              style={styles.galleryGradient}
            />
            <View style={[
              styles.listingTypeBadge,
              property.listingType === 'RENT' ? styles.rentBadge : styles.saleBadge,
            ]}>
              <Text style={styles.listingTypeText}>{property.listingType}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.noImageWrap}>
            <Ionicons name="image-outline" size={52} color={colors.border} />
            <Text style={styles.noImageLabel}>No photos available</Text>
            <View style={[
              styles.listingTypeBadge,
              property.listingType === 'RENT' ? styles.rentBadge : styles.saleBadge,
            ]}>
              <Text style={styles.listingTypeText}>{property.listingType}</Text>
            </View>
          </View>
        )}

        <View style={styles.content}>
          {/* Price + Verified */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>{formatPrice(property.price)}</Text>
              {property.listingType === 'RENT' && (
                <Text style={styles.priceSubtext}>per month</Text>
              )}
            </View>
            {property.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{property.title}</Text>

          <View style={styles.locationRow}>
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={12} color={colors.white} />
            </View>
            <Text style={styles.locationText}>{property.locality}, {property.city}</Text>
          </View>

          {/* Detail chips */}
          {detailItems.length > 0 && (
            <View style={styles.detailsGrid}>
              {detailItems.map((item, idx) => (
                <View key={idx} style={styles.detailBox}>
                  <View style={styles.detailIconWrap}>
                    <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.detailValue}>{item.label}</Text>
                  <Text style={styles.detailSub}>{item.sub}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          {property.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{property.description}</Text>
            </View>
          )}

          {/* Amenities */}
          {amenityNames.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {amenityNames.map((name, idx) => (
                  <View key={idx} style={styles.amenityChip}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={styles.amenityText}>{name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Owner info */}
          {property.ownerName && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Listed by</Text>
              <View style={styles.ownerCard}>
                <View style={styles.ownerAvatar}>
                  <Ionicons name="person" size={22} color={colors.white} />
                </View>
                <View style={styles.ownerInfo}>
                  <Text style={styles.ownerName}>{property.ownerName}</Text>
                  <Text style={styles.ownerRole}>Property Agent</Text>
                </View>
                {property.ownerPhone && (
                  <TouchableOpacity style={styles.ownerCallBtn} onPress={handleContact}>
                    <Ionicons name="call-outline" size={16} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer CTAs */}
      <View style={styles.footer}>
        {property.ownerPhone && (
          <TouchableOpacity style={styles.callButton} onPress={handleContact}>
            <Ionicons name="call" size={18} color={colors.primary} />
            <Text style={styles.callButtonText}>Call</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.inquiryButton}
          onPress={() => (navigation as any).navigate('ContactAgent', {
            propertyId: property?.id ?? id,
            propertyTitle: property?.title,
          })}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.inquiryGradient}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color={colors.white} />
            <Text style={styles.inquiryButtonText}>Send Inquiry</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginHorizontal: spacing.sm,
  },
  headerRight: { flexDirection: 'row', gap: 8 },

  container: { flex: 1 },

  galleryWrap: { position: 'relative', height: 280 },
  noImageWrap: {
    height: 280,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    position: 'relative',
  },
  noImageLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    fontWeight: '500' as any,
  },
  imageGallery: { height: 280 },
  image: { width: SCREEN_WIDTH, height: 280, resizeMode: 'cover' },
  galleryGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  imageDots: {
    position: 'absolute',
    bottom: spacing.sm,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: { backgroundColor: colors.white, width: 18 },
  listingTypeBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  saleBadge: { backgroundColor: colors.primary },
  rentBadge: { backgroundColor: '#2980B9' },
  listingTypeText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },

  content: { padding: spacing.lg },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  price: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  priceSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successSurface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  verifiedText: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
    fontWeight: typography.fontWeight.bold,
  },

  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    lineHeight: 26,
    marginBottom: spacing.sm,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.lg },
  locationIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: { fontSize: typography.fontSize.md, color: colors.textSecondary, flex: 1 },

  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  detailBox: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  detailIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  detailSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 1,
  },

  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successSurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  amenityText: { fontSize: typography.fontSize.xs, color: colors.text, fontWeight: typography.fontWeight.medium },

  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerInfo: { flex: 1 },
  ownerName: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.text },
  ownerRole: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  ownerCallBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  footer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 6,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  callButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  inquiryButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  inquiryGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
  },
  inquiryButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});

export default PropertyDetailScreen;
