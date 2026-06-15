import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import axiosClient from '@/api/client/axiosClient';
import { useHomeFeedQuery, useViewMoreInfiniteQuery } from '@/api/hooks/useDiscovery';

/** Tests for the discovery hooks (FE-09 — HomeScreen + ViewMoreScreen). */
describe('useDiscovery hooks', () => {
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

  beforeEach(() => {
    mock = new MockAdapter(axiosClient);
  });
  afterEach(() => mock.restore());

  it('useHomeFeedQuery is disabled until a city or coordinate pair is provided', async () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useHomeFeedQuery(undefined), { wrapper: Wrapper });
    // With no city, the query never runs — stays idle.
    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('useHomeFeedQuery fetches immediately for near-me coordinates without a city', async () => {
    mock.onGet('/api/discovery/home').reply((config) => {
      expect(config.params).toEqual({ city: undefined, lat: 12.9716, lng: 77.5946 });
      return [200, { success: true, data: { popular: [], recommended: [], nearest: [] } }];
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useHomeFeedQuery(undefined, 12.9716, 77.5946),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mock.history.get).toHaveLength(1);
  });

  it('useHomeFeedQuery fetches the three home sections when a city is provided', async () => {
    mock.onGet('/api/discovery/home').reply(200, {
      success: true,
      data: {
        popular: [{ id: 1, title: 'A' }],
        recommended: [{ id: 2, title: 'B' }],
        nearest: [{ id: 3, title: 'C' }],
      },
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useHomeFeedQuery('Testville'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.popular).toHaveLength(1);
    expect(result.current.data?.recommended).toHaveLength(1);
    expect(result.current.data?.nearest).toHaveLength(1);
  });

  it('useViewMoreInfiniteQuery loads the first page', async () => {
    mock.onGet('/api/discovery/home/view-more').reply(200, {
      success: true,
      data: {
        content: [{ id: 1, title: 'P1' }, { id: 2, title: 'P2' }],
        pageNumber: 0,
        pageSize: 2,
        totalElements: 4,
        totalPages: 2,
        first: true,
        last: false,
        empty: false,
      },
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useViewMoreInfiniteQuery({ category: 'POPULAR' as any, size: 2 }),
      { wrapper: Wrapper }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(2);
    expect(result.current.data?.hasMore).toBe(true);
  });

  it('useViewMoreInfiniteQuery stops paginating when last=true', async () => {
    mock.onGet('/api/discovery/home/view-more').reply(200, {
      success: true,
      data: {
        content: [{ id: 1, title: 'P1' }],
        pageNumber: 0,
        pageSize: 50,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
        empty: false,
      },
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useViewMoreInfiniteQuery({ category: 'POPULAR' as any }),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.data?.items).toHaveLength(1);
  });
});
