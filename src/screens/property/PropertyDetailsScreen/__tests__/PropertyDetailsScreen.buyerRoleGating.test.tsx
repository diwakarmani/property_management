import React from 'react';
import { render } from '@testing-library/react-native';
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

const BASE_PROPERTY = {
  id: 5,
  title: 'Luxury Villa',
  description: 'A beautiful villa.',
  ownerId: 10,
  ownerName: 'John Owner',
  ownerIsRealtor: false,
  listingType: 'SALE',
  price: 2500000,
  locality: 'Koramangala',
  city: 'Bangalore',
  state: 'Karnataka',
  status: 'ACTIVE',
  isVerified: false,
  isFeatured: false,
  isPremium: false,
  images: [],
  amenities: [],
  viewCount: 120,
  shortlistCount: 45,
  inquiryCount: 8,
};

const setupMocks = (roles: string[], activeRole: string | null = null) => {
  (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => selector({
    auth: { user: { roles }, activeRole },
  }));
  (useRoute as jest.Mock).mockReturnValue({ params: { id: 5 } });
  (useNavigation as jest.Mock).mockReturnValue({ navigate: jest.fn(), goBack: jest.fn() });
  (useFavoriteCheckQuery as jest.Mock).mockReturnValue({ data: false, isLoading: false });
  (useAddFavoriteMutation as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
  (useRemoveFavoriteMutation as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
  (useRealtorProfileQuery as jest.Mock).mockReturnValue({ data: undefined });
  (useRevealContactMutation as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
  (usePropertyQuery as jest.Mock).mockReturnValue({
    data: BASE_PROPERTY,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  });
};

describe('PropertyDetailScreen — buyer-role gating for dual-role accounts (Bug 11)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the favorite/contact controls for a BUYER+SELLER account even while activeRole is "seller"', () => {
    setupMocks(['BUYER', 'SELLER'], 'seller');
    const screen = render(<PropertyDetailScreen />);

    expect(screen.getByLabelText('Add to favorites')).toBeTruthy();
    expect(useFavoriteCheckQuery).toHaveBeenCalledWith(5, true);
  });

  it('shows the favorite/contact controls for a BUYER+REALTOR account even while activeRole is "realtor"', () => {
    setupMocks(['BUYER', 'REALTOR'], 'realtor');
    const screen = render(<PropertyDetailScreen />);

    expect(screen.getByLabelText('Add to favorites')).toBeTruthy();
  });

  it('still hides the favorite/contact controls for an account with no BUYER role at all', () => {
    setupMocks(['SELLER'], 'seller');
    const screen = render(<PropertyDetailScreen />);

    expect(screen.queryByLabelText('Add to favorites')).toBeNull();
    expect(useFavoriteCheckQuery).toHaveBeenCalledWith(5, false);
  });
});

describe('PropertyDetailScreen — self-inquiry guard (net-new)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('hides the contact footer when the current user owns the listing', () => {
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => selector({
      auth: { user: { id: 10, roles: ['BUYER', 'SELLER'] }, activeRole: 'seller' },
    }));
    (useRoute as jest.Mock).mockReturnValue({ params: { id: 5 } });
    (useNavigation as jest.Mock).mockReturnValue({ navigate: jest.fn(), goBack: jest.fn() });
    (useFavoriteCheckQuery as jest.Mock).mockReturnValue({ data: false, isLoading: false });
    (useAddFavoriteMutation as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
    (useRemoveFavoriteMutation as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
    (useRealtorProfileQuery as jest.Mock).mockReturnValue({ data: undefined });
    (useRevealContactMutation as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
    (usePropertyQuery as jest.Mock).mockReturnValue({
      data: { ...BASE_PROPERTY, ownerId: 10 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const screen = render(<PropertyDetailScreen />);

    expect(screen.queryByText('Send Enquiry')).toBeNull();
  });
});
