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

const NOT_PENDING = {
  approvePending: false,
  rejectPending: false,
  approveDeletionPending: false,
  rejectDeletionPending: false,
  featuredPending: false,
  verifiedPending: false,
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
        onApproveDeletion={jest.fn()}
        onRejectDeletion={jest.fn()}
        onToggleFeatured={onToggleFeatured}
        onToggleVerified={onToggleVerified}
        {...NOT_PENDING}
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

  it('disables only the featured control while its own mutation is pending (Bug 1)', () => {
    const screen = render(
      <PropertyCard
        property={property}
        onApprove={jest.fn()}
        onReject={jest.fn()}
        onApproveDeletion={jest.fn()}
        onRejectDeletion={jest.fn()}
        onToggleFeatured={jest.fn()}
        onToggleVerified={jest.fn()}
        {...NOT_PENDING}
        featuredPending
      />
    );

    expect(screen.getByLabelText('Toggle featured').props.accessibilityState.disabled).toBe(true);
    // The bug: a shared boolean used to disable every other control too. Verified must stay enabled.
    expect(screen.getByLabelText('Toggle verified').props.accessibilityState.disabled).toBe(false);
  });

  it('disables only the verified control while its own mutation is pending (Bug 1)', () => {
    const screen = render(
      <PropertyCard
        property={property}
        onApprove={jest.fn()}
        onReject={jest.fn()}
        onApproveDeletion={jest.fn()}
        onRejectDeletion={jest.fn()}
        onToggleFeatured={jest.fn()}
        onToggleVerified={jest.fn()}
        {...NOT_PENDING}
        verifiedPending
      />
    );

    expect(screen.getByLabelText('Toggle verified').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByLabelText('Toggle featured').props.accessibilityState.disabled).toBe(false);
  });

  it('disables only Approve, not Reject/Featured/Verified, while approveMutation is pending (Bug 1)', () => {
    const pendingProperty = { ...property, status: 'PENDING_APPROVAL' };
    const screen = render(
      <PropertyCard
        property={pendingProperty}
        onApprove={jest.fn()}
        onReject={jest.fn()}
        onApproveDeletion={jest.fn()}
        onRejectDeletion={jest.fn()}
        onToggleFeatured={jest.fn()}
        onToggleVerified={jest.fn()}
        {...NOT_PENDING}
        approvePending
      />
    );

    expect(screen.getByText('Reject').parent?.props.disabled).toBeFalsy();
    expect(screen.getByLabelText('Toggle featured').props.accessibilityState.disabled).toBe(false);
    expect(screen.getByLabelText('Toggle verified').props.accessibilityState.disabled).toBe(false);
  });

  it('calls onPress when the card body is tapped (Bug 10/39)', () => {
    const onPress = jest.fn();
    const screen = render(
      <PropertyCard
        property={property}
        onApprove={jest.fn()}
        onReject={jest.fn()}
        onApproveDeletion={jest.fn()}
        onRejectDeletion={jest.fn()}
        onToggleFeatured={jest.fn()}
        onToggleVerified={jest.fn()}
        onPress={onPress}
        {...NOT_PENDING}
      />
    );

    fireEvent.press(screen.getByText('Contract property'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders without error when onPress is omitted (optional prop)', () => {

    expect(() => render(
      <PropertyCard
        property={property}
        onApprove={jest.fn()}
        onReject={jest.fn()}
        onApproveDeletion={jest.fn()}
        onRejectDeletion={jest.fn()}
        onToggleFeatured={jest.fn()}
        onToggleVerified={jest.fn()}
        {...NOT_PENDING}
      />
    )).not.toThrow();
  });
});
