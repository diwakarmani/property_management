import React from 'react';
import { Text, View } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import Header from '../index';
import NotificationsScreen from '@/screens/profile/NotificationsScreen';
import axiosClient from '@/api/client/axiosClient';

const Stack = createStackNavigator();

const Home = () => (
  <View>
    <Header />
    <Text>Home content</Text>
  </View>
);

describe('Header notification flow', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosClient);
    mock.onGet('/api/notifications/unread-count').reply(200, {
      success: true, data: { count: 2 },
    });
    mock.onGet('/api/notifications').reply(200, {
      success: true,
      data: { content: [{ id: 1, title: 'Inquiry received', body: 'New inquiry', read: false }] },
    });
  });

  afterEach(() => mock.restore());

  it('clicking the bell calls unread-count and list, then Back returns to the prior screen', async () => {
    const store = configureStore({
      reducer: {
        auth: () => ({ user: { roles: ['BUYER'] } }),
        location: () => ({ selectedCity: { name: 'Bengaluru' } }),
      },
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } },
    });

    const screen = render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
              <Stack.Screen name="Home" component={Home} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </QueryClientProvider>
      </Provider>
    );

    await waitFor(() => expect(mock.history.get.some((r) => r.url === '/api/notifications/unread-count')).toBe(true));
    fireEvent.press(screen.getByLabelText('Notifications'));

    await waitFor(() => expect(screen.getByText('Inquiry received')).toBeTruthy());
    expect(mock.history.get.some((r) => r.url === '/api/notifications')).toBe(true);
    expect(mock.history.get.filter((r) => r.url === '/api/notifications/unread-count').length)
      .toBeGreaterThanOrEqual(1);

    fireEvent.press(screen.getByRole('button', { name: /back/i }));
    await waitFor(() => expect(screen.getByText('Home content')).toBeTruthy());
  });
});
