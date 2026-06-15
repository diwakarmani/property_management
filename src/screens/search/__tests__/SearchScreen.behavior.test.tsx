import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useSelector } from 'react-redux';
import SearchScreen, { buildSearchParams, getSearchGridLayout } from '../SearchScreen';
import { useSearchInfiniteQuery } from '@/api/hooks/useProperties';

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('@/api/hooks/useProperties', () => ({
  useSearchInfiniteQuery: jest.fn(() => ({
    data: { items: [] }, isLoading: false, isError: false, error: null,
    refetch: jest.fn(), fetchNextPage: jest.fn(), isFetchingNextPage: false, hasNextPage: false,
  })),
  usePropertyTypesQuery: jest.fn(() => ({ data: [] })),
}));
jest.mock('@/api/hooks/useFavorites', () => ({
  useFavoriteIdsSet: jest.fn(() => ({ ids: new Set(), isLoading: false })),
  useAddFavoriteMutation: jest.fn(() => ({ isPending: false, mutate: jest.fn() })),
  useRemoveFavoriteMutation: jest.fn(() => ({ isPending: false, mutate: jest.fn() })),
}));
jest.mock('@/components/property/PropertyCard', () => () => null);
jest.mock('@/components/common/AsyncBoundary', () => ({ children }: any) => children);

const mockUseSelector = useSelector as unknown as jest.Mock;
const mockSearchQuery = useSearchInfiniteQuery as jest.Mock;

const city = (id: number, name: string) => ({
  id, name, stateName: 'State', latitude: 1, longitude: 2,
});

describe('SearchScreen buyer refresh behavior', () => {
  let state: any;

  beforeEach(() => {
    jest.clearAllMocks();
    state = {
      location: { selectedCity: city(1, 'Old City'), selectedLocalities: [] },
      auth: { user: { roles: ['BUYER'] } },
    };
    mockUseSelector.mockImplementation((selector: any) => selector(state));
  });

  it('re-commits the query when the globally selected city changes', async () => {
    const screen = render(<SearchScreen navigation={{ navigate: jest.fn() }} />);
    expect(mockSearchQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ city: 'Old City' }),
      expect.objectContaining({ enabled: true })
    );

    state = {
      ...state,
      location: { selectedCity: city(2, 'New City'), selectedLocalities: [] },
    };
    screen.rerender(<SearchScreen navigation={{ navigate: jest.fn() }} />);

    await waitFor(() => expect(mockSearchQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ city: 'New City' }),
      expect.objectContaining({ enabled: true })
    ));
  });

  it('debounces city text and triggers a new query without opening filters', async () => {
    const screen = render(<SearchScreen navigation={{ navigate: jest.fn() }} />);
    fireEvent.changeText(screen.getByPlaceholderText('Search by city…'), 'Pune');

    await waitFor(() => expect(mockSearchQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ city: 'Pune' }),
      expect.objectContaining({ enabled: true })
    ), { timeout: 1000 });
  });
});

describe('SearchScreen responsive layout', () => {
  it.each([
    ['iPhone SE', 320, 2],
    ['iPhone 13', 390, 2],
    ['iPhone 15 Pro Max', 430, 2],
    ['iPad', 768, 3],
  ])('keeps cards usable on %s', (_device, width, columns) => {
    const layout = getSearchGridLayout(width);
    expect(layout.columns).toBe(columns);
    expect(layout.cardWidth).toBeGreaterThanOrEqual(138);
    expect(layout.cardWidth * layout.columns + layout.gap * (layout.columns - 1) + 32)
      .toBeLessThanOrEqual(width);
  });

  it('maps filter values to the backend contract', () => {
    expect(buildSearchParams({
      listingType: 'RENT', propertyTypeId: 3, minPrice: '1000', maxPrice: '5000',
      bedrooms: [2, 3], minBathrooms: 2, furnishing: 'FURNISHED',
      minArea: '800', maxArea: '1500', sortBy: 'price_asc',
    }, ' Bengaluru ', ['Indiranagar'])).toEqual({
      city: 'Bengaluru', localities: 'Indiranagar', listingType: 'RENT', propertyTypeId: 3,
      minPrice: 1000, maxPrice: 5000, minBedrooms: 2, maxBedrooms: 3,
      minBathrooms: 2, furnishedStatus: 'FURNISHED', minArea: 800, maxArea: 1500,
      sortBy: 'price', sortDir: 'asc',
    });
  });
});
