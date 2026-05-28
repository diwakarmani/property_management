import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import axiosClient from '@/api/client/axiosClient';
import { useRealtorStatsQuery, useGroupStatsQuery } from '@/api/hooks/useStats';

describe('useStats hooks', () => {
  let mock: MockAdapter;
  const makeWrapper = () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return { client, Wrapper };
  };
  beforeEach(() => { mock = new MockAdapter(axiosClient); });
  afterEach(() => mock.restore());

  it('useRealtorStatsQuery returns the realtor KPIs', async () => {
    mock.onGet('/api/realtor/stats').reply(200, {
      success: true,
      data: {
        activeListings: 3,
        draftListings: 1,
        pendingApprovals: 2,
        soldCount: 5,
        rentedCount: 4,
        totalViews: 120,
      },
    });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useRealtorStatsQuery(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.activeListings).toBe(3);
    expect(result.current.data?.totalViews).toBe(120);
  });

  it('useGroupStatsQuery returns the group dashboard stats', async () => {
    mock.onGet('/api/group-admin/dashboard/stats').reply(200, {
      success: true,
      data: {
        totalMembers: 8,
        activeListings: 21,
        pendingApprovals: 3,
        soldThisMonth: 6,
        rentedThisMonth: 2,
        topPerformers: [],
      },
    });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useGroupStatsQuery(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.totalMembers).toBe(8);
  });

  it('useRealtorStatsQuery exposes error state on 404', async () => {
    mock.onGet('/api/realtor/stats').reply(404);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useRealtorStatsQuery(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
