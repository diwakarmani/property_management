import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  Share,
  Dimensions,
  Platform,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '@/theme';
import { usePropertyQuery, useRevealContactMutation } from '@/api/hooks/useProperties';
import { queryClient, queryKeys } from '@/api/queryClient';
import {
  useFavoriteCheckQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} from '@/api/hooks/useFavorites';
import { useRealtorProfileQuery } from '@/api/hooks/useStats';
import AsyncBoundary from '@/components/common/AsyncBoundary';
import type { RootState } from '@/store';
import { isBuyerExperience } from '@/utils/rbac/permissions';
import type { ContactRevealResponse } from '@/api/types/property.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const POSSESSION_LABELS: Record<string, string> = {
  READY_TO_MOVE: 'Ready to Move',
  WITHIN_15_DAYS: 'Within 15 Days',
  WITHIN_1_MONTH: 'Within 1 Month',
  WITHIN_3_MONTHS: 'Within 3 Months',
  WITHIN_6_MONTHS: 'Within 6 Months',
  WITHIN_1_YEAR: 'Within 1 Year',
  UNDER_CONSTRUCTION: 'Under Construction',
};

const OWNERSHIP_LABELS: Record<string, string> = {
  FREEHOLD: 'Freehold',
  LEASEHOLD: 'Leasehold',
  CO_OPERATIVE_SOCIETY: 'Co-operative Society',
  POWER_OF_ATTORNEY: 'Power of Attorney',
};

const KITCHEN_LABELS: Record<string, string> = {
  MODULAR_KITCHEN: 'Modular',
  OPEN_KITCHEN: 'Open Kitchen',
  CLOSED_KITCHEN: 'Closed Kitchen',
  NO_KITCHEN: 'No Kitchen',
};

const WATER_LABELS: Record<string, string> = {
  CORPORATION_WATER: 'Corporation',
  BOREWELL: 'Borewell',
  BOTH: 'Both',
  '24_7_SUPPLY': '24/7 Supply',
  TANKER: 'Tanker',
};

const AMENITY_ICONS: Record<string, { icon: string; color: string }> = {
  SAFETY: { icon: 'shield-checkmark-outline', color: '#E74C3C' },
  RECREATION: { icon: 'leaf-outline', color: '#27AE60' },
  UTILITIES: { icon: 'flash-outline', color: '#F39C12' },
  PARKING: { icon: 'car-outline', color: '#2980B9' },
  ACCESS: { icon: 'accessibility-outline', color: '#8E44AD' },
  MODERN: { icon: 'wifi-outline', color: colors.primary },
  SERVICES: { icon: 'people-outline', color: '#16A085' },
};

const AMENITY_ICON_BY_NAME: Record<string, string> = {
  'Lift': 'arrow-up-circle-outline',
  'Swimming Pool': 'water-outline',
  'Gymnasium': 'barbell-outline',
  "Children's Play Area": 'happy-outline',
  'Park': 'leaf-outline',
  'Garden': 'flower-outline',
  '24/7 Security': 'shield-outline',
  'CCTV Surveillance': 'videocam-outline',
  'Fire Safety': 'flame-outline',
  'Power Backup': 'battery-charging-outline',
  'Air Conditioning': 'snow-outline',
  'Internet/WiFi': 'wifi-outline',
  'Covered Parking': 'car-outline',
  'Maintenance Staff': 'construct-outline',
  'Jogging Track': 'walk-outline',
  'Clubhouse': 'business-outline',
};

const SpecChip = ({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string;
  label: string;
  empty?: boolean;
}) => (
  <View style={styles.specChip}>
    <View style={styles.specChipIcon}>
      <Ionicons name={icon as any} size={18} color={colors.primary} />
    </View>
    <Text style={styles.specChipValue}>{value}</Text>
    <Text style={styles.specChipLabel}>{label}</Text>
  </View>
);

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
  empty?: boolean;
}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoRowLeft}>
      <Ionicons name={icon as any} size={15} color={colors.primary} />
      <Text style={styles.infoRowLabel}>{label}</Text>
    </View>
    <Text style={styles.infoRowValue}>{value}</Text>
  </View>
);

