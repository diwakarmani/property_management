import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import axiosClient from '@/api/client/axiosClient';
import {
  useFavoritesQuery,
  useRemoveFavoriteMutation,
} from '@/api/hooks/useFavorites';
import { queryKeys } from '@/api/queryClient';

/**
 * Unit tests for the favorites react-query hooks (FE-09).
 * Verifies that the QueryClient wiring + optimistic mutation patch work end-to-end.
 */
describe('useFavorites hooks', () => {
  let mock: MockAdapter;

  // A fresh QueryClient per test so cache state can't leak between cases.
  // retry=false makes a failed query reject immediately (no 30s test hang).
  const makeWrapper = () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return { client, Wrapper };
  };

  beforeEach(() => {
    mock = new MockAdapter(axiosClient);
  });
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

  it('useFavoritesQuery exposes error state on failure', async () => {
    // 404 (not 5xx) — the axios interceptor retries 5xx on idempotent GETs
    // with backoff (NB-15), which would make this test wait ~10s. 4xx fails fast.
    mock.onGet('/api/favorites').reply(404);

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFavoritesQuery(0, 50), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('useRemoveFavoriteMutation succeeds and patches the per-id favorited flag', async () => {
    mock.onGet('/api/favorites').reply(200, {
      success: true,
      data: { content: [{ id: 1, title: 'A' }, { id: 2, title: 'B' }] },
    });
    mock.onDelete('/api/favorites/1').reply(200, { success: true });

    const { client, Wrapper } = makeWrapper();
    // Seed the favorites cache so the optimistic patch has something to operate on.
    const { result: list } = renderHook(() => useFavoritesQuery(0, 50), { wrapper: Wrapper });
    await waitFor(() => expect(list.current.isSuccess).toBe(true));

    const { result: remove } = renderHook(() => useRemoveFavoriteMutation(), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await remove.current.mutateAsync(1);
    });

    await waitFor(() => expect(remove.current.isSuccess).toBe(true));
    // The mutation patched the per-id favorited flag in the cache.
    expect(client.getQueryData(queryKeys.favoritesCheck(1))).toBe(false);
  });

  it('useRemoveFavoriteMutation surfaces failure state', async () => {
    mock.onGet('/api/favorites').reply(200, {
      success: true,
      data: { content: [{ id: 1, title: 'A' }] },
    });
    mock.onDelete('/api/favorites/1').reply(500);

    const { Wrapper } = makeWrapper();
    const { result: list } = renderHook(() => useFavoritesQuery(0, 50), { wrapper: Wrapper });
    await waitFor(() => expect(list.current.isSuccess).toBe(true));

    const { result: remove } = renderHook(() => useRemoveFavoriteMutation(), {
      wrapper: Wrapper,
    });
    await act(async () => {
      try {
        await remove.current.mutateAsync(1);
      } catch {
        /* expected — mutateAsync rejects on 500 */
      }
    });

    await waitFor(() => expect(remove.current.isError).toBe(true));
  });
});
