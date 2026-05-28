import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '@/api/services/notification.service';
import { queryKeys, STALE_TIME } from '@/api/queryClient';
import type { NotificationDTO } from '@/api/types/notification.types';

export const useNotificationsQuery = (page = 0, size = 50) =>
  useQuery({
    queryKey: [...queryKeys.notifications, page, size] as const,
    queryFn: async () => {
      const res = await NotificationService.list(page, size);
      return res.data.data?.content ?? ([] as NotificationDTO[]);
    },
    staleTime: STALE_TIME.MEDIUM,
  });

export const useUnreadCountQuery = () =>
  useQuery({
    queryKey: queryKeys.notificationsUnreadCount,
    queryFn: async () => {
      const res = await NotificationService.unreadCount();
      return res.data.data?.count ?? 0;
    },
    staleTime: STALE_TIME.LIVE,
  });

/** Mark a single notification read — optimistic + cache patch on success. */
export const useMarkReadMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => NotificationService.markRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications });
      const previous = qc.getQueriesData<NotificationDTO[]>({ queryKey: queryKeys.notifications });
      previous.forEach(([key, data]) => {
        if (Array.isArray(data)) {
          qc.setQueryData<NotificationDTO[]>(key, data.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ));
        }
      });
      return { previous };
    },
    onError: (_err, _id, context) => {
      context?.previous.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications });
      qc.invalidateQueries({ queryKey: queryKeys.notificationsUnreadCount });
    },
  });
};

export const useMarkAllReadMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => NotificationService.markAllRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications });
      const previous = qc.getQueriesData<NotificationDTO[]>({ queryKey: queryKeys.notifications });
      previous.forEach(([key, data]) => {
        if (Array.isArray(data)) {
          qc.setQueryData<NotificationDTO[]>(key, data.map((n) => ({ ...n, read: true })));
        }
      });
      qc.setQueryData(queryKeys.notificationsUnreadCount, 0);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      context?.previous.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications });
      qc.invalidateQueries({ queryKey: queryKeys.notificationsUnreadCount });
    },
  });
};