const ActivityStat = ({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: number;
  label: string;
  color: string;
}) => (
  <View style={styles.activityStat}>
    <View style={[styles.activityIcon, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <Text style={[styles.activityValue, { color }]}>
      {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value)}
    </Text>
    <Text style={styles.activityLabel}>{label}</Text>
  </View>
);

interface ContactRevealModalProps {
  visible: boolean;
  propertyTitle?: string;
  maskedPhone?: string;
  revealedData?: ContactRevealResponse | null;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
  onDial: (phone: string) => void;
}

const ContactRevealModal = ({
  visible,
  propertyTitle,
  maskedPhone,
  revealedData,
  isLoading,
  onConfirm,
  onClose,
  onDial,
}: ContactRevealModalProps) => {
  const isRevealed = !!revealedData;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.sheet}>

          <View style={modalStyles.header}>
            <View style={modalStyles.iconCircle}>
              <Ionicons name="call" size={24} color={colors.primary} />
            </View>
            <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {!isRevealed ? (

            <>
              <Text style={modalStyles.title}>View Contact Details?</Text>
              <Text style={modalStyles.subtitle}>
                You're about to reveal the owner's contact for
              </Text>
              <Text style={modalStyles.propertyName} numberOfLines={2}>
                {propertyTitle}
              </Text>

              {maskedPhone ? (
                <View style={modalStyles.maskedRow}>
                  <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                  <Text style={modalStyles.maskedPhone}>{maskedPhone}</Text>
                  <View style={modalStyles.lockedBadge}>
                    <Ionicons name="lock-closed" size={10} color={colors.textLight} />
                  </View>
                </View>
              ) : (
                <View style={modalStyles.maskedRow}>
                  <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
                  <Text style={modalStyles.maskedPhone}>Email contact available</Text>
                  <View style={modalStyles.lockedBadge}>
                    <Ionicons name="lock-closed" size={10} color={colors.textLight} />
                  </View>
                </View>
              )}

              <Text style={modalStyles.note}>
                The owner will be notified that someone viewed their contact details.
              </Text>

              <TouchableOpacity
                style={[modalStyles.confirmBtn, isLoading && { opacity: 0.7 }]}
                onPress={onConfirm}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={modalStyles.confirmGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <>
                      <Ionicons name="eye-outline" size={18} color={colors.white} />
                      <Text style={modalStyles.confirmText}>Reveal Contact</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
                <Text style={modalStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (

            <>
              <View style={modalStyles.successBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={modalStyles.successText}>
                  {revealedData.alreadyContacted ? 'Already contacted' : 'Contact revealed!'}
                </Text>
              </View>

              <Text style={modalStyles.title}>{revealedData.ownerName}</Text>
              <Text style={modalStyles.subtitle}>Owner / Listed by</Text>

              {revealedData.phone ? (
                <TouchableOpacity
                  style={modalStyles.contactRow}
                  onPress={() => onDial(revealedData.phone!)}
                  activeOpacity={0.75}
                >
                  <View style={modalStyles.contactIconWrap}>
                    <Ionicons name="call" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={modalStyles.contactLabel}>Phone</Text>
                    <Text style={modalStyles.contactValue}>{revealedData.phone}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
                </TouchableOpacity>
              ) : null}

              {revealedData.email ? (
                <View style={modalStyles.contactRow}>
                  <View style={modalStyles.contactIconWrap}>
                    <Ionicons name="mail" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={modalStyles.contactLabel}>Email</Text>
                    <Text style={modalStyles.contactValue}>{revealedData.email}</Text>
                  </View>
                </View>
              ) : null}

              <TouchableOpacity style={modalStyles.doneBtn} onPress={onClose}>
                <Text style={modalStyles.doneText}>Done</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const PropertyDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params as any;
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const isBuyer = useSelector((state: RootState) =>
    isBuyerExperience(state.auth.user?.roles, state.auth.activeRole)
  );
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const galleryRef = useRef<ScrollView>(null);

  const [revealModalVisible, setRevealModalVisible] = useState(false);
  const [revealedContact, setRevealedContact] = useState<ContactRevealResponse | null>(null);
  const revealContact = useRevealContactMutation();

  const { data: property, isLoading, isError, error, refetch } = usePropertyQuery(id);

  useFocusEffect(
    useCallback(() => {
      const state = queryClient.getQueryState(queryKeys.property(id));
      if (state?.isInvalidated) refetch();

      if (isBuyer && isAuthenticated && userId && !revealedContact) {
        AsyncStorage.getItem(`revealed_contact_${userId}_${id}`).then((cached) => {
          if (cached) {
            try { setRevealedContact(JSON.parse(cached)); } catch {}
          }
        });
      }
    }, [id, refetch, isAuthenticated, isBuyer, revealedContact])
  );
  const { data: isFavorite, isLoading: checkLoading } = useFavoriteCheckQuery(id, isBuyer);
  const addFavorite = useAddFavoriteMutation();
  const removeFavorite = useRemoveFavoriteMutation();
  const realtorId = property?.ownerIsRealtor ? property.ownerId : undefined;
  const { data: realtorProfile } = useRealtorProfileQuery(realtorId);

  const handleShare = async () => {
    if (!property) return;
    await Share.share({ message: `Check out this property: ${property.title}` });
  };

  const handleDial = (phone: string) => {
    const cleaned = phone.replace(/[\s\-().]/g, '');
    const url = Platform.OS === 'ios' ? `telprompt:${cleaned}` : `tel:${cleaned}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Call', phone, [{ text: 'OK' }]);
    });
  };

  const openRevealModal = () => {
    if (!isAuthenticated) {
      (navigation as any).navigate('Login');
      return;
    }
    if (!isBuyer) return;
    setRevealModalVisible(true);
  };

  const handleRevealConfirm = () => {
    revealContact.mutate(id, {
      onSuccess: (data) => {
        setRevealedContact(data);
        if (userId) {
          AsyncStorage.setItem(`revealed_contact_${userId}_${id}`, JSON.stringify(data));
        }
      },
      onError: () => {
        setRevealModalVisible(false);
      },
    });
  };

  const openInquiry = () => {
    (navigation as any).navigate('ContactAgent', {
      propertyId: property?.id ?? id,
      propertyTitle: property?.title,
    });
  };

  const openInMaps = () => {
    if (!property?.latitude || !property?.longitude) return;
    const label = encodeURIComponent(property.title ?? 'Property');
    const url =
      Platform.OS === 'ios'
        ? `maps:0,0?q=${label}@${property.latitude},${property.longitude}`
        : `geo:${property.latitude},${property.longitude}?q=${label}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://maps.google.com/?q=${property.latitude},${property.longitude}`);
    });
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

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const errorMessage = isError
    ? (error as any)?.response?.data?.message ?? 'Could not load this property.'
    : null;

  const imageUrls: string[] = property?.images?.length
    ? (property.images.map((img: any) => img.imageUrl).filter(Boolean) as string[])
    : property?.primaryImageUrl ? [property.primaryImageUrl] : [];

  const goToPrev = () => {
    const next = Math.max(0, activeImageIndex - 1);
    galleryRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
    setActiveImageIndex(next);
  };
  const goToNext = () => {
    const next = Math.min(imageUrls.length - 1, activeImageIndex + 1);
    galleryRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
    setActiveImageIndex(next);
  };

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

  const listingLabel =
    property.listingType === 'SALE' ? 'BUY'
    : property.listingType === 'RENT' ? 'RENT'
    : property.listingType === 'LEASE' ? 'LEASE'
    : property.listingType;
  const isRecurringPrice = property.listingType === 'RENT' || property.listingType === 'LEASE';
  const isRealtorVerified = realtorProfile?.verificationStatus === 'VERIFIED';
  const descTooLong = (property.description?.length ?? 0) > 250;
  const descText =
    descTooLong && !descExpanded
      ? property.description!.slice(0, 250) + '…'
      : property.description ?? '';

  const amenitiesByCategory = (property.amenities ?? []).reduce<Record<string, string[]>>(
    (acc, a: any) => {
      const cat = a.category ?? 'OTHER';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(a.name);
      return acc;
    },
    {}
  );

  const quickStats: { icon: string; value: string; label: string }[] = [
    {
      icon: 'bed-outline',
      value: property.bedrooms != null ? `${property.bedrooms}` : '--',
      label: 'Beds',
    },
    {
      icon: 'water-outline',
      value: property.bathrooms != null ? `${property.bathrooms}` : '--',
      label: 'Baths',
    },
    {
      icon: 'resize-outline',
      value: (property.carpetArea ?? property.builtUpArea) != null
        ? `${(property.carpetArea ?? property.builtUpArea)!.toLocaleString()}`
        : '--',
      label: 'sq.ft',
    },
    ...(property.floorNumber != null ? [{
      icon: 'business-outline',
      value: `${property.floorNumber}${property.totalFloors ? `/${property.totalFloors}` : ''}`,
      label: 'Floor',
    }] : []),
  ];

  const specItems: { icon: string; value: string; label: string; empty?: boolean }[] = [
    {
      icon: 'cube-outline',
      value: property.furnishedStatus
        ? property.furnishedStatus.replace(/_/g, ' ')
        : 'Not specified',
      label: 'Furnishing',
      empty: !property.furnishedStatus,
    },
    {
      icon: 'car-outline',
      value: (() => {
        if (property.parkingCovered == null && property.parkingOpen == null) return 'Not specified';
        const total = (property.parkingCovered ?? 0) + (property.parkingOpen ?? 0);
        return total > 0 ? `${total}` : 'None';
      })(),
      label: 'Parking',
      empty: property.parkingCovered == null && property.parkingOpen == null,
    },
    ...(property.builtUpArea != null ? [{
      icon: 'expand-outline',
      value: `${property.builtUpArea.toLocaleString()} sqft`,
      label: 'Built-up',
    }] : []),
    ...(property.carpetArea != null ? [{
      icon: 'resize-outline',
      value: `${property.carpetArea.toLocaleString()} sqft`,
      label: 'Carpet',
    }] : []),
    ...(property.balconies != null ? [{
      icon: 'sunny-outline',
      value: `${property.balconies}`,
      label: 'Balconies',
    }] : []),
    ...(property.plotArea != null ? [{
      icon: 'map-outline',
      value: `${property.plotArea.toLocaleString()} sqft`,
      label: 'Plot Area',
    }] : []),
    ...(property.facingDirection ? [{
      icon: 'compass-outline',
      value: property.facingDirection.replace(/_/g, '-'),
      label: 'Facing',
    }] : []),
    ...(property.ageOfProperty != null ? [{
      icon: 'time-outline',
      value: property.ageOfProperty === 0
        ? 'New'
        : `${property.ageOfProperty} yr${property.ageOfProperty !== 1 ? 's' : ''}`,
      label: 'Age',
    }] : []),
    ...(property.totalFloors != null ? [{
      icon: 'layers-outline',
      value: `${property.totalFloors}`,
      label: 'Total Floors',
    }] : []),
  ];

  const profileItems: { icon: string; label: string; value: string; empty?: boolean }[] = [
    {
      icon: 'document-text-outline',
      label: 'Ownership',
      value: property.ownershipType
        ? (OWNERSHIP_LABELS[property.ownershipType] ?? property.ownershipType)
        : 'Not specified',
      empty: !property.ownershipType,
    },
    {
      icon: 'key-outline',
      label: 'Possession',
      value: property.possessionStatus
        ? (POSSESSION_LABELS[property.possessionStatus] ?? property.possessionStatus)
        : 'Not specified',
      empty: !property.possessionStatus,
    },
    {
      icon: 'restaurant-outline',
      label: 'Kitchen',
      value: property.kitchenType
        ? (KITCHEN_LABELS[property.kitchenType] ?? property.kitchenType)
        : 'Not specified',
      empty: !property.kitchenType,
    },
    {
      icon: 'water-outline',
      label: 'Water Supply',
      value: property.waterSupply
        ? (WATER_LABELS[property.waterSupply] ?? property.waterSupply)
        : 'Not specified',
      empty: !property.waterSupply,
    },
    ...(property.availableFrom ? [{
      icon: 'calendar-outline',
      label: 'Available From',
      value: formatDate(property.availableFrom),
    }] : []),
    ...(property.maintenanceCharge != null ? [{
      icon: 'cash-outline',
      label: 'Maintenance',
      value: `$${property.maintenanceCharge.toLocaleString()}/mo`,
    }] : []),
    ...(property.depositAmount != null ? [{
      icon: 'wallet-outline',
      label: 'Deposit',
      value: formatPrice(Number(property.depositAmount)),
    }] : []),
  ];

  const hasPhone = !!(property.ownerPhoneMasked ?? property.ownerPhone);
  const isContacted = revealedContact !== null;
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {imageUrls.length > 0 ? (
          <View style={styles.galleryWrap}>
            <ScrollView
              ref={galleryRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                if (index !== activeImageIndex) setActiveImageIndex(index);
              }}
              style={styles.galleryScroll}
            >
              {imageUrls.map((url, idx) => (
                <Image key={idx} source={{ uri: url }} style={styles.image} />
              ))}
            </ScrollView>

            {imageUrls.length > 1 && activeImageIndex > 0 && (
              <TouchableOpacity style={styles.arrowLeft} onPress={goToPrev} activeOpacity={0.8}>
                <View style={styles.arrowBtn}>
                  <Ionicons name="chevron-back" size={22} color={colors.white} />
                </View>
              </TouchableOpacity>
            )}
            {imageUrls.length > 1 && activeImageIndex < imageUrls.length - 1 && (
              <TouchableOpacity style={styles.arrowRight} onPress={goToNext} activeOpacity={0.8}>
                <View style={styles.arrowBtn}>
                  <Ionicons name="chevron-forward" size={22} color={colors.white} />
                </View>
              </TouchableOpacity>
            )}
            <LinearGradient
              colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(26,26,46,0.45)']}
              style={styles.galleryGradient}
              pointerEvents="none"
            />
            <View style={[
              styles.listingTypeBadge,
              property.listingType === 'RENT' ? styles.rentBadge
                : property.listingType === 'LEASE' ? styles.leaseBadge
                : styles.saleBadge,
            ]}>
              <Text style={styles.listingTypeText}>{listingLabel}</Text>
            </View>
            {imageUrls.length > 1 && (
              <View style={styles.photoCount}>
                <Ionicons name="camera-outline" size={11} color={colors.white} />
                <Text style={styles.photoCountText}>{activeImageIndex + 1}/{imageUrls.length}</Text>
              </View>
            )}
            <View style={styles.imageHeaderOverlay}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.overlayBtn}>
                <Ionicons name="arrow-back" size={20} color={colors.white} />
              </TouchableOpacity>
              <View style={styles.overlayRight}>
                {isBuyer ? (
                  <TouchableOpacity
                    onPress={toggleFavorite}
                    style={[styles.overlayBtn, favoriteBlocked && { opacity: 0.45 }]}
                    disabled={favoriteBlocked}
                    accessibilityRole="button"
                    accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Ionicons
                      name={isFavorite ? 'heart' : 'heart-outline'}
                      size={20}
                      color={isFavorite ? '#FF6B6B' : colors.white}
                    />
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={handleShare} style={styles.overlayBtn}>
                  <Ionicons name="share-social-outline" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noImageWrap}>
            <Ionicons name="image-outline" size={52} color={colors.border} />
            <Text style={styles.noImageLabel}>No photos available</Text>
            <View style={[
              styles.listingTypeBadge,
              property.listingType === 'RENT' ? styles.rentBadge
                : property.listingType === 'LEASE' ? styles.leaseBadge
                : styles.saleBadge,
            ]}>
              <Text style={styles.listingTypeText}>{listingLabel}</Text>
            </View>
            <View style={styles.imageHeaderOverlay}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.overlayBtnDark}>
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.overlayRight}>
                {isBuyer ? (
                  <TouchableOpacity
                    onPress={toggleFavorite}
                    style={[styles.overlayBtnDark, favoriteBlocked && { opacity: 0.45 }]}
                    disabled={favoriteBlocked}
                    accessibilityRole="button"
                    accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Ionicons
                      name={isFavorite ? 'heart' : 'heart-outline'}
                      size={20}
                      color={isFavorite ? colors.error : colors.text}
                    />
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={handleShare} style={styles.overlayBtnDark}>
                  <Ionicons name="share-social-outline" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={styles.content}>

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>{formatPrice(property.price)}</Text>
              {isRecurringPrice && (
                <Text style={styles.priceSubtext}>
                  {property.listingType === 'LEASE' ? 'lease rate' : 'per month'}
                </Text>
              )}
            </View>
            <View style={styles.badgeStack}>
              {property.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
              {property.isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="star" size={12} color="#F39C12" />
                  <Text style={styles.premiumText}>Premium</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={styles.title}>{property.title}</Text>

          <View style={styles.locationRow}>
            <View style={styles.locationDot}>
              <Ionicons name="location" size={12} color={colors.white} />
            </View>
            <Text style={styles.locationText} numberOfLines={2}>
              {[property.addressLine1, property.locality, property.city].filter(Boolean).join(', ')}
            </Text>
          </View>

          <View style={styles.quickStats}>
            {quickStats.map((s, i) => (
              <React.Fragment key={i}>
                <View style={styles.quickStat}>
                  <Ionicons name={s.icon as any} size={14} color={colors.primary} />
                  <Text style={styles.quickStatValue}>{s.value}</Text>
                  <Text style={styles.quickStatLabel}>{s.label}</Text>
                </View>
                {i < quickStats.length - 1 && <View style={styles.quickStatDivider} />}
              </React.Fragment>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Overview</Text>
            <View style={styles.specGrid}>
              {specItems.map((item, idx) => (
                <SpecChip
                  key={idx}
                  icon={item.icon}
                  value={item.value}
                  label={item.label}
                  empty={item.empty}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Profile</Text>
            <View style={styles.profileCard}>
              {profileItems.map((item, idx) => (
                <React.Fragment key={idx}>
                  <InfoRow
                    icon={item.icon}
                    label={item.label}
                    value={item.value}
                    empty={item.empty}
                  />
                  {idx < profileItems.length - 1 && <View style={styles.infoRowDivider} />}
                </React.Fragment>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity</Text>
            <View style={styles.activityCard}>
              <ActivityStat
                icon="eye-outline"
                value={property.viewCount ?? 0}
                label="Views"
                color={colors.primary}
              />
              <View style={styles.activityDivider} />
              <ActivityStat
                icon="heart-outline"
                value={property.shortlistCount ?? 0}
                label="Shortlists"
                color={colors.error}
              />
              <View style={styles.activityDivider} />
              <ActivityStat
                icon="call-outline"
                value={property.contactCount ?? property.inquiryCount ?? 0}
                label="Contacts"
                color={colors.success}
              />
            </View>
          </View>

          {property.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <View style={styles.descCard}>
                <Text style={styles.description}>{descText}</Text>
                {descTooLong && (
                  <TouchableOpacity
                    onPress={() => setDescExpanded(!descExpanded)}
                    style={styles.showMoreBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.showMoreText}>
                      {descExpanded ? 'Show less' : 'Show more'}
                    </Text>
                    <Ionicons
                      name={descExpanded ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : null}

          {Object.keys(amenitiesByCategory).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesWrap}>
                {Object.entries(amenitiesByCategory).map(([cat, names]) => {
                  const catMeta = AMENITY_ICONS[cat] ?? { icon: 'star-outline', color: colors.primary };
                  return (
                    <View key={cat} style={styles.amenityGroup}>
                      <View style={styles.amenityCategoryHeader}>
                        <View style={[styles.amenityCatIcon, { backgroundColor: catMeta.color + '18' }]}>
                          <Ionicons name={catMeta.icon as any} size={14} color={catMeta.color} />
                        </View>
                        <Text style={[styles.amenityCategoryLabel, { color: catMeta.color }]}>
                          {cat.charAt(0) + cat.slice(1).toLowerCase()}
                        </Text>
                      </View>
                      <View style={styles.amenityChipsRow}>
                        {names.map((name) => (
                          <View key={name} style={styles.amenityChip}>
                            <Ionicons
                              name={(AMENITY_ICON_BY_NAME[name] ?? 'checkmark-circle') as any}
                              size={13}
                              color={catMeta.color}
                            />
                            <Text style={styles.amenityChipText}>{name}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationCard}>
              <View style={styles.locationCardRow}>
                <View style={styles.locationCardIcon}>
                  <Ionicons name="location" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  {!!property.addressLine1 && (
                    <Text style={styles.addressLine}>{property.addressLine1}</Text>
                  )}
                  <Text style={styles.addressLine}>
                    {[property.locality, property.city].filter(Boolean).join(', ')}
                  </Text>
                  {(property.state || property.postalCode) ? (
                    <Text style={styles.addressSub}>
                      {[property.state, property.postalCode].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                </View>
              </View>
              {property.latitude && property.longitude ? (
                <TouchableOpacity style={styles.viewMapsBtn} onPress={openInMaps} activeOpacity={0.75}>
                  <Ionicons name="navigate-outline" size={14} color={colors.primary} />
                  <Text style={styles.viewMapsBtnText}>View on Maps</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={styles.metaDates}>
            {property.publishedAt && (
              <Text style={styles.metaDate}>Posted {formatDate(property.publishedAt)}</Text>
            )}
            {property.updatedAt && (
              <Text style={styles.metaDate}>Updated {formatDate(property.updatedAt)}</Text>
            )}
          </View>

          {property.ownerName && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Listed by</Text>
              <TouchableOpacity
                activeOpacity={property.ownerIsRealtor ? 0.75 : 1}
                onPress={() => {
                  if (property.ownerIsRealtor && property.ownerId) {
                    (navigation as any).navigate('RealtorProfile', {
                      realtorId: property.ownerId,
                      propertyId: property.id,
                      propertyTitle: property.title,
                    });
                  }
                }}
              >
                <View style={styles.ownerCard}>
                  {realtorProfile?.profilePhotoUrl ? (
                    <Image source={{ uri: realtorProfile.profilePhotoUrl }} style={styles.ownerAvatarImage} />
                  ) : (
                    <View style={styles.ownerAvatar}>
                      <Ionicons name="person" size={22} color={colors.white} />
                    </View>
                  )}
                  <View style={styles.ownerInfo}>
                    <Text style={styles.ownerName}>{realtorProfile?.name ?? property.ownerName}</Text>
                    <Text style={styles.ownerRole}>
                      {property.ownerIsRealtor
                        ? isRealtorVerified ? 'Verified Realtor' : 'Real Estate Agent'
                        : 'Property Owner'}
                    </Text>
                  </View>
                  {property.ownerIsRealtor ? (
                    <View style={styles.ownerChevronWrap}>
                      <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
                    </View>
                  ) : null}
                </View>

                {property.ownerIsRealtor && realtorProfile && (
                  <View style={styles.trustGrid}>
                    <View style={[styles.trustItem, isRealtorVerified && styles.trustItemVerified]}>
                      <Ionicons
                        name={isRealtorVerified ? 'shield-checkmark' : 'shield-outline'}
                        size={15}
                        color={isRealtorVerified ? colors.success : colors.textLight}
                      />
                      <Text style={[styles.trustValue, { color: isRealtorVerified ? colors.success : colors.textSecondary }]}>
                        {isRealtorVerified ? 'Verified' : 'Unverified'}
                      </Text>
                      <Text style={styles.trustLabel}>Identity</Text>
                    </View>
                    <View style={styles.trustItem}>
                      <Ionicons
                        name="star"
                        size={15}
                        color={realtorProfile.ratingAverage ? colors.warning : colors.textLight}
                      />
                      <Text style={styles.trustValue}>
                        {realtorProfile.ratingAverage != null && realtorProfile.ratingAverage > 0
                          ? realtorProfile.ratingAverage.toFixed(1)
                          : '—'}
                      </Text>
                      <Text style={styles.trustLabel}>{`${realtorProfile.ratingCount ?? 0} reviews`}</Text>
                    </View>
                    <View style={styles.trustItem}>
                      <Ionicons name="people-outline" size={15} color={colors.primary} />
                      <Text style={styles.trustValue}>
                        {(realtorProfile.totalUserInteractions ?? 0) > 0
                          ? realtorProfile.totalUserInteractions >= 1000
                            ? `${(realtorProfile.totalUserInteractions / 1000).toFixed(1)}k`
                            : `${realtorProfile.totalUserInteractions}`
                          : '—'}
                      </Text>
                      <Text style={styles.trustLabel}>Connects</Text>
                    </View>
                  </View>
                )}

                {realtorProfile?.bio ? (
                  <Text style={styles.realtorBio} numberOfLines={2}>{realtorProfile.bio}</Text>
                ) : null}
              </TouchableOpacity>
              {property.ownerIsRealtor && (
                <Text style={styles.viewProfileHint}>Tap to view full profile →</Text>
              )}
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {isBuyer && <View style={[styles.footer, { paddingBottom: isContacted ? spacing.md : Math.max(spacing.md, insets.bottom) }]}>

        <TouchableOpacity
          style={[styles.callButton, isContacted && styles.callButtonContacted]}
          onPress={isContacted && revealedContact?.phone
            ? () => handleDial(revealedContact.phone!)
            : openRevealModal
          }
          activeOpacity={0.85}
        >
          {isContacted && revealedContact?.phone ? (
            <>
              <Ionicons name="call" size={16} color={colors.success} />
              <Text style={[styles.callButtonText, { color: colors.success }]}>Call</Text>
            </>
          ) : isContacted ? (
            <>
              <Ionicons name="person-circle-outline" size={16} color={colors.success} />
              <Text style={[styles.callButtonText, { color: colors.success }]}>View Details</Text>
            </>
          ) : hasPhone ? (
            <>
              <Ionicons name="call-outline" size={16} color={colors.primary} />
              <View style={styles.maskedPhoneWrap}>
                <Text style={styles.callButtonText} numberOfLines={1}>
                  {property.ownerPhoneMasked ?? 'Show Phone'}
                </Text>
                <Ionicons name="lock-closed" size={10} color={colors.textLight} />
              </View>
            </>
          ) : (
            <>
              <Ionicons name="person-outline" size={16} color={colors.primary} />
              <Text style={styles.callButtonText}>Show Contact</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inquiryButton}
          onPress={openInquiry}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.inquiryGradient}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color={colors.white} />
            <Text style={styles.inquiryButtonText}>Send Enquiry</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>}

      {isBuyer && isContacted && (
        <View style={[styles.contactedBanner, { paddingBottom: Math.max(6, insets.bottom) }]}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text style={styles.contactedBannerText}>You've contacted the owner</Text>
        </View>
      )}
      {isBuyer && (
        <ContactRevealModal
          visible={revealModalVisible}
          propertyTitle={property.title}
          maskedPhone={property.ownerPhoneMasked ?? property.ownerPhone}
          revealedData={revealedContact}
          isLoading={revealContact.isPending}
          onConfirm={handleRevealConfirm}
          onClose={() => setRevealModalVisible(false)}
          onDial={handleDial}
        />
      )}
    </SafeAreaView>
  );
};

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    position: 'relative',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySurface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  propertyName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  maskedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  maskedPhone: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  lockedBadge: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 18,
    paddingHorizontal: spacing.sm,
  },
  confirmBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
  },
  confirmText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  cancelBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.successSurface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  successText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.semibold,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  contactIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  doneBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  doneText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },

  galleryWrap: { position: 'relative', height: 320, overflow: 'hidden' },
  galleryScroll: { width: SCREEN_WIDTH, height: 320 },
  noImageWrap: {
    height: 240,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    position: 'relative',
  },
  noImageLabel: { fontSize: typography.fontSize.sm, color: colors.textLight, fontWeight: '500' as any },
  image: { width: SCREEN_WIDTH, height: 320, resizeMode: 'cover' },
  galleryGradient: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
  },

  imageHeaderOverlay: {
    position: 'absolute',
    top: 10,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  overlayRight: { flexDirection: 'row', gap: 8 },
  overlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayBtnDark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLeft: {
    position: 'absolute',
    left: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 5,
  },
  arrowRight: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 5,
  },
  arrowBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  photoCount: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  photoCountText: { fontSize: 10, color: colors.white, fontWeight: '600' as any },
  listingTypeBadge: {
    position: 'absolute', bottom: 44, left: spacing.sm,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  saleBadge: { backgroundColor: colors.primary },
  rentBadge: { backgroundColor: '#2980B9' },
  leaseBadge: { backgroundColor: '#7D3C98' },
  listingTypeText: {
    color: colors.white, fontSize: 10, fontWeight: typography.fontWeight.bold, letterSpacing: 0.5,
  },

  content: { padding: spacing.lg },

  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  price: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  priceSubtext: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  badgeStack: { flexDirection: 'column', gap: 4, alignItems: 'flex-end' },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.successSurface, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#C6F6D5',
  },
  verifiedText: {
    fontSize: typography.fontSize.xs, color: colors.success, fontWeight: typography.fontWeight.bold,
  },
  premiumBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FEFCE8', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#FDE68A',
  },
  premiumText: { fontSize: typography.fontSize.xs, color: '#B45309', fontWeight: typography.fontWeight.bold },

  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    lineHeight: 28,
    marginBottom: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: spacing.lg,
  },
  locationDot: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0,
  },
  locationText: { fontSize: typography.fontSize.sm, color: colors.textSecondary, flex: 1 },

  quickStats: {
    flexDirection: 'row',
    backgroundColor: colors.primarySurface,
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickStat: { flex: 1, alignItems: 'center', gap: 3 },
  quickStatValue: {
    fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.text,
  },
  quickStatLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: typography.fontWeight.medium },
  quickStatDivider: { width: 1, backgroundColor: colors.border, marginVertical: spacing.xs },

  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },

  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  specChip: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  specChipIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.primarySurface, alignItems: 'center', justifyContent: 'center',
  },
  specChipValue: {
    fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold,
    color: colors.text, textAlign: 'center',
  },
  specChipLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary, textAlign: 'center' },

  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  infoRowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoRowLabel: {
    fontSize: typography.fontSize.sm, color: colors.textSecondary, fontWeight: typography.fontWeight.medium,
  },
  infoRowValue: {
    fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.text,
    maxWidth: '50%', textAlign: 'right',
  },
  infoRowDivider: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: spacing.md },

  activityCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  activityStat: { flex: 1, alignItems: 'center', gap: 5 },
  activityIcon: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
  },
  activityValue: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.extrabold },
  activityLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary, fontWeight: typography.fontWeight.medium },
  activityDivider: { width: 1, backgroundColor: colors.borderLight, marginVertical: spacing.sm },

  descCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
  description: { fontSize: typography.fontSize.md, color: colors.textSecondary, lineHeight: 24 },
  showMoreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 4,
  },
  showMoreText: {
    fontSize: typography.fontSize.sm, color: colors.primary, fontWeight: typography.fontWeight.semibold,
  },

  amenitiesWrap: { gap: spacing.md },
  amenityGroup: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
  amenityCategoryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  amenityCatIcon: {
    width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  amenityCategoryLabel: {
    fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, letterSpacing: 0.3,
  },
  amenityChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: 10,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  amenityChipText: {
    fontSize: typography.fontSize.xs, color: colors.text, fontWeight: typography.fontWeight.medium,
  },

  locationCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: spacing.md,
    borderWidth: 1, borderColor: colors.borderLight, gap: spacing.md,
  },
  locationCardRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  locationCardIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
  },
  addressLine: {
    fontSize: typography.fontSize.sm, color: colors.text,
    fontWeight: typography.fontWeight.medium, lineHeight: 20,
  },
  addressSub: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  viewMapsBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5,
    backgroundColor: colors.primarySurface, paddingHorizontal: spacing.md, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1, borderColor: colors.border,
  },
  viewMapsBtnText: {
    fontSize: typography.fontSize.sm, color: colors.primary, fontWeight: typography.fontWeight.semibold,
  },

  metaDates: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg, paddingHorizontal: 2,
  },
  metaDate: { fontSize: typography.fontSize.xs, color: colors.textLight },

  ownerCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: 14, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  ownerAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  ownerAvatarImage: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.backgroundSecondary },
  ownerInfo: { flex: 1 },
  ownerName: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.text },
  ownerRole: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  ownerChevronWrap: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: colors.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  trustGrid: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  trustItem: {
    flex: 1, backgroundColor: colors.backgroundSecondary, borderRadius: 12,
    padding: spacing.sm, borderWidth: 1, borderColor: colors.borderLight,
    alignItems: 'center', gap: 3,
  },
  trustItemVerified: { backgroundColor: colors.successSurface, borderColor: '#C6F6D5' },
  trustValue: { fontSize: typography.fontSize.sm, color: colors.text, fontWeight: typography.fontWeight.bold },
  trustLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  realtorBio: {
    marginTop: spacing.sm, fontSize: typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20,
  },
  viewProfileHint: {
    marginTop: spacing.xs, fontSize: typography.fontSize.xs, color: colors.primary, textAlign: 'right',
  },

  bottomSpacer: { height: 20 },

  footer: {
    flexDirection: 'row', padding: spacing.md, gap: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 6,
  },
  callButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingHorizontal: spacing.md, height: 52, borderRadius: 14,
    borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primarySurface,
    maxWidth: 160,
  },
  callButtonContacted: {
    borderColor: colors.success,
    backgroundColor: colors.successSurface,
  },
  maskedPhoneWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1,
  },
  callButtonText: {
    color: colors.primary, fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold, flexShrink: 1,
  },
  inquiryButton: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  inquiryGradient: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, height: 52,
  },
  inquiryButtonText: { color: colors.white, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },

  contactedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.successSurface,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#C6F6D5',
  },
  contactedBannerText: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default PropertyDetailScreen;
