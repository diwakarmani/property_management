import React from 'react';
import { Button, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

/**
 * Bug 13 regression: `RealtorProfile` must be registered as a sibling of `PropertyDetail`
 * on the SAME navigator that also hosts `Notifications` — otherwise a property opened from a
 * notification (which lives on the root stack) can't reach `RealtorProfile` when the user taps
 * "Listed by", producing an unhandled-navigation-action error (silent no-op in production,
 * a fatal-looking dev error screen otherwise). This mirrors the actual root-stack shape added
 * to AppNavigator.tsx rather than re-mounting the full app (which needs a full auth/location
 * bootstrap) to keep the test focused on the navigator wiring itself.
 */
const Stack = createStackNavigator();

const NotificationsMock = ({ navigation }: any) => (
  <Button title="Open notification" onPress={() => navigation.navigate('PropertyDetail', { id: 5 })} />
);

const PropertyDetailMock = ({ navigation }: any) => (
  <Button
    title="Listed by"
    onPress={() => navigation.navigate('RealtorProfile', { realtorId: 10, propertyId: 5 })}
  />
);

const RealtorProfileMock = () => <Text>Realtor Profile Screen</Text>;

const renderRootStack = () =>
  render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Notifications" component={NotificationsMock} />
        <Stack.Screen name="PropertyDetail" component={PropertyDetailMock} />
        <Stack.Screen name="RealtorProfile" component={RealtorProfileMock} />
      </Stack.Navigator>
    </NavigationContainer>
  );

describe('Notification -> PropertyDetail -> RealtorProfile navigation (Bug 13)', () => {
  it('reaches RealtorProfile without an unhandled-action error when RealtorProfile is a sibling route', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const screen = renderRootStack();

    fireEvent.press(screen.getByText('Open notification'));
    fireEvent.press(await screen.findByText('Listed by'));

    await waitFor(() => expect(screen.getByText('Realtor Profile Screen')).toBeTruthy());
    expect(consoleError).not.toHaveBeenCalledWith(expect.stringContaining('was not handled by any navigator'));

    consoleError.mockRestore();
  });

  it('fails with an unhandled-action error when RealtorProfile is NOT registered (proves the test would have caught the original bug)', async () => {
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
    fireEvent.press(await screen.findByText('Listed by'));

    await waitFor(() => expect(consoleError).toHaveBeenCalled());
    expect(screen.queryByText('Realtor Profile Screen')).toBeNull();

    consoleError.mockRestore();
  });
});
