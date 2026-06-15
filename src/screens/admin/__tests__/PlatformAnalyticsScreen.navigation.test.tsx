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

describe('PlatformAnalyticsScreen navigation', () => {
  it('opens users and status-filtered listing screens from metric cards', async () => {
    (AnalyticsService.getPlatformStats as jest.Mock).mockResolvedValue({ data: { data: stats } });
    const tabs = { navigate: jest.fn() };
    const navigation = { getParent: jest.fn(() => tabs), navigate: jest.fn() };
    const screen = render(<PlatformAnalyticsScreen navigation={navigation} />);

    await waitFor(() => expect(screen.getByLabelText('View Total Users')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('View Total Users'));
    expect(tabs.navigate).toHaveBeenLastCalledWith('Users', {
      screen: 'ManageUsers', params: { roleFilter: null },
    });

    fireEvent.press(screen.getByLabelText('View Total Properties'));
    expect(tabs.navigate).toHaveBeenLastCalledWith('Listings', {
      screen: 'AdminListings', params: { status: 'ALL' },
    });

    fireEvent.press(screen.getByLabelText('View Active Listings'));
    expect(tabs.navigate).toHaveBeenLastCalledWith('Listings', {
      screen: 'AdminListings', params: { status: 'ACTIVE' },
    });

    fireEvent.press(screen.getByLabelText('View Pending Review'));
    expect(tabs.navigate).toHaveBeenLastCalledWith('Listings', {
      screen: 'AdminListings', params: { status: 'PENDING_APPROVAL' },
    });

    fireEvent.press(screen.getByLabelText('View Sold'));
    expect(tabs.navigate).toHaveBeenLastCalledWith('Listings', {
      screen: 'AdminListings', params: { status: 'SOLD' },
    });

    fireEvent.press(screen.getByLabelText('View Rented'));
    expect(tabs.navigate).toHaveBeenLastCalledWith('Listings', {
      screen: 'AdminListings', params: { status: 'RENTED' },
    });

    fireEvent.press(screen.getByLabelText('View New Users'));
    expect(tabs.navigate).toHaveBeenLastCalledWith('Users', {
      screen: 'ManageUsers', params: { roleFilter: null },
    });

    fireEvent.press(screen.getByLabelText('View New Properties'));
    expect(tabs.navigate).toHaveBeenLastCalledWith('Listings', {
      screen: 'AdminListings', params: { status: 'ALL' },
    });
  });
});
