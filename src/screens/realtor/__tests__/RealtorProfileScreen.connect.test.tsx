import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import RealtorProfileScreen from '../RealtorProfileScreen';
import { useConnectRealtorMutation, useRealtorProfileQuery } from '@/api/hooks/useStats';

jest.mock('@react-navigation/native', () => ({ useNavigation: jest.fn(), useRoute: jest.fn() }));
jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('@/api/hooks/useStats', () => ({
  useRealtorProfileQuery: jest.fn(),
  useConnectRealtorMutation: jest.fn(),
}));

describe('RealtorProfileScreen connect flow', () => {
  it('records the selected property before opening the inquiry screen', async () => {
    const navigate = jest.fn();
    const mutate = jest.fn();
    (useNavigation as jest.Mock).mockReturnValue({ navigate, goBack: jest.fn() });
    (useRoute as jest.Mock).mockReturnValue({ params: { realtorId: 4, propertyId: 22, propertyTitle: 'Lake House' } });
    (useSelector as unknown as jest.Mock).mockReturnValue(true);
    (useRealtorProfileQuery as jest.Mock).mockReturnValue({
      data: { id: 4, name: 'Demo Realtor', totalUserInteractions: 0, activeListingsCount: 3 },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    (useConnectRealtorMutation as jest.Mock).mockReturnValue({ mutate, isPending: false });

    const screen = render(<RealtorProfileScreen />);
    fireEvent.press(screen.getByText('Send Enquiry'));

    await waitFor(() => expect(mutate).toHaveBeenCalledWith({ propertyId: 22 }));
    expect(navigate).toHaveBeenCalledWith('ContactAgent', { propertyId: 22, propertyTitle: 'Lake House' });
  });
});
