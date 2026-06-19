import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import axiosClient from '@/api/client/axiosClient';
import ReceivedInquiriesScreen from '../ReceivedInquiriesScreen';

let mockAxios: MockAdapter;

const makeWrapper = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const inquiry = {
  id: 1,
  propertyId: 10,
  propertyTitle: 'Sea View Apartment',
  name: 'John Buyer',
  email: 'john@example.com',
  phone: '+1555000001',
  message: 'I am interested in this property.',
  status: 'NEW',
  createdAt: '2026-06-01T10:00:00Z',
};

/**
 * Bug 36 regression guard.
 *
 * Prior to the fix, the status badge was a TouchableOpacity that silently cycled
 * the inquiry status — no visual affordance that it was interactive.
 *
 * After the fix:
 * - The badge is a plain View (read-only) — pressing it must NOT trigger mutation.
 * - A separate arrow button is the explicit affordance to advance status.
 */
describe('ReceivedInquiriesScreen — status advance UX (Bug 36)', () => {
  beforeEach(() => {
    mockAxios = new MockAdapter(axiosClient);
    mockAxios.onGet('/api/inquiries/received').reply(200, {
      success: true,
      data: { content: [inquiry], totalElements: 1, totalPages: 1, page: 0, size: 50 },
    });
  });
  afterEach(() => mockAxios.restore());

  it('renders a non-interactive status badge alongside a distinct advance button', async () => {
    const Wrapper = makeWrapper();
    const screen = render(<ReceivedInquiriesScreen />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('NEW')).toBeTruthy());

    // The advance button must be present and labelled
    const advanceBtn = screen.getByLabelText(
      'Advance inquiry status from NEW to CONTACTED'
    );
    expect(advanceBtn).toBeTruthy();

    // The status text itself must NOT be an interactive button
    // (i.e. it should not carry accessibilityRole="button")
    const statusText = screen.getByText('NEW');
    const parent = statusText.parent;
    expect(parent?.props?.accessibilityRole).not.toBe('button');
    expect(parent?.props?.onPress).toBeUndefined();
  });

  it('fires the update mutation when the advance button is pressed', async () => {
    mockAxios.onPatch('/api/inquiries/1/status').reply(200, {
      success: true,
      data: { ...inquiry, status: 'CONTACTED' },
    });

    const Wrapper = makeWrapper();
    const screen = render(<ReceivedInquiriesScreen />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('NEW')).toBeTruthy());

    fireEvent.press(
      screen.getByLabelText('Advance inquiry status from NEW to CONTACTED')
    );

    await waitFor(() =>
      expect(mockAxios.history.patch.some(r => r.url === '/api/inquiries/1/status')).toBe(true)
    );
  });

  it('does NOT fire a mutation when the status badge text is pressed', async () => {
    const Wrapper = makeWrapper();
    const screen = render(<ReceivedInquiriesScreen />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('NEW')).toBeTruthy());

    // Attempt to press the status badge text directly
    try { fireEvent.press(screen.getByText('NEW')); } catch { /* non-touchable, expected */ }

    // No PATCH should have been sent
    expect(mockAxios.history.patch).toHaveLength(0);
  });
});
