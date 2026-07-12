import React from 'react';
import { render } from '@testing-library/react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import PropertyDetailScreen from '../index';
import { usePropertyQuery, useRevealContactMutation } from '@/api/hooks/useProperties';
import { useFavoriteCheckQuery, useAddFavoriteMutation, useRemoveFavoriteMutation } from '@/api/hooks/useFavorites';
import { useRealtorProfileQuery } from '@/api/hooks/useStats';

// Deliberately NOT using a flattened `useSafeAreaInsets: () => ({...})` mock here (as the
// sibling .layout.test.tsx file does) — that shape isn't a real hook from React's point of
// view (it calls no hooks internally), so moving its call site around a render can never
// trigger React's "change in the order of Hooks" detection. The library's own official jest
// mock calls useContext() internally, which does register with React's hook dispatcher and
// is what actually exercises this regression.
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

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
  status: 'DRAFT',
  isVerified: false,
  isFeatured: false,
  isPremium: false,
  images: [],
  amenities: [],
  viewCount: 0,
  shortlistCount: 0,
  inquiryCount: 0,
};

describe('PropertyDetailScreen — hook order stability across the loading -> loaded transition (net-new)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => selector({
      auth: { user: { roles: ['BUYER'] } },
    }));
    (useRoute as jest.Mock).mockReturnValue({ params: { id: 5 } });
    (useNavigation as jest.Mock).mockReturnValue({ navigate: jest.fn(), goBack: jest.fn() });
    (useFavoriteCheckQuery as jest.Mock).mockReturnValue({ data: false, isLoading: false });
    (useAddFavoriteMutation as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
    (useRemoveFavoriteMutation as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
    (useRealtorProfileQuery as jest.Mock).mockReturnValue({ data: undefined });
    (useRevealContactMutation as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
  });

  it('does not violate the Rules of Hooks when the loading gate resolves (regression: useSafeAreaInsets was declared after the early return)', () => {
    (usePropertyQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const screen = render(<PropertyDetailScreen />);

    (usePropertyQuery as jest.Mock).mockReturnValue({
      data: BASE_PROPERTY,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
    screen.rerender(<PropertyDetailScreen />);

    const hookOrderViolation = consoleError.mock.calls.some((call) =>
      String(call[0]).includes('change in the order of Hooks')
    );
    expect(hookOrderViolation).toBe(false);

    consoleError.mockRestore();
  });
});
