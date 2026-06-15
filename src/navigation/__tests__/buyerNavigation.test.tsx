import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SearchStackScreen, MAIN_TAB_ROUTE_NAMES } from '../MainTabNavigator';

jest.mock('@/utils/withLayout', () => ({ withLayout: (Component: any) => Component }));
jest.mock('@/screens/search/SearchScreen', () => {
  const React = require('react');
  const { Text, TouchableOpacity } = require('react-native');
  return ({ navigation }: any) => React.createElement(
    TouchableOpacity,
    { onPress: () => navigation.navigate('PropertyDetail', { id: 7 }) },
    React.createElement(Text, null, 'Open result')
  );
});
jest.mock('@/screens/property/PropertyDetailsScreen', () => {
  const React = require('react');
  const { Text, TouchableOpacity } = require('react-native');
  return ({ navigation }: any) => React.createElement(
    TouchableOpacity,
    { onPress: () => navigation.goBack() },
    React.createElement(Text, null, 'Property details')
  );
});
jest.mock('@/screens/property/ContactAgentScreen', () => () => null);
jest.mock('@/screens/realtor/RealtorProfileScreen', () => () => null);
jest.mock('@/screens/home/HomeScreen', () => () => null);
jest.mock('@/screens/property/ViewMoreScreen', () => () => null);
jest.mock('@/screens/favorites/FavoritesScreen', () => () => null);
jest.mock('../ProfileStackNavigator', () => () => null);

describe('buyer navigation regressions', () => {
  it('returns Search -> Property Details -> Back to Search', async () => {
    const screen = render(
      <NavigationContainer>
        <SearchStackScreen disableAnimations />
      </NavigationContainer>
    );

    fireEvent.press(screen.getByText('Open result'));
    await waitFor(() => expect(screen.getByText('Property details')).toBeTruthy());

    fireEvent.press(screen.getByText('Property details'));
    await waitFor(() => expect(screen.getByText('Open result')).toBeTruthy());
  });

  it('does not register Notifications as a bottom tab', () => {
    expect(MAIN_TAB_ROUTE_NAMES).toEqual(['Home', 'Search', 'Favorites', 'Profile']);
    expect(MAIN_TAB_ROUTE_NAMES).not.toContain('Notifications');
  });
});
