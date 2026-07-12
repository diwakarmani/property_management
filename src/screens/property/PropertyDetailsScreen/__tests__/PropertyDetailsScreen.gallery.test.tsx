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
  amenities: [],
  viewCount: 120,
  shortlistCount: 45,
  inquiryCount: 8,
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

describe('PropertyDetailScreen — gallery primary-image ordering (Bug 8)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the primary-flagged image first even when it is not first in the backend array', () => {
    setupMocks({
      primaryImageUrl: 'https://example.com/second.jpg',
      images: [
        { id: 1, imageUrl: 'https://example.com/first.jpg', isPrimary: false, displayOrder: 0 },
        { id: 2, imageUrl: 'https://example.com/second.jpg', isPrimary: true, displayOrder: 1 },
        { id: 3, imageUrl: 'https://example.com/third.jpg', isPrimary: false, displayOrder: 2 },
      ],
    });
    const screen = render(<PropertyDetailScreen />);

    expect(screen.getByTestId('galleryImage-0').props.source.uri).toBe('https://example.com/second.jpg');
    expect(screen.getByTestId('galleryImage-1').props.source.uri).toBe('https://example.com/first.jpg');
    expect(screen.getByTestId('galleryImage-2').props.source.uri).toBe('https://example.com/third.jpg');
  });

  it('preserves order when the primary image is already first', () => {
    setupMocks({
      primaryImageUrl: 'https://example.com/a.jpg',
      images: [
        { id: 1, imageUrl: 'https://example.com/a.jpg', isPrimary: true, displayOrder: 0 },
        { id: 2, imageUrl: 'https://example.com/b.jpg', isPrimary: false, displayOrder: 1 },
      ],
    });
    const screen = render(<PropertyDetailScreen />);

    expect(screen.getByTestId('galleryImage-0').props.source.uri).toBe('https://example.com/a.jpg');
    expect(screen.getByTestId('galleryImage-1').props.source.uri).toBe('https://example.com/b.jpg');
  });

  it('falls back to primaryImageUrl when the images array is empty', () => {
    setupMocks({ primaryImageUrl: 'https://example.com/only.jpg', images: [] });
    const screen = render(<PropertyDetailScreen />);

    expect(screen.getByTestId('galleryImage-0').props.source.uri).toBe('https://example.com/only.jpg');
  });
});
