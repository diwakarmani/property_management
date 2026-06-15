import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
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

describe('PropertyDetailScreen — enquiry flow', () => {
  const navigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRoute as jest.Mock).mockReturnValue({ params: { id: 99 } });
    (useNavigation as jest.Mock).mockReturnValue({ navigate, goBack: jest.fn() });
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => selector({
      auth: { user: { roles: ['REALTOR'] } },
    }));
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

  it('renders the Send Enquiry button', async () => {
    const screen = render(<PropertyDetailScreen />);
    expect(screen.getByText('Send Enquiry')).toBeTruthy();
  });

  it('does not expose or query buyer-only favorites for a realtor', () => {
    const screen = render(<PropertyDetailScreen />);
    expect(screen.queryByLabelText(/favorites/i)).toBeNull();
    expect(useFavoriteCheckQuery).toHaveBeenCalledWith(99, false);
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
