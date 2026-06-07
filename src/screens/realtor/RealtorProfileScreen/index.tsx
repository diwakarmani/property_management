import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { colors, typography, spacing } from '@/theme';
import { useRealtorProfileQuery, useConnectRealtorMutation } from '@/api/hooks/useStats';
import type { RootState } from '@/store';

// ── Star rating display ───────────────────────────────────────────────────────

const StarRating = ({ rating, count }: { rating: number | null | undefined; count: number | undefined }) => {
  const hasRating = rating != null && rating > 0;

  if (!hasRating) {
    return (
      <View style={starStyles.newTag}>
        <Ionicons name="sparkles-outline" size={12} color={colors.primary} />
        <Text style={starStyles.newTagText}>New Realtor</Text>
      </View>
    );
  }

  const filled = Math.floor(rating);
  const hasHalf = rating - filled >= 0.5;

  return (
    <View style={starStyles.row}>
      <View style={starStyles.stars}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Ionicons
            key={i}
            name={i <= filled ? 'star' : hasHalf && i === filled + 1 ? 'star-half' : 'star-outline'}
            size={16}
            color={colors.warning}
          />
        ))}
      </View>
      <Text style={starStyles.ratingValue}>{rating.toFixed(1)}</Text>
      {count ? <Text style={starStyles.ratingCount}>({count} reviews)</Text> : null}
    </View>
  );
};

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stars: { flexDirection: 'row', gap: 2 },
  ratingValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  ratingCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  newTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  newTagText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
});

// ── Trust metric card ─────────────────────────────────────────────────────────

const MetricCard = ({ icon, value, label }: { icon: string; value: string | number; label: string }) => (
  <View style={metricStyles.card}>
    <View style={metricStyles.iconWrap}>
      <Ionicons name={icon as any} size={20} color={colors.primary} />
    </View>
    <Text style={metricStyles.value}>{value}</Text>
    <Text style={metricStyles.label}>{label}</Text>
  </View>
);

const metricStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    padding: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  value: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────

const RealtorProfileScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { realtorId, propertyId, propertyTitle } = route.params as {
    realtorId: number;
    propertyId?: number;
    propertyTitle?: string;
  };
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const { data: profile, isLoading, isError, error, refetch } = useRealtorProfileQuery(realtorId);
  const connectRealtor = useConnectRealtorMutation(realtorId);

  const handleConnect = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login required', 'Please log in to connect with this realtor.');
      return;
    }
    if (propertyId) {
      // Navigate directly to inquiry form when we have a property context
      connectRealtor.mutate({});  // fire-and-forget to record interaction
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
      <SafeAreaView style={styles.safeArea}>
        <HeaderBar onBack={() => navigation.goBack()} />
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !profile) {
    const msg = isError
      ? (error as any)?.response?.data?.message ?? 'Could not load realtor profile.'
      : 'Realtor not found.';
    return (
      <SafeAreaView style={styles.safeArea}>
        <HeaderBar onBack={() => navigation.goBack()} />
        <View style={styles.loadingCenter}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>{msg}</Text>
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
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar onBack={() => navigation.goBack()} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Hero */}
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
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
          <Text style={styles.heroSubtitle}>Real Estate Agent</Text>

          <View style={styles.heroBadgeRow}>
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={13} color={colors.success} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
            {!hasRating && (
              <View style={styles.newBadge}>
                <Ionicons name="sparkles-outline" size={13} color={colors.primaryLight} />
                <Text style={styles.newBadgeText}>New Realtor</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Trust metrics row */}
        <View style={styles.metricsCard}>
          <MetricCard
            icon="home-outline"
            value={profile.activeListingsCount ?? 0}
            label="Active Listings"
          />
          <View style={styles.metricDivider} />
          <MetricCard
            icon="people-outline"
            value={profile.totalUserInteractions ?? 0}
            label="Connects"
          />
          <View style={styles.metricDivider} />
          <MetricCard
            icon={hasRating ? 'star' : 'star-outline'}
            value={hasRating ? (profile.ratingAverage as number).toFixed(1) : '–'}
            label={hasRating ? `${profile.ratingCount ?? 0} Reviews` : 'No Reviews'}
          />
        </View>

        {/* Rating section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rating</Text>
          <View style={styles.ratingCard}>
            {hasRating ? (
              <View style={styles.ratingRow}>
                <Text style={styles.bigRating}>{(profile.ratingAverage as number).toFixed(1)}</Text>
                <View style={styles.ratingRight}>
                  <StarRating rating={profile.ratingAverage} count={profile.ratingCount} />
                  <Text style={styles.ratingNote}>
                    Based on {profile.ratingCount} review{profile.ratingCount === 1 ? '' : 's'}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.noRatingRow}>
                <View style={styles.noRatingIconWrap}>
                  <Ionicons name="star-outline" size={28} color={colors.textLight} />
                </View>
                <View style={styles.noRatingText}>
                  <Text style={styles.noRatingTitle}>No reviews yet</Text>
                  <Text style={styles.noRatingSubtitle}>
                    This realtor hasn't received any reviews yet.{'\n'}Reviews will appear here once clients rate them.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Verification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trust & Verification</Text>
          <View style={[styles.verificationCard, isVerified ? styles.verificationCardVerified : styles.verificationCardPending]}>
            <Ionicons
              name={isVerified ? 'shield-checkmark' : 'shield-outline'}
              size={24}
              color={isVerified ? colors.success : colors.textLight}
            />
            <View style={styles.verificationText}>
              <Text style={[styles.verificationTitle, isVerified ? styles.verifiedColor : styles.unverifiedColor]}>
                {isVerified ? 'Identity Verified' : 'Not Yet Verified'}
              </Text>
              <Text style={styles.verificationSub}>
                {isVerified
                  ? 'Email or mobile number confirmed on this account.'
                  : 'Document verification coming soon — Phase 2.'}
              </Text>
            </View>
          </View>
        </View>

        {/* About */}
        {profile.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        ) : null}

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.contactCard}>
            {profile.email ? (
              <View style={styles.contactRow}>
                <View style={styles.contactIcon}>
                  <Ionicons name="mail-outline" size={16} color={colors.primary} />
                </View>
                <Text style={styles.contactText}>{profile.email}</Text>
              </View>
            ) : null}
            {profile.phone ? (
              <View style={[styles.contactRow, { borderBottomWidth: 0 }]}>
                <View style={styles.contactIcon}>
                  <Ionicons name="call-outline" size={16} color={colors.primary} />
                </View>
                <Text style={styles.contactText}>{profile.phone}</Text>
              </View>
            ) : null}
            {!profile.email && !profile.phone && (
              <Text style={styles.noContactText}>No contact details available</Text>
            )}
          </View>
        </View>

        {/* Areas served */}
        {profile.areasServed && profile.areasServed.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Areas Served</Text>
            <View style={styles.tagRow}>
              {profile.areasServed.map((area, i) => (
                <View key={i} style={styles.tag}>
                  <Ionicons name="location-outline" size={12} color={colors.primary} />
                  <Text style={styles.tagText}>{area}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.connectBtn, connectRealtor.isPending && styles.connectBtnDisabled]}
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
              {connectRealtor.isPending
                ? 'Connecting...'
                : propertyId
                  ? 'Send Enquiry'
                  : 'Connect with Realtor'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ── Shared header component ───────────────────────────────────────────────────

const HeaderBar = ({ onBack }: { onBack: () => void }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
      <Ionicons name="arrow-back" size={20} color={colors.text} />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>Realtor Profile</Text>
    <View style={{ width: 36 }} />
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  container: { flex: 1 },
  scrollContent: { paddingBottom: 0 },

  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  loadingText: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  errorText: { fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primarySurface,
    borderRadius: 12,
  },
  retryText: { fontSize: typography.fontSize.sm, color: colors.primary, fontWeight: typography.fontWeight.semibold },

  // Hero
  heroCard: {
    margin: spacing.md,
    borderRadius: 20,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: spacing.sm,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: spacing.sm,
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  heroName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: spacing.sm,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successSurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success,
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: 'rgba(255,255,255,0.9)',
  },

  // Metrics
  metricsCard: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  metricDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
  },

  // Sections
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Rating
  ratingCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bigRating: {
    fontSize: 48,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    lineHeight: 56,
  },
  ratingRight: { flex: 1, gap: spacing.xs },
  ratingNote: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  noRatingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  noRatingIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noRatingText: { flex: 1, gap: 4 },
  noRatingTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  noRatingSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // Verification
  verificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
  },
  verificationCardVerified: { backgroundColor: colors.successSurface },
  verificationCardPending: { backgroundColor: colors.backgroundSecondary },
  verificationText: { flex: 1, gap: 4 },
  verificationTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  verifiedColor: { color: colors.success },
  unverifiedColor: { color: colors.textSecondary },
  verificationSub: { fontSize: typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 },

  // Bio
  bioText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
  },

  // Contact
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  contactIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: { fontSize: typography.fontSize.sm, color: colors.text },
  noContactText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    padding: spacing.md,
    textAlign: 'center',
  },

  // Tags
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 10,
  },
  tagText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },

  bottomSpacer: { height: 96 },

  // Footer
  footer: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  connectBtn: { borderRadius: 14, overflow: 'hidden' },
  connectBtnDisabled: { opacity: 0.7 },
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
