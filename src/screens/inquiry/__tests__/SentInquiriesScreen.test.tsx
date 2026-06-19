import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import axiosClient from '@/api/client/axiosClient';
import SentInquiriesScreen from '../SentInquiriesScreen';

let mockAxios: MockAdapter;

const makeWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const mockNavigation = { navigate: jest.fn() };
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

const inquiry1 = {
  id: 1,
  propertyId: 10,
  propertyTitle: 'Sea View Apartment',
  inquirerId: 99,
  name: 'Alice Buyer',
  email: 'alice@example.com',
  phone: '+1555000001',
  message: 'I am very interested in this property. Please get in touch.',
  status: 'NEW',
  createdAt: '2026-06-01T10:00:00Z',
};

const inquiry2 = {
  id: 2,
  propertyId: 11,
  propertyTitle: 'Downtown Loft',
  inquirerId: 99,
  name: 'Alice Buyer',
  email: 'alice@example.com',
  phone: '+1555000001',
  message: 'Is this still available?',
  status: 'CONTACTED',
  createdAt: '2026-06-10T14:30:00Z',
};

const makeSentResponse = (content: typeof inquiry1[]) => ({
  success: true,
  data: { content, totalElements: content.length, totalPages: 1, page: 0, size: 50 },
});

describe('SentInquiriesScreen — Bug 37', () => {
  beforeEach(() => {
    mockAxios = new MockAdapter(axiosClient);
    jest.clearAllMocks();
  });
  afterEach(() => mockAxios.restore());

  it('renders all sent inquiry cards with title, status, and message', async () => {
    mockAxios.onGet('/api/inquiries/sent').reply(200, makeSentResponse([inquiry1, inquiry2]));

    const screen = render(<SentInquiriesScreen />, { wrapper: makeWrapper() });

    await waitFor(() => expect(screen.getByText('Sea View Apartment')).toBeTruthy());

    expect(screen.getByText('Downtown Loft')).toBeTruthy();
    expect(screen.getByText('Pending')).toBeTruthy();
    expect(screen.getByText('Contacted')).toBeTruthy();
    expect(screen.getByText('I am very interested in this property. Please get in touch.')).toBeTruthy();
    expect(screen.getByText('Is this still available?')).toBeTruthy();
  });

  it('shows count badge matching number of inquiries', async () => {
    mockAxios.onGet('/api/inquiries/sent').reply(200, makeSentResponse([inquiry1, inquiry2]));

    const screen = render(<SentInquiriesScreen />, { wrapper: makeWrapper() });

    await waitFor(() => expect(screen.getByText('Sea View Apartment')).toBeTruthy());
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('shows empty state when no inquiries are returned', async () => {
    mockAxios.onGet('/api/inquiries/sent').reply(200, makeSentResponse([]));

    const screen = render(<SentInquiriesScreen />, { wrapper: makeWrapper() });

    await waitFor(() =>
      expect(
        screen.getByText(/haven't sent any inquiries yet/i)
      ).toBeTruthy()
    );
  });

  it('tapping a property row navigates to PropertyDetail with the correct id', async () => {
    mockAxios.onGet('/api/inquiries/sent').reply(200, makeSentResponse([inquiry1]));

    const screen = render(<SentInquiriesScreen />, { wrapper: makeWrapper() });

    await waitFor(() => expect(screen.getByText('Sea View Apartment')).toBeTruthy());

    fireEvent.press(screen.getByText('Sea View Apartment'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('PropertyDetail', { id: 10 });
  });

  it('status badge is read-only — no status-advance button exists', async () => {
    mockAxios.onGet('/api/inquiries/sent').reply(200, makeSentResponse([inquiry1]));

    const screen = render(<SentInquiriesScreen />, { wrapper: makeWrapper() });

    await waitFor(() => expect(screen.getByText('Pending')).toBeTruthy());

    // Tapping the badge should not trigger any navigation or mutation
    fireEvent.press(screen.getByText('Pending'));
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });

  it('shows error boundary text when API returns 500', async () => {
    mockAxios.onGet('/api/inquiries/sent').reply(500, {
      success: false,
      message: 'Internal server error',
    });

    const screen = render(<SentInquiriesScreen />, { wrapper: makeWrapper() });

    await waitFor(() =>
      expect(
        screen.getByText('Internal server error') ||
        screen.getByText('Could not load your inquiries.')
      ).toBeTruthy()
    );
  });
});
