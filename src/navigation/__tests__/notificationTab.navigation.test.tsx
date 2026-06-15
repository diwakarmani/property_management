import React from 'react';
import { Text, View } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import Header from '@/components/common/Header';
import NotificationsScreen from '@/screens/profile/NotificationsScreen';
import axiosClient from '@/api/client/axiosClient';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const EmptyScreen = ({ label }: { label: string }) => <Text>{label} content</Text>;

// ProfileStack now owns Notifications — same structure as ProfileStackNavigator
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain">{() => <EmptyScreen label="Profile" />}</Stack.Screen>
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
  </Stack.Navigator>
);

// Home screen with the shared Header so the bell icon is available
const Home = () => (
  <View>
    <Header />
    <Text>Home content</Text>
  </View>
);

const store = configureStore({
  reducer: {
    auth: () => ({ user: { roles: ['BUYER'] } }),
    location: () => ({ selectedCity: { name: 'Austin' } }),
  },
});

const renderTabs = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } },
  });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen name="Home" component={Home} />
            <Tab.Screen name="Search">{() => <EmptyScreen label="Search" />}</Tab.Screen>
            <Tab.Screen name="Favorites">{() => <EmptyScreen label="Favorites" />}</Tab.Screen>
            <Tab.Screen name="Profile" component={ProfileStack} />
          </Tab.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </Provider>
  );
};

describe('notification navigation — Notifications lives in ProfileStack', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    jest.useFakeTimers();
    mock = new MockAdapter(axiosClient);
    mock.onGet('/api/notifications/unread-count').reply(200, { success: true, data: { count: 0 } });
  });

  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
    mock.restore();
  });

  it.each([
    ['empty', [], "You're all caught up — no notifications yet."],
    ['populated', [{ id: 1, title: 'New inquiry', body: 'A buyer contacted you', read: false }], 'New inquiry'],
  ])('keeps every visible tab action available for the %s state', async (_state, notifications, expectedText) => {
    mock.onGet('/api/notifications').reply(200, {
      success: true,
      data: { content: notifications },
    });
    const screen = renderTabs();

    act(() => jest.runOnlyPendingTimers());

    // Tap the bell icon in the Header — navigates to Profile→Notifications
    fireEvent.press(await screen.findByLabelText('Notifications'));
    act(() => jest.runOnlyPendingTimers());
    await waitFor(() => expect(screen.getByText(expectedText as string)).toBeTruthy());

    // Notifications screen title is visible
    expect(screen.getByText('Notifications')).toBeTruthy();

    // All 4 tab bar items remain visible (Profile tab stays active)
    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('Search')).toBeTruthy();
    expect(screen.getByText('Favorites')).toBeTruthy();
    expect(screen.getByText('Profile')).toBeTruthy();
  });
});
