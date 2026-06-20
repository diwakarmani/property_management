import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import axiosClient from '@/api/client/axiosClient';
import {
  useNotificationsQuery,
  useUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
} from '@/api/hooks/useNotifications';

describe('useNotifications hooks', () => {
  let mock: MockAdapter;
  const makeWrapper = () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } },
    });
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return { client, Wrapper };
  };
  beforeEach(() => { mock = new MockAdapter(axiosClient); });
  afterEach(() => mock.restore());

  it('useNotificationsQuery returns the notifications list', async () => {
    mock.onGet('/api/notifications').reply(200, {
      success: true,
      data: { content: [{ id: 1, title: 'Hi', read: false }, { id: 2, title: 'Welcome', read: true }] },
    });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useNotificationsQuery(0, 50), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });

  it('useUnreadCountQuery returns the unread count', async () => {
    mock.onGet('/api/notifications/unread-count').reply(200, {
      success: true,
      data: { count: 5 },
    });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useUnreadCountQuery(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(5);
  });

  it('useMarkReadMutation optimistically marks a single notification read', async () => {
    mock.onGet('/api/notifications').reply(200, {
      success: true,
      data: { content: [{ id: 1, title: 'A', read: false }, { id: 2, title: 'B', read: false }] },
    });
    mock.onPatch('/api/notifications/1/read').reply(200, {
      success: true,
      data: { id: 1, title: 'A', read: true },
    });

    const { Wrapper } = makeWrapper();
    const { result: list } = renderHook(() => useNotificationsQuery(0, 50), { wrapper: Wrapper });
    await waitFor(() => expect(list.current.isSuccess).toBe(true));

    const { result: markRead } = renderHook(() => useMarkReadMutation(), { wrapper: Wrapper });
    await act(async () => { await markRead.current.mutateAsync(1); });
    expect(markRead.current.isSuccess).toBe(true);
  });

  it('useMarkAllReadMutation succeeds and refetches the unread count', async () => {

    mock.onGet('/api/notifications/unread-count').replyOnce(200, { success: true, data: { count: 3 } });
    mock.onPost('/api/notifications/mark-all-read').reply(200, { success: true, data: { updated: 3 } });
    mock.onGet('/api/notifications/unread-count').reply(200, { success: true, data: { count: 0 } });

    const { Wrapper } = makeWrapper();
    const { result: count } = renderHook(() => useUnreadCountQuery(), { wrapper: Wrapper });
    await waitFor(() => expect(count.current.isSuccess).toBe(true));
    expect(count.current.data).toBe(3);

    const { result: markAll } = renderHook(() => useMarkAllReadMutation(), { wrapper: Wrapper });
    await act(async () => { await markAll.current.mutateAsync(); });

    await waitFor(() => expect(count.current.data).toBe(0));
    await waitFor(() => expect(markAll.current.isSuccess).toBe(true));
  });
});
