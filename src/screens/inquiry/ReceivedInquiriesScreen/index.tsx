import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import type { InquiryDTO } from '@/api/types/inquiry.types';
import {
  useReceivedInquiriesQuery,
  useUpdateInquiryStatusMutation,
} from '@/api/hooks/useInquiries';
import AsyncBoundary from '@/components/common/AsyncBoundary';
import { toast } from '@/utils/toast';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  NEW: { color: colors.warning, bg: colors.warningSurface, icon: 'mail-unread-outline' },
  CONTACTED: { color: colors.info, bg: colors.infoSurface, icon: 'chatbubble-ellipses-outline' },
  CLOSED: { color: colors.textSecondary, bg: colors.backgroundSecondary, icon: 'checkmark-done-outline' },
};

const NEXT_STATUS: Record<string, string> = {
  NEW: 'CONTACTED',
  CONTACTED: 'CLOSED',
  CLOSED: 'NEW',
};

const formatDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const ReceivedInquiriesScreen = () => {
  const { data: inquiries = [], isLoading, isError, error, refetch, isFetching } =
    useReceivedInquiriesQuery(0, 50);
  const updateStatus = useUpdateInquiryStatusMutation();

  const cycleStatus = (inquiry: InquiryDTO) => {
    const next = NEXT_STATUS[inquiry.status] ?? 'NEW';
    updateStatus.mutate(
      { id: inquiry.id, status: next },
      {
        onError: (err: any) =>
          toast.error(err?.response?.data?.message || 'Could not update status'),
      }
    );
  };

  const renderItem = ({ item }: { item: InquiryDTO }) => {
    const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.NEW;
    return (
      <View style={[styles.card, item.status === 'NEW' && styles.cardUnread]}>
        <View style={styles.cardHeader}>
          <View style={styles.propertyBadge}>
            <Ionicons name="home-outline" size={14} color={colors.primary} />
            <Text style={styles.propertyTitle} numberOfLines={1}>
              {item.propertyTitle}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}
            onPress={() => cycleStatus(item)}
            accessibilityRole="button"
            accessibilityLabel={`Inquiry status ${item.status}, tap to advance`}
            disabled={updateStatus.isPending}
          >
            <Ionicons name={statusCfg.icon as any} size={12} color={statusCfg.color} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>
              {item.status}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inquirerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(item.name?.[0] ?? '?').toUpperCase()}</Text>
          </View>
          <View style={styles.inquirerInfo}>
            <Text style={styles.inquirerName}>{item.name}</Text>
            <Text style={styles.inquirerContact}>{item.email}{item.phone ? ` · ${item.phone}` : ''}</Text>
          </View>
        </View>

        <Text style={styles.message}>{item.message}</Text>

        <View style={styles.cardFooter}>
          <Ionicons name="time-outline" size={12} color={colors.textLight} />
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  const errorMessage = isError ? (error as any)?.response?.data?.message ?? 'Could not load inquiries.' : null;

  return (
    <AsyncBoundary
      loading={isLoading}
      error={errorMessage}
      empty={!isLoading && !errorMessage && inquiries.length === 0}
      emptyText="No inquiries yet. They'll appear here when buyers contact you."
      emptyIcon="chatbubbles-outline"
      onRetry={() => refetch()}
    >
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={inquiries}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.title}>Inquiries</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{inquiries.length}</Text>
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => refetch()} />
        }
      />
    </AsyncBoundary>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },

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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    gap: spacing.sm,
  },
  cardUnread: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: colors.primarySurface,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  propertyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  propertyTitle: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: spacing.sm,
  },
  statusText: { fontSize: 11, fontWeight: typography.fontWeight.bold },

  inquirerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  inquirerInfo: { flex: 1 },
  inquirerName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  inquirerContact: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  message: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: spacing.sm,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },
});

export default ReceivedInquiriesScreen;
