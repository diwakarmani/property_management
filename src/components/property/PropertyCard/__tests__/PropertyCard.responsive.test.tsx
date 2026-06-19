import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import PropertyCard from '../index';
import { formatPrice } from '@/utils/helpers/formatPrice';

jest.mock('@/components/common/OptimizedImage', () => () => null);

/**
 * Bug 21 regression guard — the shared PropertyCard must format prices via the
 * shared formatPrice utility, not raw numbers.
 */
describe('PropertyCard price formatting (Bug 21)', () => {
  it('renders $250K for a 250000 price', () => {
    const screen = render(
      <PropertyCard
        property={{
          id: 2, title: 'Format test', price: 250000, city: 'City', locality: 'Area',
          primaryImageUrl: '', bedrooms: 2, listingType: 'SALE',
          verified: false, premium: false,
        }}
        onPress={jest.fn()}
      />
    );
    expect(screen.getByText('$250K')).toBeTruthy();
    expect(formatPrice(250000)).toBe('$250K');
  });

  it('renders $1.2M for a 1200000 price', () => {
    const screen = render(
      <PropertyCard
        property={{
          id: 3, title: 'Million test', price: 1200000, city: 'City', locality: 'Area',
          primaryImageUrl: '', bedrooms: 3, listingType: 'SALE',
          verified: false, premium: false,
        }}
        onPress={jest.fn()}
      />
    );
    expect(screen.getByText('$1.2M')).toBeTruthy();
    expect(formatPrice(1200000)).toBe('$1.2M');
  });
});

describe('PropertyCard narrow layout', () => {
  it('allows furnishing text and distance to wrap without overlap', () => {
    const screen = render(
      <PropertyCard
        property={{
          id: 1, title: 'Compact card', price: 100000, city: 'City', locality: 'Area',
          primaryImageUrl: '',
          bedrooms: 2, furnishedStatus: 'SEMI_FURNISHED', listingType: 'SALE',
          verified: false, premium: false, distanceInKm: 1.2,
        }}
        onPress={jest.fn()}
        style={{ width: 138 }}
      />
    );

    expect(StyleSheet.flatten(screen.getByTestId('property-card-details').props.style))
      .toEqual(expect.objectContaining({ flexWrap: 'wrap' }));
    expect(StyleSheet.flatten(screen.getByTestId('property-card-furnishing').props.style))
      .toEqual(expect.objectContaining({ flex: 1, minWidth: 0 }));
    expect(screen.getByText('SEMI FURNISHED')).toBeTruthy();
    expect(screen.getByText('1.2 km')).toBeTruthy();
  });
});
