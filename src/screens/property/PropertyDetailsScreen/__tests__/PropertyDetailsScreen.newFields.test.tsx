import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import PropertyDetailScreen from '../index';
import { usePropertyQuery } from '@/api/hooks/useProperties';
import { useFavoriteCheckQuery, useAddFavoriteMutation, useRemoveFavoriteMutation } from '@/api/hooks/useFavorites';
import { useRealtorProfileQuery } from '@/api/hooks/useStats';

jest.mock('@react-navigation/native', () => ({
  useRoute: jest.fn(),
  useNavigation: jest.fn(),
}));
jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('@/api/hooks/useProperties', () => ({ usePropertyQuery: jest.fn() }));
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

const mockLinking = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as any);

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
  (usePropertyQuery as jest.Mock).mockReturnValue({
    data: { ...BASE_PROPERTY, ...propertyOverrides },
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  });
};

describe('PropertyDetailScreen — Activity section', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  it('shows view count', () => {
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('120')).toBeTruthy();
    expect(screen.getByText('Views')).toBeTruthy();
  });

  it('enables the favorite control for a buyer', () => {
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByLabelText('Add to favorites')).toBeTruthy();
    expect(useFavoriteCheckQuery).toHaveBeenCalledWith(5, true);
  });

  it('shows shortlist count', () => {
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('45')).toBeTruthy();
    expect(screen.getByText('Shortlists')).toBeTruthy();
  });

  it('shows inquiry count', () => {
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText('Contacts')).toBeTruthy();
  });

  it('formats large view counts with k suffix', () => {
    setupMocks({ viewCount: 1500, shortlistCount: 0, inquiryCount: 0 });
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('1.5k')).toBeTruthy();
  });
});

describe('PropertyDetailScreen — Property Overview section', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows furnishing status chip', () => {
    setupMocks({ furnishedStatus: 'SEMI_FURNISHED' });
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('SEMI FURNISHED')).toBeTruthy();
    expect(screen.getByText('Furnishing')).toBeTruthy();
  });

  it('shows carpet area chip', () => {
    setupMocks({ carpetArea: 1200 });
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('1,200 sqft')).toBeTruthy();
    expect(screen.getByText('Carpet')).toBeTruthy();
  });

  it('shows built-up area chip', () => {
    setupMocks({ builtUpArea: 1500 });
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('1,500 sqft')).toBeTruthy();
    expect(screen.getByText('Built-up')).toBeTruthy();
  });

  it('shows parking chip with sum of covered + open', () => {
    setupMocks({ parkingCovered: 1, parkingOpen: 1 });
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('Parking')).toBeTruthy();
  });

  it('shows None for parking when total is 0', () => {
    setupMocks({ parkingCovered: 0, parkingOpen: 0 });
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('None')).toBeTruthy();
  });

  it('shows Property Overview section with Not specified placeholders when no spec data', () => {
    setupMocks({
      furnishedStatus: null,
      balconies: null,
      parkingCovered: null,
      parkingOpen: null,
      builtUpArea: null,
      carpetArea: null,
      plotArea: null,
      facingDirection: null,
      ageOfProperty: null,
      totalFloors: null,
    });
    const screen = render(<PropertyDetailScreen />);
    // Section always renders; placeholder text shown for absent fields
    expect(screen.getByText('Property Overview')).toBeTruthy();
    const notSpecified = screen.getAllByText('Not specified');
    expect(notSpecified.length).toBeGreaterThanOrEqual(2); // furnishing + parking
  });
});

