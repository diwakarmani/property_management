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
import { SafeAreaView } from 'react-native-safe-area-context';

// ── Notification type → icon/color config ────────────────────────────────────

interface NotifStyle {
  icon: string;
  color: string;
  bg: string;
}

const NOTIF_STYLE: Record<string, NotifStyle> = {
  CONTACT_REVEALED: { icon: 'call',                color: '#7C3AED', bg: '#EDE9FE' },
  INQUIRY_RECEIVED: { icon: 'chatbubble-ellipses', color: '#0EA5E9', bg: '#E0F2FE' },
  PROPERTY_VIEWED:  { icon: 'eye',                 color: '#059669', bg: '#D1FAE5' },
  LISTING_APPROVED: { icon: 'checkmark-circle',    color: '#16A34A', bg: '#DCFCE7' },
  LISTING_REJECTED: { icon: 'close-circle',        color: '#DC2626', bg: '#FEE2E2' },
  DEFAULT:          { icon: 'notifications',       color: colors.primary, bg: colors.primarySurface },
};

const getNotifStyle = (type?: string): NotifStyle =>
  (type && NOTIF_STYLE[type]) ? NOTIF_STYLE[type] : NOTIF_STYLE.DEFAULT;

const formatDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  return sameDay
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

// ── Main screen ───────────────────────────────────────────────────────────────

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { data: notifications = [], isLoading, isError, error, refetch, isFetching } =
    useNotificationsQuery(0, 50);
  const markRead = useMarkReadMutation();
  const markAll = useMarkAllReadMutation();

  const onTapNotification = (n: NotificationDTO) => {
    if (!n.read) markRead.mutate(n.id);
    // Navigate to property if entityType is PROPERTY
    if (n.entityType === 'PROPERTY' && n.entityId) {
      (navigation as any).navigate('HomeStack', {
        screen: 'PropertyDetail',
        params: { id: n.entityId },
      });
    }
  };

  const onMarkAll = () => {
    if (!notifications.some((n) => !n.read)) return;
    markAll.mutate(undefined, {
      onSuccess: () => toast.success('All notifications marked read'),
    });
  };

  const renderItem = ({ item }: { item: NotificationDTO }) => {
    const ns = getNotifStyle(item.type);
    return (
      <TouchableOpacity
        style={[styles.row, !item.read && styles.rowUnread]}
        onPress={() => onTapNotification(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}${item.read ? '' : ', unread'}`}
      >
        <View style={[styles.iconCircle, { backgroundColor: ns.bg }]}>
          <Ionicons name={ns.icon as any} size={20} color={ns.color} />
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
          {item.entityType === 'PROPERTY' && item.entityId && (
            <View style={styles.tapHint}>
              <Ionicons name="home-outline" size={11} color={colors.textLight} />
              <Text style={styles.tapHintText}>Tap to view property</Text>
            </View>
          )}
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const hasUnread = notifications.some((n) => !n.read);
  const errorMessage = isError ? (error as any)?.response?.data?.message ?? 'Could not load notifications.' : null;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.listHeader}>
        <View style={styles.backRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
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
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
        />
      </AsyncBoundary>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },

  listHeader: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
    alignItems: 'flex-start',
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
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
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
  date: { fontSize: typography.fontSize.xs, color: colors.textLight, flexShrink: 0 },
  body: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  tapHintText: {
    fontSize: 10,
    color: colors.textLight,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
    marginTop: 6,
    flexShrink: 0,
  },
});

export default NotificationsScreen;
