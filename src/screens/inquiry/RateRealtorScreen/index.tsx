import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '@/theme';
import { useMyRatingQuery, useSubmitRatingMutation } from '@/api/hooks/useRatings';

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
const STAR_COLORS = ['', '#E74C3C', '#E67E22', '#F1C40F', '#27AE60', '#6C5CE7'];

const StarPicker = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => {
  const scales = useRef([1, 2, 3, 4, 5].map(() => new Animated.Value(1))).current;

  const press = (star: number) => {
    onChange(star);
    Animated.sequence([
      Animated.spring(scales[star - 1], { toValue: 1.35, useNativeDriver: true }),
      Animated.spring(scales[star - 1], { toValue: 1,    useNativeDriver: true }),
    ]).start();
  };

  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => press(n)} activeOpacity={0.7}>
          <Animated.View style={{ transform: [{ scale: scales[n - 1] }] }}>
            <Ionicons
              name={n <= value ? 'star' : 'star-outline'}
              size={44}
              color={value >= n ? STAR_COLORS[value] : colors.border}
            />
          </Animated.View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md },
});

const RateRealtorScreen = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute();
  const insets     = useSafeAreaInsets();

  const { realtorId, realtorName, propertyId } = (route.params as {
    realtorId: number;
    realtorName?: string;
    propertyId: number;
  }) ?? {};

  const { data: existingRating, isLoading: loadingExisting, isError, error } =
    useMyRatingQuery(realtorId, propertyId);
  const notEligible   = isError && (error as any)?.response?.status === 422;
  const submitMutation = useSubmitRatingMutation(realtorId);

  const [stars,     setStars]     = useState(0);
  const [comment,   setComment]   = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (existingRating) {
      setStars(existingRating.rating);
      setComment(existingRating.comment ?? '');
    }
  }, [existingRating]);

  const isEditing = existingRating != null;
  const charLeft  = 500 - comment.length;
  const canSubmit = stars >= 1 && !submitMutation.isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await submitMutation.mutateAsync({ propertyId, rating: stars, comment: comment.trim() || undefined });
      setSubmitted(true);
    } catch {
      // axiosClient interceptor shows toast
    }
  };

  // ── Bottom padding shared by footer and center screens ──────────────────────
  const bottomPad = Math.max(insets.bottom, spacing.md);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loadingExisting) {
    return (
      <View style={styles.screen}>
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  // ── Not eligible ─────────────────────────────────────────────────────────────
  if (notEligible) {
    return (
      <View style={styles.screen}>
        <View style={styles.inlineHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rate Realtor</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.centerFill, { paddingBottom: bottomPad }]}>
          <View style={styles.eligIcon}>
            <Ionicons name="time-outline" size={38} color={colors.textLight} />
          </View>
          <Text style={styles.eligTitle}>Not Yet Eligible</Text>
          <Text style={styles.eligSub}>
            Send an inquiry for this property and wait briefly before leaving a review.
          </Text>
        </View>
      </View>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <View style={styles.screen}>
        <View style={[styles.centerFill, { paddingBottom: bottomPad }]}>
          <View style={styles.successRing}>
            <Ionicons name="checkmark-circle" size={60} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>
            {isEditing ? 'Review Updated!' : 'Review Submitted!'}
          </Text>
          <Text style={styles.successSub}>
            Thank you for helping others choose the right realtor.
          </Text>
          <TouchableOpacity style={styles.solidBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.solidBtnGrad}
            >
              <Text style={styles.solidBtnText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.inlineHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Review' : 'Rate Realtor'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Realtor hero card */}
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroAvatar}>
              <Ionicons name="person" size={32} color={colors.white} />
            </View>
            <Text style={styles.heroName}>{realtorName ?? 'Realtor'}</Text>
            <Text style={styles.heroRole}>Real Estate Agent</Text>
          </LinearGradient>

          {/* Star picker card */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Your Rating</Text>
            <StarPicker value={stars} onChange={setStars} />
            {stars > 0 ? (
              <Text style={[styles.starLabel, { color: STAR_COLORS[stars] }]}>
                {STAR_LABELS[stars]}
              </Text>
            ) : (
              <Text style={styles.starHint}>Tap a star to rate</Text>
            )}
          </View>

          {/* Comment card */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Your Review</Text>
              <Text style={styles.optional}>optional</Text>
            </View>
            <TextInput
              style={[styles.commentInput, comment.length > 0 && styles.commentActive]}
              placeholder="Share your experience with this realtor…"
              placeholderTextColor={colors.textLight}
              multiline
              maxLength={500}
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
            />
            <Text style={[styles.charCount, charLeft < 50 && styles.charCountWarn]}>
              {charLeft} characters remaining
            </Text>
          </View>

          {/* Tip banner */}
          <View style={styles.tipBanner}>
            <Ionicons name="information-circle-outline" size={15} color={colors.primary} />
            <Text style={styles.tipText}>
              Honest reviews help buyers find trusted realtors. Be fair and respectful.
            </Text>
          </View>
        </ScrollView>

        {/* Submit footer — no gap: paddingBottom absorbs home indicator */}
        <View style={[styles.footer, { paddingBottom: bottomPad }]}>
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnOff]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={canSubmit ? [colors.primary, colors.primaryDark] : [colors.border, colors.border]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.submitGrad}
            >
              {submitMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="star" size={18} color={canSubmit ? colors.white : colors.textLight} />
              )}
              <Text style={[styles.submitText, !canSubmit && styles.submitTextOff]}>
                {submitMutation.isPending
                  ? 'Submitting…'
                  : isEditing
                  ? 'Update Review'
                  : 'Submit Review'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Root — plain View, no SafeAreaView (AppLayout's SafeAreaView already handles top)
  screen: { flex: 1, backgroundColor: colors.background },

  // Centered states (loading / not eligible / success)
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },

  // Shared inline header used in not-eligible and main form
  inlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  headerSpacer: { width: 36 },

  // Not eligible
  eligIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  eligTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  eligSub: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Success
  successRing: { marginBottom: spacing.sm },
  successTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  successSub: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  solidBtn: { width: '100%', borderRadius: 14, overflow: 'hidden', marginTop: spacing.sm },
  solidBtnGrad: { paddingVertical: spacing.md, alignItems: 'center' },
  solidBtnText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },

  // Scroll area
  scroll:        { flex: 1 },
  scrollContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg },

  // Realtor hero
  hero: {
    borderRadius: 16,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  heroAvatar: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
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
  },

  // Cards
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    gap: spacing.md,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  optional: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },

  // Stars
  starLabel: {
    textAlign: 'center',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  starHint: {
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },

  // Comment
  commentInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    minHeight: 110,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    backgroundColor: colors.background,
    lineHeight: 22,
  },
  commentActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  charCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: -spacing.sm,
  },
  charCountWarn: { color: colors.warning },

  // Tip banner
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primarySurface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    lineHeight: 18,
  },

  // Footer — paddingBottom is set inline via insets so button sits flush to home indicator
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
  submitBtn:    { borderRadius: 14, overflow: 'hidden' },
  submitBtnOff: { opacity: 0.55 },
  submitGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  submitText:    {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  submitTextOff: { color: colors.textSecondary },
});

export default RateRealtorScreen;
