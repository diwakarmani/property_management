import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import type { PropertyCardDTO } from '@/api/types/discovery.types';
import OptimizedImage from '@/components/common/OptimizedImage';

interface PropertyCardProps {
  property: PropertyCardDTO;
  onPress: () => void;
  style?: ViewStyle;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onPress, style }) => {
  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        <OptimizedImage uri={property.primaryImageUrl} style={styles.image} />
        {/* Listing Type */}
        <View style={styles.listingTypeBadge}>
          <Text style={styles.listingTypeText}>{property.listingType}</Text>
        </View>
        {/* Badges */}
        <View style={styles.badges}>
          {property.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.white} />
              <Text style={styles.badgeText}>Verified</Text>
            </View>
          )}
          {property.premium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={14} color={colors.white} />
              <Text style={styles.badgeText}>Premium</Text>
            </View>
          )}
        </View>


      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.cardHeaderContainer}>
          <Text style={styles.price}>{formatPrice(property.price)}  {property.listingType === 'RENT' && (
            <Text style={styles.priceSubtext}>/month</Text>
          )}</Text>
          <TouchableOpacity style={styles.saveButton}><MaterialIcons name='bookmark-outline' color={colors.white} size={20} /></TouchableOpacity>

        </View>


        <Text style={styles.title} numberOfLines={2}>
          {property.title}
        </Text>

        <View style={styles.location}>
          <Ionicons name="location-outline" size={14} color={colors.text} />
          <Text style={styles.locationText} numberOfLines={1}>
            {property.locality}, {property.city}
          </Text>
        </View>

        <View style={styles.details}>
          {property.bedrooms > 0 && (
            <View style={styles.detailItem}>
              <Ionicons name="bed-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.detailText}>{property.bedrooms} BHK</Text>
            </View>
          )}

          <View style={styles.detailItem}>
            <Ionicons name="cube-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>{property.furnishedStatus}</Text>
          </View>

          {property.distanceInKm !== undefined && (
            <View style={styles.detailItem}>
              <Ionicons name="navigate-outline" size={16} color={colors.primary} />
              <Text style={[styles.detailText, styles.distance]}>
                {property?.distanceInKm?.toFixed(1)} km
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
    width: 280,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 3,
    borderColor: 'transparent',
    marginVertical: 6
  },
  imageContainer: {
    position: 'relative',
    height: 180,


  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  badges: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 2,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 2,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
  },
  listingTypeBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.overlayLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 10,
  },
  listingTypeText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  price: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary,
  },
  priceSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginTop: spacing.xs,
    minHeight: 40,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 4,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    flex: 1,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 50,
    borderColor: colors.borderDark,
    borderWidth: 1,
    padding: 4
  },
  detailText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  distance: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  cardHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
    alignItems: 'center'
  }, saveButton: {
    width: 30,
    height: 30,
    backgroundColor: colors.secondary,
    borderRadius: 50,
    borderWidth: 1,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'transparent'
  }
});

export default PropertyCard;