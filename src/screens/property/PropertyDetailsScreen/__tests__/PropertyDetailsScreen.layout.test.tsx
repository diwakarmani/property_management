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

const setupMocks = (propertyOverrides: object = {}) => {
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
  (usePropertyQuery as jest.Mock).mockReturnValue({
    data: { ...BASE_PROPERTY, ...propertyOverrides },
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  });
};

describe('PropertyDetailScreen — metaDates section (Bug 10)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not render the Posted/Updated row for a DRAFT listing with no publishedAt or updatedAt', () => {
    setupMocks({ publishedAt: null, updatedAt: null });
    const screen = render(<PropertyDetailScreen />);

    expect(screen.queryByText(/^Posted/)).toBeNull();
    expect(screen.queryByText(/^Updated/)).toBeNull();
  });

  it('renders the Posted row when publishedAt is present', () => {
    setupMocks({ publishedAt: '2026-01-01T00:00:00Z', updatedAt: null });
    const screen = render(<PropertyDetailScreen />);

    expect(screen.getByText(/^Posted/)).toBeTruthy();
  });

  it('renders the Updated row when updatedAt is present', () => {
    setupMocks({ publishedAt: null, updatedAt: '2026-02-01T00:00:00Z' });
    const screen = render(<PropertyDetailScreen />);

    expect(screen.getByText(/^Updated/)).toBeTruthy();
  });
});

describe('PropertyDetailScreen — undefined route params (Bug 13 defense-in-depth)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not crash when route.params is undefined', () => {
    setupMocks();
    (useRoute as jest.Mock).mockReturnValue({ params: undefined });
    (usePropertyQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: null,
      refetch: jest.fn(),
    });

    expect(() => render(<PropertyDetailScreen />)).not.toThrow();
  });
});

// Hook-order regression coverage (net-new: useSafeAreaInsets was declared after the
// isLoading/!property early return) lives in PropertyDetailsScreen.hookOrder.test.tsx —
// it needs the library's real useContext-based mock to actually exercise React's hook
// dispatcher, which this file's flattened useSafeAreaInsets mock above cannot do.
