import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import PropertyDetailScreen from '../index';
import { usePropertyQuery, useRevealContactMutation } from '@/api/hooks/useProperties';
import { useFavoriteCheckQuery, useAddFavoriteMutation, useRemoveFavoriteMutation } from '@/api/hooks/useFavorites';
import { useRealtorProfileQuery } from '@/api/hooks/useStats';

jest.mock('@react-navigation/native', () => ({
  useRoute: jest.fn(),
  useNavigation: jest.fn(),
  useFocusEffect: jest.fn(),
}));
jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('@/api/hooks/useProperties', () => ({
  usePropertyQuery: jest.fn(),
  useRevealContactMutation: jest.fn(),
}));
jest.mock('@/api/hooks/useFavorites', () => ({
  useFavoriteCheckQuery: jest.fn(),
  useAddFavoriteMutation: jest.fn(),
  useRemoveFavoriteMutation: jest.fn(),
}));
jest.mock('@/api/hooks/useStats', () => ({
  useRealtorProfileQuery: jest.fn(),
}));
jest.mock('@/components/common/AsyncBoundary', () => {
  const { View } = require('react-native');
  return ({ children }: any) => <View>{children}</View>;
});
jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// Product decision (2026-07-12, final): realtors MAY message/contact other realtors (and any
// other listing owner) — e.g. co-brokerage, referrals — not just buyers. An earlier revision of
// this decision briefly said the opposite; this file reflects the final answer. The backend
// mirrors this: PropertyController's /reveal-contact is @PreAuthorize("hasAnyRole('BUYER','REALTOR')"),
// and createInquiry has no role restriction at all (only a self-inquiry guard).
describe('PropertyDetailScreen — realtor viewing another realtor\'s listing', () => {
  const navigate = jest.fn();

  const mockAuthUser = (overrides: object = {}) => {
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => selector({
      auth: { user: { roles: ['REALTOR'], ...overrides } },
    }));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRoute as jest.Mock).mockReturnValue({ params: { id: 99 } });
    (useNavigation as jest.Mock).mockReturnValue({ navigate, goBack: jest.fn() });
    mockAuthUser();
    (useFavoriteCheckQuery as jest.Mock).mockReturnValue({ data: false, isLoading: false });
    (useAddFavoriteMutation as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
    (useRemoveFavoriteMutation as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
    (useRealtorProfileQuery as jest.Mock).mockReturnValue({
      data: {
        id: 22,
        name: 'Rhea Agent',
        verificationStatus: 'VERIFIED',
        totalUserInteractions: 3,
      },
    });
    (useRevealContactMutation as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
    (usePropertyQuery as jest.Mock).mockReturnValue({
      data: {
        id: 99,
        title: 'Downtown home',
        description: 'Move-in ready.',
        ownerId: 22,
        ownerName: 'Rhea Agent',
        ownerIsRealtor: true,
        listingType: 'SALE',
        price: 750000,
        locality: 'Downtown',
        city: 'Austin',
        status: 'ACTIVE',
        isVerified: true,
        isFeatured: false,
        isPremium: false,
        images: [],
        amenities: [],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it('renders the Send Enquiry button for a realtor-only account viewing another realtor\'s listing', async () => {
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('Send Enquiry')).toBeTruthy();
  });

  it('pressing Send Enquiry navigates directly to ContactAgent', async () => {
    const screen = render(<PropertyDetailScreen />);
    fireEvent.press(screen.getByText('Send Enquiry'));
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith('ContactAgent', {
        propertyId: 99,
        propertyTitle: 'Downtown home',
      })
    );
  });

  // Frontend defense-in-depth mirroring the backend's self-owner guard on reveal-contact: a
  // realtor viewing their OWN listing must not see the contact footer either.
  it('does not render the contact footer when the realtor owns the listing being viewed', () => {
    mockAuthUser({ id: 22 }); // matches the mocked property's ownerId
    const screen = render(<PropertyDetailScreen />);
    expect(screen.queryByText('Send Enquiry')).toBeNull();
  });

  it('does not expose or query buyer-only favorites for a realtor', () => {
    const screen = render(<PropertyDetailScreen />);
    expect(screen.queryByLabelText(/favorites/i)).toBeNull();
    expect(useFavoriteCheckQuery).toHaveBeenCalledWith(99, false);
  });

  it('shows realtor verification status in the Listed by section', async () => {
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('Verified Realtor')).toBeTruthy();
  });

  it('shows realtor connect count from profile', async () => {
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('tapping Listed by section navigates to RealtorProfile with propertyId', async () => {
    const screen = render(<PropertyDetailScreen />);
    fireEvent.press(screen.getByText('Rhea Agent'));
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith('RealtorProfile', {
        realtorId: 22,
        propertyId: 99,
        propertyTitle: 'Downtown home',
      })
    );
  });
});
