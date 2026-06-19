import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { normalizeAdminListingStatus, PropertyCard } from '../AdminListingsScreen';

const property = {
  id: 1,
  title: 'Contract property',
  description: 'Test',
  listingType: 'SALE',
  price: 250000,
  locality: 'Downtown',
  city: 'Los Angeles',
  status: 'ACTIVE',
  isFeatured: true,
  isVerified: false,
  isPremium: false,
};

describe('Admin listing feature and verify controls', () => {
  it('accepts analytics status filters and safely defaults unknown values', () => {
    expect(normalizeAdminListingStatus('ALL')).toBe('ALL');
    expect(normalizeAdminListingStatus('ACTIVE')).toBe('ACTIVE');
    expect(normalizeAdminListingStatus('PENDING_APPROVAL')).toBe('PENDING_APPROVAL');
    expect(normalizeAdminListingStatus('SOLD')).toBe('SOLD');
    expect(normalizeAdminListingStatus('RENTED')).toBe('RENTED');
    expect(normalizeAdminListingStatus('UNKNOWN')).toBe('PENDING_APPROVAL');
  });

  it('reflects server state and invokes each distinct action', () => {
    const onToggleFeatured = jest.fn();
    const onToggleVerified = jest.fn();
    const screen = render(
      <PropertyCard
        property={property}
        onApprove={jest.fn()}
        onReject={jest.fn()}
        onToggleFeatured={onToggleFeatured}
        onToggleVerified={onToggleVerified}
        isPending={false}
      />
    );

    const featured = screen.getByLabelText('Toggle featured');
    const verified = screen.getByLabelText('Toggle verified');
    expect(featured.props.accessibilityState).toEqual({ disabled: false, selected: true });
    expect(verified.props.accessibilityState).toEqual({ disabled: false, selected: false });
    fireEvent.press(featured);
    fireEvent.press(verified);
    expect(onToggleFeatured).toHaveBeenCalledTimes(1);
    expect(onToggleVerified).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText(/favorite/i)).toBeNull();
  });

  it('disables both controls while a mutation is pending', () => {
    const screen = render(
      <PropertyCard
        property={property}
        onApprove={jest.fn()}
        onReject={jest.fn()}
        onToggleFeatured={jest.fn()}
        onToggleVerified={jest.fn()}
        isPending
      />
    );

    expect(screen.getByLabelText('Toggle featured').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByLabelText('Toggle verified').props.accessibilityState.disabled).toBe(true);
  });

  /**
   * Bug 10 / 39 regression guard — the card must be touchable and must call
   * onPress when tapped so the admin can navigate to PropertyDetail.
   */
  it('calls onPress when the card body is tapped (Bug 10/39)', () => {
    const onPress = jest.fn();
    const screen = render(
      <PropertyCard
        property={property}
        onApprove={jest.fn()}
        onReject={jest.fn()}
        onToggleFeatured={jest.fn()}
        onToggleVerified={jest.fn()}
        onPress={onPress}
        isPending={false}
      />
    );

    // Press the property title which is inside the touchable card wrapper
    fireEvent.press(screen.getByText('Contract property'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders without error when onPress is omitted (optional prop)', () => {
    // Confirm onPress is genuinely optional — no crash without it
    expect(() => render(
      <PropertyCard
        property={property}
        onApprove={jest.fn()}
        onReject={jest.fn()}
        onToggleFeatured={jest.fn()}
        onToggleVerified={jest.fn()}
        isPending={false}
      />
    )).not.toThrow();
  });
});
