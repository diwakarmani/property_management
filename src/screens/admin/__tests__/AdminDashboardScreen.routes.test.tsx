import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AdminDashboardScreen from '../AdminDashboardScreen';
import { AnalyticsService } from '@/api/services/analytics.service';

jest.mock('@/api/services/analytics.service', () => ({
  AnalyticsService: { getPlatformStats: jest.fn() },
}));
jest.mock('@/api/services/admin.service', () => ({
  AdminService: { refreshDiscoveryCache: jest.fn() },
}));

const stats = {
  totalUsers: 10,
  totalProperties: 5,
  activeListings: 3,
  pendingApprovals: 2,
  soldProperties: 1,
  newUsersThisMonth: 4,
};

describe('AdminDashboardScreen user routes', () => {
  it('sends realtor and all-user actions to the same screen with distinct filters', async () => {
    (AnalyticsService.getPlatformStats as jest.Mock).mockResolvedValue({ data: { data: stats } });
    const navigation = { navigate: jest.fn() };
    const screen = render(<AdminDashboardScreen navigation={navigation} />);

    await waitFor(() => expect(screen.getByText('Manage Realtors')).toBeTruthy());
    fireEvent.press(screen.getByText('Manage Realtors'));
    expect(navigation.navigate).toHaveBeenLastCalledWith('Users', { roleFilter: 'REALTOR' });

    fireEvent.press(screen.getByText('Manage Users'));
    expect(navigation.navigate).toHaveBeenLastCalledWith('Users', { roleFilter: null });
  });
});
