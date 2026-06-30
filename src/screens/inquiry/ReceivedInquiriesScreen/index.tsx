import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import type { InquiryDTO } from '@/api/types/inquiry.types';
import {
  useReceivedInquiriesInfiniteQuery,
  useUpdateInquiryStatusMutation,
} from '@/api/hooks/useInquiries';
import AsyncBoundary from '@/components/common/AsyncBoundary';
import { toast } from '@/utils/toast';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  NEW:       { color: colors.warning, bg: colors.warningSurface, icon: 'mail-unread-outline',         label: 'New' },
  CONTACTED: { color: colors.info,    bg: colors.infoSurface,    icon: 'chatbubble-ellipses-outline', label: 'Contacted' },
  CLOSED:    { color: colors.success, bg: colors.successSurface, icon: 'checkmark-done-outline',      label: 'Closed' },
};

// CLOSED is a terminal state — no cycle back to NEW.
// Only NEW and CONTACTED have a forward action.
const ADVANCE_ACTION: Record<string, { nextStatus: string; label: string; icon: string }> = {
  NEW:       { nextStatus: 'CONTACTED', label: 'Mark as Contacted', icon: 'chatbubble-ellipses-outline' },
  CONTACTED: { nextStatus: 'CLOSED',    label: 'Close Inquiry',     icon: 'checkmark-done-outline'      },
};

const formatDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const ReceivedInquiriesScreen = () => {
  const {
    data, isLoading, isError, error, refetch,
    isFetching, fetchNextPage, hasNextPage, isFetchingNextPage,
  } = useReceivedInquiriesInfiniteQuery();
  const inquiries = data?.items ?? [];
  const updateStatus = useUpdateInquiryStatusMutation();

  const advanceStatus = (inquiry: InquiryDTO) => {
    const action = ADVANCE_ACTION[inquiry.status];
    if (!action) return; // CLOSED — terminal, no further action
    updateStatus.mutate(
      { id: inquiry.id, status: action.nextStatus },
      {
        onError: (err: any) =>
          toast.error(err?.response?.data?.message || 'Could not update status'),
      }
    );
  };

  const renderItem = ({ item }: { item: InquiryDTO }) => {
    const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.NEW;
    const action = ADVANCE_ACTION[item.status];
    const isNew = item.status === 'NEW';

    return (
      <View style={[styles.card, isNew && styles.cardNew]}>
        {/* Left accent stripe for unread (NEW) inquiries */}
        {isNew && <View style={styles.newAccent} />}

        {/* ── Header: property + date ── */}
        <View style={styles.cardHeader}>
          <View style={styles.propertyBadge}>
            <Ionicons name="home-outline" size={14} color={colors.primary} />
            <Text style={styles.propertyTitle} numberOfLines={1}>
              {item.propertyTitle}
            </Text>
          </View>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={11} color={colors.textLight} />
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ── Inquirer ── */}
        <View style={styles.inquirerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(item.name?.[0] ?? '?').toUpperCase()}</Text>
          </View>
          <View style={styles.inquirerInfo}>
            <Text style={styles.inquirerName}>{item.name}</Text>
            <Text style={styles.inquirerContact} numberOfLines={1}>
              {item.email}{item.phone ? ` · ${item.phone}` : ''}
            </Text>
          </View>
        </View>

        {/* ── Message ── */}
        <View style={styles.messageBox}>
          <Text style={styles.message}>{item.message}</Text>
        </View>

        {/* ── Footer: status badge + explicit action button ── */}
        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Ionicons name={statusCfg.icon as any} size={12} color={statusCfg.color} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>

          {action ? (
            <TouchableOpacity
              style={[styles.actionBtn, updateStatus.isPending && styles.actionBtnPending]}
              onPress={() => advanceStatus(item)}
              disabled={updateStatus.isPending}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              {updateStatus.isPending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Text style={styles.actionBtnText}>{action.label}</Text>
                  <Ionicons name={action.icon as any} size={14} color={colors.primary} />
                </>
              )}
            </TouchableOpacity>
          ) : (
            /* CLOSED — terminal, no action button */
            <View style={styles.closedLabel}>
              <Ionicons name="lock-closed-outline" size={12} color={colors.textLight} />
              <Text style={styles.closedLabelText}>No further action</Text>
            </View>
          )}
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
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetchingNextPage
            ? <ActivityIndicator style={styles.footer} color={colors.primary} />
            : null
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
  footer: { paddingVertical: spacing.md },

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

  // Card: always white — clearly distinct from the lavender (#EFECFF) page background
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 3,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  // NEW cards get a primary border to signal unread — background stays white
  cardNew: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  // 4px left accent stripe rendered via absolute positioning inside overflow:hidden card
  newAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 8, // offset for the accent stripe on NEW cards
  },
  propertyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  propertyTitle: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: spacing.sm,
  },
  date: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderLight,
    marginVertical: 2,
    marginLeft: 8,
  },

  inquirerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: 8,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
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

  messageBox: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: spacing.sm,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  message: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },

  // Footer: status badge on left, explicit action button on right
  // Action button is clearly labeled — cannot be confused with the status badge
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 8,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
    marginTop: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  // Explicit action button — min 44pt height per HIG, clearly labeled
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnPending: {
    opacity: 0.5,
  },
  actionBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  closedLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
  },
  closedLabelText: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    fontStyle: 'italic',
  },
});

export default ReceivedInquiriesScreen;
