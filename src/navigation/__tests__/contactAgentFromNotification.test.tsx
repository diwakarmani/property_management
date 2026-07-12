import React from 'react';
import { Button, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

/**
 * NN-4 regression: `ContactAgent` must be registered as a sibling of `PropertyDetail` on the
 * SAME navigator that also hosts `Notifications` — otherwise a property opened from a
 * notification (which lives on the root stack, per Bug 13) can't reach `ContactAgent` when the
 * user taps "Send Enquiry", producing the same class of unhandled-navigation-action error Bug 13
 * fixed for `RealtorProfile`. Registering `ContactAgent` only on RealtorNavigator/SellerNavigator's
 * nested ListingsStack (the first fix attempted) is NOT sufficient — a notification-opened
 * PropertyDetail bypasses that nested stack entirely.
 */
const Stack = createStackNavigator();

const NotificationsMock = ({ navigation }: any) => (
  <Button title="Open notification" onPress={() => navigation.navigate('PropertyDetail', { id: 5 })} />
);

const PropertyDetailMock = ({ navigation }: any) => (
  <Button
    title="Send Enquiry"
    onPress={() => navigation.navigate('ContactAgent', { propertyId: 5, propertyTitle: 'Test listing' })}
  />
);

const ContactAgentMock = () => <Text>Contact Agent Screen</Text>;

const renderRootStack = () =>
  render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Notifications" component={NotificationsMock} />
        <Stack.Screen name="PropertyDetail" component={PropertyDetailMock} />
        <Stack.Screen name="ContactAgent" component={ContactAgentMock} />
      </Stack.Navigator>
    </NavigationContainer>
  );

describe('Notification -> PropertyDetail -> ContactAgent navigation (NN-4)', () => {
  it('reaches ContactAgent without an unhandled-action error when ContactAgent is a sibling route', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const screen = renderRootStack();

    fireEvent.press(screen.getByText('Open notification'));
    fireEvent.press(await screen.findByText('Send Enquiry'));

    await waitFor(() => expect(screen.getByText('Contact Agent Screen')).toBeTruthy());
    expect(consoleError).not.toHaveBeenCalledWith(expect.stringContaining('was not handled by any navigator'));

    consoleError.mockRestore();
  });

  it('fails with an unhandled-action error when ContactAgent is NOT registered (proves the test would have caught the actual live-verified bug)', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const screen = render(
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Notifications" component={NotificationsMock} />
          <Stack.Screen name="PropertyDetail" component={PropertyDetailMock} />
        </Stack.Navigator>
      </NavigationContainer>
    );

    fireEvent.press(screen.getByText('Open notification'));
    fireEvent.press(await screen.findByText('Send Enquiry'));

    await waitFor(() => expect(consoleError).toHaveBeenCalled());
    expect(screen.queryByText('Contact Agent Screen')).toBeNull();

    consoleError.mockRestore();
  });
});
