import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import axiosClient from '@/api/client/axiosClient';
import {
  useConnectRealtorMutation,
  useRealtorProfileQuery,
  useRealtorStatsQuery,
} from '@/api/hooks/useStats';

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

  it('useRealtorProfileQuery returns public realtor trust details', async () => {
    mock.onGet('/api/realtors/22').reply(200, {
      success: true,
      data: {
        id: 22,
        name: 'Rhea Agent',
        verificationStatus: 'VERIFIED',
        totalUserInteractions: 3,
      },
    });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useRealtorProfileQuery(22), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('Rhea Agent');
    expect(result.current.data?.totalUserInteractions).toBe(3);
  });

  it('useConnectRealtorMutation POSTs the selected property context', async () => {
    mock.onPost('/api/realtors/22/connect').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ propertyId: 99 });
      return [200, {
        success: true,
        data: {
          success: true,
          interactionId: 44,
          realtorId: 22,
          propertyId: 99,
          totalUserInteractions: 1,
        },
      }];
    });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useConnectRealtorMutation(22), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ propertyId: 99 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('useRealtorStatsQuery exposes error state on 404', async () => {
    mock.onGet('/api/realtor/stats').reply(404);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useRealtorStatsQuery(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
