import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import PlatformAnalyticsScreen from '../PlatformAnalyticsScreen';
import { AnalyticsService } from '@/api/services/analytics.service';

jest.mock('@/api/services/analytics.service', () => ({
  AnalyticsService: { getPlatformStats: jest.fn() },
}));

const stats = {
  totalUsers: 10,
  totalProperties: 8,
  activeListings: 4,
  pendingApprovals: 2,
  soldProperties: 1,
  rentedProperties: 1,
  newUsersThisMonth: 3,
  newPropertiesThisMonth: 2,
};

/**
 * Bug 27/30/31 regression guard.
 *
 * Analytics listing links now push AdminListings onto the ANALYTICS stack
 * (navigation.navigate) so that Back returns to analytics.
 * They must NOT switch to the Listings tab (tabNavigation.navigate) which
 * broke the back-stack in the old implementation.
 *
 * User links still switch to the Users tab (tabNavigation.navigate) — they
 * have no back-stack requirement in the current design.
 */
describe('PlatformAnalyticsScreen navigation — Bug 27/30/31', () => {
  let navigation: { getParent: jest.Mock; navigate: jest.Mock };
  let tabs: { navigate: jest.Mock };

  beforeEach(() => {
    (AnalyticsService.getPlatformStats as jest.Mock).mockResolvedValue({ data: { data: stats } });
    tabs = { navigate: jest.fn() };
    navigation = { getParent: jest.fn(() => tabs), navigate: jest.fn() };
  });

  it('pushes AdminListings onto the analytics stack for each listing status', async () => {
    const screen = render(<PlatformAnalyticsScreen navigation={navigation} />);
    await waitFor(() => expect(screen.getByLabelText('View Total Properties')).toBeTruthy());

    const listingCases: Array<[string, string]> = [
      ['View Total Properties',  'ALL'],
      ['View Active Listings',   'ACTIVE'],
      ['View Pending Review',    'PENDING_APPROVAL'],
      ['View Active',            'ACTIVE'],
      ['View Pending Approval',  'PENDING_APPROVAL'],
      ['View Sold',              'SOLD'],
      ['View Rented',            'RENTED'],
      ['View New Properties',    'ALL'],
    ];

    for (const [label, status] of listingCases) {
      navigation.navigate.mockClear();
      fireEvent.press(screen.getByLabelText(label));
      expect(navigation.navigate).toHaveBeenCalledWith('AdminListings', { status });
      // Must NOT switch tabs — that breaks back-stack navigation (Bug 27)
      expect(tabs.navigate).not.toHaveBeenCalledWith('Listings', expect.anything());
    }
  });

  it('switches to the Users tab for user-related metrics', async () => {
    const screen = render(<PlatformAnalyticsScreen navigation={navigation} />);
    await waitFor(() => expect(screen.getByLabelText('View Total Users')).toBeTruthy());

    const userCases = ['View Total Users', 'View New Users'];
    for (const label of userCases) {
      tabs.navigate.mockClear();
      fireEvent.press(screen.getByLabelText(label));
      expect(tabs.navigate).toHaveBeenCalledWith('Users', {
        screen: 'ManageUsers', params: { roleFilter: null },
      });
    }
  });

  it('does not call tab navigate for any listing metric', async () => {
    const screen = render(<PlatformAnalyticsScreen navigation={navigation} />);
    await waitFor(() => expect(screen.getByLabelText('View Total Properties')).toBeTruthy());

    const listingLabels = [
      'View Total Properties', 'View Active Listings', 'View Pending Review',
      'View Active', 'View Pending Approval', 'View Sold', 'View Rented', 'View New Properties',
    ];
    for (const label of listingLabels) {
      fireEvent.press(screen.getByLabelText(label));
    }
    // tabs.navigate may have been called for user metrics, but never for Listings
    const listingTabCalls = tabs.navigate.mock.calls.filter(
      ([route]: string[]) => route === 'Listings'
    );
    expect(listingTabCalls).toHaveLength(0);
  });
});