describe('PropertyDetailScreen — Property Profile section', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders Freehold ownership label', () => {
    setupMocks({ ownershipType: 'FREEHOLD' });
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('Ownership')).toBeTruthy();
    expect(screen.getByText('Freehold')).toBeTruthy();
  });

  it('renders Co-operative Society ownership label', () => {
    setupMocks({ ownershipType: 'CO_OPERATIVE_SOCIETY' });
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('Co-operative Society')).toBeTruthy();
  });

  it('renders Ready to Move possession label', () => {
    setupMocks({ possessionStatus: 'READY_TO_MOVE' });
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('Possession')).toBeTruthy();
    expect(screen.getByText('Ready to Move')).toBeTruthy();
  });

  it('renders Under Construction possession label', () => {
    setupMocks({ possessionStatus: 'UNDER_CONSTRUCTION' });
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('Under Construction')).toBeTruthy();
  });

  it('renders Modular kitchen label', () => {
    setupMocks({ kitchenType: 'MODULAR_KITCHEN' });
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('Kitchen')).toBeTruthy();
    expect(screen.getByText('Modular')).toBeTruthy();
  });

  it('renders Corporation water supply label', () => {
    setupMocks({ waterSupply: 'CORPORATION_WATER' });
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('Water Supply')).toBeTruthy();
    expect(screen.getByText('Corporation')).toBeTruthy();
  });

  it('shows Property Profile section with Not specified placeholders when no profile fields', () => {
    setupMocks({
      ownershipType: null,
      possessionStatus: null,
      kitchenType: null,
      waterSupply: null,
      availableFrom: null,
      maintenanceCharge: null,
      depositAmount: null,
    });
    const screen = render(<PropertyDetailScreen />);
    // Section always renders with all 4 rows
    expect(screen.getByText('Property Profile')).toBeTruthy();
    expect(screen.getByText('Ownership')).toBeTruthy();
    expect(screen.getByText('Possession')).toBeTruthy();
    expect(screen.getByText('Kitchen')).toBeTruthy();
    expect(screen.getByText('Water Supply')).toBeTruthy();
    // All 4 show placeholder since no values provided
    const notSpecified = screen.getAllByText('Not specified');
    expect(notSpecified.length).toBeGreaterThanOrEqual(4);
  });
});

describe('PropertyDetailScreen — Description expandable', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not show Show more for short description', () => {
    setupMocks({ description: 'Short description.' });
    const screen = render(<PropertyDetailScreen />);
    expect(screen.queryByText('Show more')).toBeNull();
  });

  it('shows Show more button for description over 250 chars', () => {
    const longDesc = 'A'.repeat(300);
    setupMocks({ description: longDesc });
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('Show more')).toBeTruthy();
  });

  it('shows truncated text and toggles to full text on Show more press', () => {
    const longDesc = 'B'.repeat(300);
    setupMocks({ description: longDesc });
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('B'.repeat(250) + '…')).toBeTruthy();
    fireEvent.press(screen.getByText('Show more'));
    expect(screen.getByText('Show less')).toBeTruthy();
    expect(screen.getByText(longDesc)).toBeTruthy();
  });
});

describe('PropertyDetailScreen — Amenities section', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows amenity names grouped by category', () => {
    setupMocks({
      amenities: [
        { id: 1, name: 'Swimming Pool', category: 'RECREATION' },
        { id: 2, name: '24/7 Security', category: 'SAFETY' },
        { id: 3, name: 'Lift', category: 'ACCESS' },
      ],
    });
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('Swimming Pool')).toBeTruthy();
    expect(screen.getByText('24/7 Security')).toBeTruthy();
    expect(screen.getByText('Lift')).toBeTruthy();
    expect(screen.getByText('Recreation')).toBeTruthy();
    expect(screen.getByText('Safety')).toBeTruthy();
    expect(screen.getByText('Access')).toBeTruthy();
  });

  it('does not show Amenities section when amenities list is empty', () => {
    setupMocks({ amenities: [] });
    const screen = render(<PropertyDetailScreen />);
    expect(screen.queryByText('AMENITIES')).toBeNull();
  });
});

describe('PropertyDetailScreen — Location section', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLinking.mockClear();
  });

  it('shows address details', () => {
    setupMocks({ addressLine1: '123 MG Road', locality: 'Koramangala', city: 'Bangalore' });
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('123 MG Road')).toBeTruthy();
  });

  it('shows View on Maps button when lat/lng present', () => {
    setupMocks({ latitude: 12.97, longitude: 77.59 });
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('View on Maps')).toBeTruthy();
  });

  it('does not show View on Maps button when lat/lng absent', () => {
    setupMocks({ latitude: null, longitude: null });
    const screen = render(<PropertyDetailScreen />);
    expect(screen.queryByText('View on Maps')).toBeNull();
  });

  it('pressing View on Maps calls Linking.openURL', () => {
    setupMocks({ latitude: 12.97, longitude: 77.59 });
    const screen = render(<PropertyDetailScreen />);
    fireEvent.press(screen.getByText('View on Maps'));
    expect(mockLinking).toHaveBeenCalled();
  });
});
