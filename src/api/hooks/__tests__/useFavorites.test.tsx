import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import axiosClient from '@/api/client/axiosClient';
import {
  useFavoritesQuery,
  useFavoriteIdsSet,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} from '@/api/hooks/useFavorites';
import { queryKeys } from '@/api/queryClient';

describe('useFavorites hooks', () => {
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

  it('useFavoritesQuery fetches and returns the favorites list', async () => {
    mock.onGet('/api/favorites').reply(200, {
      success: true,
      data: { content: [{ id: 1, title: 'Cozy Loft' }, { id: 2, title: 'Beach House' }] },
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFavoritesQuery(0, 50), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]).toMatchObject({ id: 1, title: 'Cozy Loft' });
  });

  it('useFavoritesQuery exposes error state on 4xx', async () => {
    mock.onGet('/api/favorites').reply(404);

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFavoritesQuery(0, 50), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('useFavoriteIdsSet builds a Set of IDs from the favorites list', async () => {
    mock.onGet('/api/favorites').reply(200, {
      success: true,
      data: { content: [{ id: 10, title: 'A' }, { id: 20, title: 'B' }] },
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFavoriteIdsSet(true), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.ids.has(10)).toBe(true);
    expect(result.current.ids.has(20)).toBe(true);
    expect(result.current.ids.has(99)).toBe(false);
  });

  it('useFavoriteIdsSet returns empty Set when disabled (non-buyer)', async () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFavoriteIdsSet(false), { wrapper: Wrapper });

    expect(result.current.ids.size).toBe(0);
    expect(mock.history.get).toHaveLength(0);
  });

  it('useFavoriteIdsSet returns empty Set on 401 (stale token) without crashing', async () => {
    mock.onGet('/api/favorites').reply(401);

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFavoriteIdsSet(true), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.ids.size).toBe(0);
  });

  it('useAddFavoriteMutation succeeds and seeds the per-id favorited flag', async () => {
    mock.onGet('/api/favorites').reply(200, { success: true, data: { content: [] } });
    mock.onPost('/api/favorites/5').reply(200, { success: true });

    const { client, Wrapper } = makeWrapper();
    const { result: list } = renderHook(() => useFavoriteIdsSet(true), { wrapper: Wrapper });
    await waitFor(() => expect(list.current.isLoading).toBe(false));

    const { result: add } = renderHook(() => useAddFavoriteMutation(), { wrapper: Wrapper });
    await act(async () => { await add.current.mutateAsync(5); });

    await waitFor(() => expect(add.current.isSuccess).toBe(true));
    expect(client.getQueryData(queryKeys.favoritesCheck(5))).toBe(true);
  });

  it('useRemoveFavoriteMutation removes item from flat IDs Set on success', async () => {

    mock.onGet('/api/favorites').replyOnce(200, {
      success: true,
      data: { content: [{ id: 1, title: 'A' }, { id: 2, title: 'B' }] },
    });
    mock.onGet('/api/favorites').reply(200, {
      success: true,
      data: { content: [{ id: 2, title: 'B' }] },
    });
    mock.onDelete('/api/favorites/1').reply(200, { success: true });

    const { client, Wrapper } = makeWrapper();
    const { result: ids } = renderHook(() => useFavoriteIdsSet(true), { wrapper: Wrapper });
    await waitFor(() => expect(ids.current.ids.has(1)).toBe(true));

    const { result: remove } = renderHook(() => useRemoveFavoriteMutation(), { wrapper: Wrapper });
    await act(async () => { await remove.current.mutateAsync(1); });

    await waitFor(() => expect(remove.current.isSuccess).toBe(true));

    await waitFor(() => expect(client.getQueryData(queryKeys.favoritesCheck(1))).toBe(false));
  });

  it('useRemoveFavoriteMutation rolls back optimistic update on 500', async () => {
    mock.onGet('/api/favorites').reply(200, {
      success: true,
      data: { content: [{ id: 1, title: 'A' }] },
    });
    mock.onDelete('/api/favorites/1').reply(500);

    const { client, Wrapper } = makeWrapper();
    const { result: list } = renderHook(() => useFavoritesQuery(0, 50), { wrapper: Wrapper });
    await waitFor(() => expect(list.current.isSuccess).toBe(true));

    const { result: remove } = renderHook(() => useRemoveFavoriteMutation(), { wrapper: Wrapper });
    await act(async () => {
      try { await remove.current.mutateAsync(1); } catch {  }
    });

    await waitFor(() => expect(remove.current.isError).toBe(true));

    expect(client.getQueryData(queryKeys.favoritesCheck(1))).toBe(true);
  });
});
