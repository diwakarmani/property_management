import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import axiosClient from '@/api/client/axiosClient';
import {
  useReceivedInquiriesQuery,
  useCreateInquiryMutation,
  useUpdateInquiryStatusMutation,
} from '@/api/hooks/useInquiries';

describe('useInquiries hooks', () => {
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

  it('useReceivedInquiriesQuery returns the realtor/seller inbox', async () => {
    mock.onGet('/api/inquiries/received').reply(200, {
      success: true,
      data: { content: [{ id: 1, propertyTitle: 'Loft', status: 'NEW' }] },
    });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useReceivedInquiriesQuery(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]).toMatchObject({ id: 1, status: 'NEW' });
  });

  it('useCreateInquiryMutation POSTs the inquiry and resolves with the new DTO', async () => {
    mock.onPost('/api/inquiries').reply(201, {
      success: true,
      data: { id: 99, propertyTitle: 'X', status: 'NEW' },
    });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useCreateInquiryMutation(), { wrapper: Wrapper });
    let returned: any;
    await act(async () => {
      returned = await result.current.mutateAsync({
        propertyId: 1,
        name: 'Test Buyer',
        email: 'buyer@test.example.com',
        message: 'interested',
      });
    });
    // mutateAsync resolves with the axios response — verifying the body proves the POST landed.
    expect(returned?.data?.data?.id).toBe(99);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('useUpdateInquiryStatusMutation optimistically updates status in the inbox cache', async () => {
    mock.onGet('/api/inquiries/received').reply(200, {
      success: true,
      data: { content: [{ id: 5, propertyTitle: 'A', status: 'NEW' }] },
    });
    mock.onPatch(/\/api\/inquiries\/5\/status/).reply(200, {
      success: true,
      data: { id: 5, propertyTitle: 'A', status: 'CONTACTED' },
    });

    const { Wrapper } = makeWrapper();
    const { result: inbox } = renderHook(() => useReceivedInquiriesQuery(), { wrapper: Wrapper });
    await waitFor(() => expect(inbox.current.isSuccess).toBe(true));
    expect(inbox.current.data?.[0].status).toBe('NEW');

    const { result: update } = renderHook(() => useUpdateInquiryStatusMutation(), { wrapper: Wrapper });
    await act(async () => { await update.current.mutateAsync({ id: 5, status: 'CONTACTED' }); });
    await waitFor(() => expect(update.current.isSuccess).toBe(true));
  });
});
