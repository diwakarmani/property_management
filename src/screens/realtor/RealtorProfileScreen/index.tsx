import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { colors, typography, spacing } from '@/theme';
import { useRealtorProfileQuery, useConnectRealtorMutation } from '@/api/hooks/useStats';
import { useMyRatingQuery, useRatingsInfiniteQuery } from '@/api/hooks/useRatings';
import type { RatingDTO } from '@/api/types/rating.types';
import type { RootState } from '@/store';
import { isBuyerExperience } from '@/utils/rbac/permissions';

const StarRating = ({ rating, count }: { rating: number | null | undefined; count: number | undefined }) => {
  const hasRating = rating != null && rating > 0;
  if (!hasRating) return null;

  const filled = Math.floor(rating);
  const hasHalf = rating - filled >= 0.5;

  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= filled ? 'star' : hasHalf && i === filled + 1 ? 'star-half' : 'star-outline'}
          size={15}
          color={colors.warning}
        />
      ))}
      <Text style={starStyles.value}>{rating.toFixed(1)}</Text>
      {count ? <Text style={starStyles.count}>({count})</Text> : null}
    </View>
  );
};

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  value: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.text, marginLeft: 3 },
  count: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
});

const STAR_COLORS = ['', '#E74C3C', '#E67E22', '#F1C40F', '#27AE60', '#6C5CE7'];

const ReviewCard = ({ review }: { review: RatingDTO }) => {
  const initial = review.raterName?.charAt(0)?.toUpperCase() ?? '?';
  const starColor = STAR_COLORS[review.rating] ?? colors.warning;
  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <View style={reviewStyles.card}>
      <View style={reviewStyles.row}>
        {review.raterPhotoUrl ? (
          <Image source={{ uri: review.raterPhotoUrl }} style={reviewStyles.avatar} />
        ) : (
          <View style={reviewStyles.avatarFallback}>
            <Text style={reviewStyles.avatarInitial}>{initial}</Text>
          </View>
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={reviewStyles.name}>{review.raterName}</Text>
          <View style={reviewStyles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Ionicons
                key={i}
                name={i <= review.rating ? 'star' : 'star-outline'}
                size={13}
                color={i <= review.rating ? starColor : colors.border}
              />
            ))}
            <Text style={[reviewStyles.starValue, { color: starColor }]}>{review.rating}.0</Text>
          </View>
        </View>
        <Text style={reviewStyles.date}>{date}</Text>
      </View>
      {!!review.comment && (
        <Text style={reviewStyles.comment}>{review.comment}</Text>
      )}
    </View>
  );
};

const reviewStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: spacing.sm,
  },
  row:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  name: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.text },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  starValue: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, marginLeft: 3 },
  date: { fontSize: typography.fontSize.xs, color: colors.textLight },
  comment: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: spacing.sm,
  },
});

const MetricTile = ({ icon, value, label }: { icon: string; value: string | number; label: string }) => (
  <View style={metricStyles.tile}>
    <View style={metricStyles.iconWrap}>
      <Ionicons name={icon as any} size={18} color={colors.primary} />
    </View>
    <Text style={metricStyles.value}>{value}</Text>
    <Text style={metricStyles.label}>{label}</Text>
  </View>
);

const metricStyles = StyleSheet.create({
  tile: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, gap: 3 },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.text },
  label: { fontSize: typography.fontSize.xs, color: colors.textSecondary, textAlign: 'center' },
});

const RealtorProfileScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { realtorId, propertyId, propertyTitle } = route.params as {
    realtorId: number;
    propertyId?: number;
    propertyTitle?: string;
  };
  const user            = useSelector((state: RootState) => state.auth.user);
  const activeRole      = useSelector((state: RootState) => state.auth.activeRole);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const isBuyer         = isAuthenticated && isBuyerExperience(user?.roles, activeRole);

  const insets = useSafeAreaInsets();
  const { data: profile, isLoading, isError, error, refetch } = useRealtorProfileQuery(realtorId);
  const connectRealtor  = useConnectRealtorMutation(realtorId);
  const { data: myRating, isError: myRatingError } = useMyRatingQuery(
    isBuyer && realtorId && propertyId ? realtorId : null,
    isBuyer && realtorId && propertyId ? propertyId : null,
  );
  const {
    data: reviewsData,
    fetchNextPage: fetchMoreReviews,
    hasNextPage: hasMoreReviews,
    isFetchingNextPage: loadingMoreReviews,
  } = useRatingsInfiniteQuery(realtorId);
  const reviews = reviewsData?.items ?? [];

  const handleConnect = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login required', 'Please log in to connect with this realtor.');
      return;
    }
    if (propertyId) {
      connectRealtor.mutate({ propertyId });
      (navigation as any).navigate('ContactAgent', { propertyId, propertyTitle });
      return;
    }
    try {
      const result = await connectRealtor.mutateAsync({});
      const count = result.data.data?.totalUserInteractions;
      Alert.alert(
        'Interest Recorded',
        count != null
          ? `Your interest has been noted. ${count} user${count === 1 ? '' : 's'} have connected with this realtor.`
          : 'Your interest has been noted with this realtor.',
      );
    } catch (err) {
      const message = (err as any)?.response?.data?.message ?? 'Could not connect. Please try again.';
      Alert.alert('Connection failed', message);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centerText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !profile) {
    const msg = isError
      ? (error as any)?.response?.data?.message ?? 'Could not load realtor profile.'
      : 'Realtor not found.';
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.centerText}>{msg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isVerified = profile.verificationStatus === 'VERIFIED';
  const hasRating = profile.ratingAverage != null && profile.ratingAverage > 0;

  return (
    <View style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        <LinearGradient
          colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >

          <View style={[styles.heroNav, { top: insets.top + 10 }]}>
            <TouchableOpacity style={styles.overlayBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroBody}>
            {profile.profilePhotoUrl ? (
              <Image source={{ uri: profile.profilePhotoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>
                  {profile.name?.charAt(0)?.toUpperCase() ?? '?'}
                </Text>
              </View>
            )}

            <Text style={styles.heroName}>{profile.name}</Text>
            <Text style={styles.heroRole}>Real Estate Agent</Text>

            <View style={styles.heroBadges}>
              {isVerified && (
                <View style={styles.verifiedPill}>
                  <Ionicons name="shield-checkmark" size={12} color={colors.success} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
              {!hasRating && (
                <View style={styles.newPill}>
                  <Ionicons name="sparkles-outline" size={12} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.newPillText}>New Realtor</Text>
                </View>
              )}
              {hasRating && <StarRating rating={profile.ratingAverage} count={profile.ratingCount} />}
            </View>
          </View>
        </LinearGradient>

        <View style={styles.metricsCard}>
          <MetricTile icon="home-outline" value={profile.activeListingsCount ?? 0} label="Active Listings" />
          <View style={styles.divider} />
          <MetricTile icon="people-outline" value={profile.totalUserInteractions ?? 0} label="Connects" />
          <View style={styles.divider} />
          <MetricTile
            icon={hasRating ? 'star' : 'star-outline'}
            value={hasRating ? (profile.ratingAverage as number).toFixed(1) : '–'}
            label={hasRating ? `${profile.ratingCount ?? 0} Reviews` : 'No Reviews'}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Trust & Verification</Text>
          <View style={[styles.card, isVerified ? styles.cardVerified : styles.cardPending]}>
            <Ionicons
              name={isVerified ? 'shield-checkmark' : 'shield-outline'}
              size={22}
              color={isVerified ? colors.success : colors.textLight}
            />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[styles.cardTitle, { color: isVerified ? colors.success : colors.textSecondary }]}>
                {isVerified ? 'Identity Verified' : 'Not Yet Verified'}
              </Text>
              <Text style={styles.cardSub}>
                {isVerified
                  ? 'Email or mobile number confirmed on this account.'
                  : 'Document verification — Phase 2.'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Rating</Text>
          <View style={styles.ratingCard}>
            {hasRating ? (
              <View style={styles.ratingRow}>
                <Text style={styles.bigRating}>{(profile.ratingAverage as number).toFixed(1)}</Text>
                <View style={{ flex: 1, gap: 6 }}>
                  <StarRating rating={profile.ratingAverage} count={profile.ratingCount} />
                  <Text style={styles.cardSub}>Based on {profile.ratingCount} review{profile.ratingCount === 1 ? '' : 's'}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.noRatingRow}>
                <View style={styles.noRatingIcon}>
                  <Ionicons name="star-outline" size={24} color={colors.textLight} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.cardTitle}>No reviews yet</Text>
                  <Text style={styles.cardSub}>Reviews appear here once clients rate this realtor.</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {profile.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>About</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionLabel}>
              Reviews{reviewsData?.totalElements ? ` (${reviewsData.totalElements})` : ''}
            </Text>

            {isBuyer && !!propertyId && (
              <TouchableOpacity
                style={styles.rateBtn}
                onPress={() =>
                  navigation.navigate('RateRealtor', {
                    realtorId,
                    realtorName: profile.name,
                    propertyId,
                  })
                }
                activeOpacity={0.8}
              >
                <Ionicons name={myRating ? 'star' : 'star-outline'} size={13} color={colors.primary} />
                <Text style={styles.rateBtnText}>
                  {myRating ? 'Edit Review' : 'Rate'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {reviews.length === 0 ? (
            <View style={styles.noReviewsBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={32} color={colors.textLight} />
              <Text style={styles.noReviewsText}>No reviews yet</Text>
              <Text style={styles.noReviewsSub}>Reviews from buyers appear here.</Text>
            </View>
          ) : (
            <>
              {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
              {hasMoreReviews && (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={() => fetchMoreReviews()}
                  disabled={loadingMoreReviews}
                  activeOpacity={0.7}
                >
                  {loadingMoreReviews
                    ? <ActivityIndicator size="small" color={colors.primary} />
                    : <Text style={styles.loadMoreText}>Load more reviews</Text>}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <TouchableOpacity
          style={[styles.connectBtn, connectRealtor.isPending && { opacity: 0.7 }]}
          disabled={connectRealtor.isPending}
          onPress={handleConnect}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.connectGradient}
          >
            {connectRealtor.isPending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons
                name={propertyId ? 'chatbubble-ellipses' : 'person-add-outline'}
                size={18}
                color={colors.white}
              />
            )}
            <Text style={styles.connectText}>
              {connectRealtor.isPending ? 'Connecting...' : propertyId ? 'Send Enquiry' : 'Connect with Realtor'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({

  safeArea: { flex: 1, backgroundColor: colors.background },

  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.background },
  centerText: { fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, backgroundColor: colors.primarySurface, borderRadius: 12 },
  retryText: { fontSize: typography.fontSize.sm, color: colors.primary, fontWeight: typography.fontWeight.semibold },

  scroll: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 0 },

  hero: {
    height: 280,
    position: 'relative',
  },

  heroNav: {
    position: 'absolute',
    top: 10,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  overlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 56,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: 6,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  avatarFallback: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  heroName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
  },
  heroRole: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
  },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successSurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 12,
  },
  verifiedText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.success },
  newPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 12,
  },
  newPillText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: 'rgba(255,255,255,0.9)' },

  metricsCard: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: -20,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 5,
  },
  divider: { width: 1, backgroundColor: colors.borderLight, marginVertical: spacing.sm },

  section: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
  },
  cardVerified: { backgroundColor: colors.successSurface },
  cardPending: { backgroundColor: colors.backgroundSecondary },
  cardTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.text },
  cardSub: { fontSize: typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 },

  ratingCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bigRating: { fontSize: 44, fontWeight: typography.fontWeight.bold, color: colors.text, lineHeight: 52 },
  noRatingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  noRatingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bioText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 14,
  },

  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rateBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  noReviewsBox: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noReviewsText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  noReviewsSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.primarySurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  loadMoreText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },

  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 6,
  },
  connectBtn: { borderRadius: 14, overflow: 'hidden' },
  connectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  connectText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default RealtorProfileScreen;
