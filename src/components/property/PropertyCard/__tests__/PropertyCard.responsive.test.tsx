import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import PropertyCard from '../index';

jest.mock('@/components/common/OptimizedImage', () => () => null);

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
