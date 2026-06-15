import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { useSelector } from 'react-redux';

import HomeScreen from '../HomeScreen';
import { useHomeFeedQuery } from '@/api/hooks/useDiscovery';

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('@/api/hooks/useDiscovery', () => ({ useHomeFeedQuery: jest.fn() }));
jest.mock('@/api/hooks/useFavorites', () => ({
  useFavoriteIdsSet: jest.fn(() => ({ ids: new Set(), isLoading: false })),
  useAddFavoriteMutation: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
  useRemoveFavoriteMutation: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
}));
jest.mock('@/components/property/PropertyCard', () => () => null);

describe('HomeScreen city refresh', () => {
  it('queries and opens View All with the newly selected city', () => {
    let state: any = {
      location: { selectedCity: { id: 1, name: 'Old City' }, coordinates: { latitude: 1, longitude: 2 } },
      auth: { user: { firstName: 'Buyer', roles: ['BUYER'] } },
    };
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => selector(state));
    (useHomeFeedQuery as jest.Mock).mockReturnValue({
      data: {
        popular: [{ id: 1, title: 'Property' }],
        recommended: [],
        nearest: [],
      },
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: jest.fn(),
    });
    const navigation = { navigate: jest.fn() };
    const screen = render(<HomeScreen navigation={navigation} />);

    expect(useHomeFeedQuery).toHaveBeenLastCalledWith('Old City', 1, 2);
    state = {
      ...state,
      location: { selectedCity: { id: 2, name: 'New City' }, coordinates: { latitude: 3, longitude: 4 } },
    };
    screen.rerender(<HomeScreen navigation={navigation} />);

    expect(useHomeFeedQuery).toHaveBeenLastCalledWith('New City', 3, 4);
    fireEvent.press(screen.getByText('View all'));
    expect(navigation.navigate).toHaveBeenCalledWith('ViewMore', {
      category: 'POPULAR', title: 'Popular', city: 'New City',
    });
  });
});
