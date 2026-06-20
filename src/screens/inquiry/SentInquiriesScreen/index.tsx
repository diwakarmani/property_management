import React from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import type { InquiryDTO } from '@/api/types/inquiry.types';
import { useSentInquiriesInfiniteQuery } from '@/api/hooks/useInquiries';
import AsyncBoundary from '@/components/common/AsyncBoundary';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  NEW:       { color: colors.warning,       bg: colors.warningSurface,       icon: 'time-outline',               label: 'Pending'   },
  CONTACTED: { color: colors.info,          bg: colors.infoSurface,          icon: 'chatbubble-ellipses-outline', label: 'Contacted' },
  CLOSED:    { color: colors.textSecondary, bg: colors.backgroundSecondary,  icon: 'checkmark-done-outline',      label: 'Closed'    },
};

const formatDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const InquiryCard = ({
  item,
  onPressProperty,
  onPressRate,
}: {
  item: InquiryDTO;
  onPressProperty: () => void;
  onPressRate: () => void;
}) => {
  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.NEW;

  const canRate = (item.status === 'CONTACTED' || item.status === 'CLOSED') && !!item.realtorId;

  return (
    <View style={[styles.card, item.status === 'NEW' && styles.cardPending]}>

      <TouchableOpacity style={styles.propertyRow} onPress={onPressProperty} activeOpacity={0.8}>
        <View style={styles.propertyIconWrap}>
          <Ionicons name="home-outline" size={16} color={colors.primary} />
        </View>
        <Text style={styles.propertyTitle} numberOfLines={1}>{item.propertyTitle}</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        <View style={styles.dateRow}>
          <Ionicons name="time-outline" size={11} color={colors.textLight} />
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>

      <Text style={styles.message} numberOfLines={2}>{item.message}</Text>

      {canRate && (
        <TouchableOpacity style={styles.rateBtn} onPress={onPressRate} activeOpacity={0.8}>
          <Ionicons name="star-outline" size={14} color={colors.primary} />
          <Text style={styles.rateBtnText}>
            {item.realtorName ? `Rate ${item.realtorName}` : 'Rate this Realtor'}
          </Text>
          <Ionicons name="chevron-forward" size={13} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const SentInquiriesScreen = () => {
  const navigation = useNavigation<any>();
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSentInquiriesInfiniteQuery();
  const inquiries = data?.items ?? [];

  const errorMessage = isError
    ? (error as any)?.response?.data?.message ?? 'Could not load your inquiries.'
    : null;

  return (
    <AsyncBoundary
      loading={isLoading}
      error={errorMessage}
      empty={!isLoading && !errorMessage && inquiries.length === 0}
      emptyText="You haven't sent any inquiries yet. Tap 'Contact Agent' on a listing to get started."
      emptyIcon="chatbubbles-outline"
      onRetry={() => refetch()}
    >
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={inquiries}
        keyExtractor={(item) => String(item.id)}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetchingNextPage
            ? <ActivityIndicator style={styles.footer} color={colors.primary} />
            : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => refetch()}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.title}>My Inquiries</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{inquiries.length}</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <InquiryCard
            item={item}
            onPressProperty={() =>
              navigation.navigate('PropertyDetail', { id: item.propertyId })
            }
            onPressRate={() =>
              navigation.navigate('RateRealtor', {
                realtorId: item.realtorId,
                realtorName: item.realtorName,
                propertyId: item.propertyId,
              })
            }
          />
        )}
      />
    </AsyncBoundary>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content:   { padding: spacing.md, paddingBottom: spacing.xl },
  footer:    { paddingVertical: spacing.md },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.text,
  },
  countBadge: {
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    gap: spacing.sm,
  },
  cardPending: { borderColor: colors.warning, borderWidth: 1.5 },

  propertyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  propertyIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
  },
  propertyTitle: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },

  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: 10, alignSelf: 'flex-start',
  },
  statusText: { fontSize: 11, fontWeight: typography.fontWeight.bold },

  dateRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  date:     { fontSize: typography.fontSize.xs, color: colors.textLight },

  message: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: spacing.sm,
  },

  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySurface,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  rateBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
});

export default SentInquiriesScreen;
