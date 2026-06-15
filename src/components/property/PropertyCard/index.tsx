import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '@/theme';
import type { PropertyCardDTO } from '@/api/types/discovery.types';
import OptimizedImage from '@/components/common/OptimizedImage';

interface PropertyCardProps {
  property: PropertyCardDTO;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  isFavorited?: boolean;
  onFavoriteToggle?: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onPress, style, isFavorited, onFavoriteToggle }) => {
  const formatPrice = (price: number) => {
    if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
    if (price >= 1_000) return `$${(price / 1_000).toFixed(0)}K`;
    return `$${price.toLocaleString('en-US')}`;
  };
  const listingLabel = property.listingType === 'SALE' ? 'BUY' : property.listingType;
  const isRecurringPrice = property.listingType === 'RENT' || property.listingType === 'LEASE';

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.92}
    >
      {/* Image with gradient overlay */}
      <View style={styles.imageContainer}>
        {property.primaryImageUrl ? (
          <OptimizedImage uri={property.primaryImageUrl} style={styles.image} />
        ) : (
          <View style={styles.noImage}>
            <Ionicons name="home-outline" size={30} color={colors.border} />
            <Text style={styles.noImageText}>No Photo</Text>
          </View>
        )}

        {/* Bottom gradient for readability */}
        <LinearGradient
          colors={['transparent', 'rgba(26,26,46,0.75)']}
          style={styles.imageGradient}
        />

        {/* Badges top-left */}
        <View style={styles.badgesTop}>
          {property.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color={colors.white} />
              <Text style={styles.badgeText}>Verified</Text>
            </View>
          )}
          {property.premium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={11} color={colors.white} />
              <Text style={styles.badgeText}>Premium</Text>
            </View>
          )}
        </View>

        {/* Listing type top-right */}
        <View style={[
          styles.listingTypeBadge,
          property.listingType === 'RENT' ? styles.rentBadge : property.listingType === 'LEASE' ? styles.leaseBadge : styles.saleBadge,
        ]}>
          <Text style={styles.listingTypeText}>{listingLabel}</Text>
        </View>

        {/* Price on image bottom-left */}
        <View style={styles.priceOnImage}>
          <Text style={styles.priceText}>{formatPrice(property.price)}</Text>
          {isRecurringPrice && (
            <Text style={styles.priceSubtext}>{property.listingType === 'LEASE' ? '/lease' : '/mo'}</Text>
          )}
        </View>

        {/* Heart button bottom-right — only rendered for BUYER users */}
        {onFavoriteToggle && (
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={(e) => { (e as any).stopPropagation?.(); onFavoriteToggle(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.8}
          >
            <View style={[styles.heartBtnInner, isFavorited && styles.heartBtnActive]}>
              <Ionicons
                name={isFavorited ? 'heart' : 'heart-outline'}
                size={14}
                color={isFavorited ? colors.error : colors.white}
              />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {property.title}
        </Text>

        <View style={styles.location}>
          <Ionicons name="location" size={12} color={colors.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {property.locality}, {property.city}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.details} testID="property-card-details">
          {property.bedrooms > 0 && (
            <View style={styles.detailItem}>
              <Ionicons name="bed-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.detailText}>{property.bedrooms}</Text>
            </View>
          )}
          <View style={[styles.detailItem, styles.furnishingItem]} testID="property-card-furnishing">
            <Ionicons name="cube-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.detailText, styles.furnishingText]} numberOfLines={1}>
              {property.furnishedStatus?.replace('_', ' ')}
            </Text>
          </View>
          {property.distanceInKm !== undefined && (
            <View style={[styles.detailItem, styles.distancePill]} testID="property-card-distance">
              <Ionicons name="navigate" size={11} color={colors.primary} />
              <Text style={[styles.detailText, styles.distanceText]}>
                {property.distanceInKm?.toFixed(1)} km
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 240,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  imageContainer: {
    position: 'relative',
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  noImageText: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '500' as any,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  badgesTop: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    gap: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 2,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F39C12',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 2,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.3,
  },
  listingTypeBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  saleBadge: { backgroundColor: colors.primary },
  rentBadge: { backgroundColor: '#2980B9' },
  leaseBadge: { backgroundColor: '#7D3C98' },
  listingTypeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  priceOnImage: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  priceText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.extrabold,
    color: colors.white,
    letterSpacing: -0.3,
  },
  priceSubtext: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: typography.fontWeight.medium,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    lineHeight: 18,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 3,
  },
  locationText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 8,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  detailText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  furnishingItem: {
    flex: 1,
    minWidth: 0,
  },
  furnishingText: {
    flexShrink: 1,
  },
  distancePill: {
    marginLeft: 'auto',
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  distanceText: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },

  heartBtn: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
  },
  heartBtnInner: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(26,26,46,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
});

export default PropertyCard;
