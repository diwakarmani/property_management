import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '@/theme';
import type { NotificationDTO } from '@/api/types/notification.types';
import {
  useNotificationsQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
} from '@/api/hooks/useNotifications';
import AsyncBoundary from '@/components/common/AsyncBoundary';
import { toast } from '@/utils/toast';

const formatDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  return sameDay ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString();
};

/**
 * In-app notifications inbox (RF-06) — migrated to TanStack Query (FE-09).
 * Loading / error / refetch / optimistic mark-read are now handled by the
 * shared {@code QueryClient} + dedicated mutation hooks.
 */
const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { data: notifications = [], isLoading, isError, error, refetch, isFetching } =
    useNotificationsQuery(0, 50);
  const markRead = useMarkReadMutation();
  const markAll = useMarkAllReadMutation();

  const onMarkRead = (n: NotificationDTO) => {
    if (n.read) return;
    markRead.mutate(n.id);
  };

  const onMarkAll = () => {
    if (!notifications.some((n) => !n.read)) return;
    markAll.mutate(undefined, {
      onSuccess: () => toast.success('All notifications marked read'),
    });
  };

  const renderItem = ({ item }: { item: NotificationDTO }) => (
    <TouchableOpacity
      style={[styles.row, !item.read && styles.rowUnread]}
      onPress={() => onMarkRead(item)}
      accessibilityRole="button"
      accessibilityLabel={`Notification ${item.title}${item.read ? '' : ', unread'}`}
    >
      <View style={styles.iconCircle}>
        <Ionicons
          name={item.read ? 'mail-open-outline' : 'mail'}
          size={20}
          color={item.read ? colors.textSecondary : colors.primary}
        />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowHeader}>
          <Text style={[styles.title, !item.read && styles.titleUnread]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        </View>
        {!!item.body && (
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
        )}
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const hasUnread = notifications.some((n) => !n.read);
  const errorMessage = isError ? (error as any)?.response?.data?.message ?? 'Could not load notifications.' : null;

  return (
    <View style={styles.root}>
      <AsyncBoundary
        loading={isLoading}
        error={errorMessage}
        empty={!isLoading && !errorMessage && notifications.length === 0}
        emptyText="You're all caught up — no notifications yet."
        emptyIcon="notifications-outline"
        onRetry={() => refetch()}
      >
        <FlatList
          style={styles.container}
          contentContainerStyle={styles.content}
          data={notifications}
          keyExtractor={(n) => String(n.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => refetch()} tintColor={colors.primary} />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={styles.backRow}>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => navigation.goBack()}
                  accessibilityRole="button"
                >
                  <Ionicons name="chevron-back" size={18} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.pageTitle}>Notifications</Text>
                {hasUnread && (
                  <TouchableOpacity
                    onPress={onMarkAll}
                    disabled={markAll.isPending}
                    style={styles.markAllBtn}
                    accessibilityRole="button"
                  >
                    <Text style={styles.markAllText}>Mark all read</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          }
        />
      </AsyncBoundary>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },

  listHeader: { marginBottom: spacing.sm },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  markAllBtn: {},
  markAllText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  rowUnread: {
    backgroundColor: colors.primarySurface,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowBody: { flex: 1 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
    fontWeight: typography.fontWeight.medium,
  },
  titleUnread: { fontWeight: typography.fontWeight.bold, color: colors.primary },
  date: { fontSize: typography.fontSize.xs, color: colors.textLight },
  body: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
    flexShrink: 0,
  },
});

export default NotificationsScreen;
