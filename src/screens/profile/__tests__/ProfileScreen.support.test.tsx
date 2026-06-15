import React from 'react';
import { Alert, Linking } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useDispatch, useSelector } from 'react-redux';
import ProfileScreen from '../ProfileScreen';

jest.mock('react-redux', () => ({ useDispatch: jest.fn(), useSelector: jest.fn() }));

describe('ProfileScreen support email', () => {
  const mockUser = () => {
    (useDispatch as unknown as jest.Mock).mockReturnValue(jest.fn());
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => selector({
      auth: { user: { firstName: 'Demo', lastName: 'Buyer', email: 'buyer@example.com', roles: ['BUYER'] } },
    }));
  };

  it('opens the support address and shows the address when no mail app is available', async () => {
    mockUser();
    jest.spyOn(Linking, 'openURL').mockRejectedValueOnce(new Error('no mail app'));
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    const screen = render(<ProfileScreen navigation={{ navigate: jest.fn() }} />);

    fireEvent.press(screen.getByText('Help & Support'));
    const actions = alert.mock.calls[0][2] as any[];
    actions.find((action) => action.text === 'Email Us').onPress();

    expect(Linking.openURL).toHaveBeenCalledWith(
      'mailto:support@propertyapp.com?subject=Help%20%26%20Support'
    );
    await waitFor(() => expect(alert).toHaveBeenCalledWith(
      'Email Us',
      'Send an email to:\nsupport@propertyapp.com'
    ));
  });

  it('opens notifications on the root stack instead of the profile stack', () => {
    mockUser();
    const root = { navigate: jest.fn(), getParent: jest.fn(() => undefined) };
    const tabs = { getParent: jest.fn(() => root) };
    const profile = { navigate: jest.fn(), getParent: jest.fn(() => tabs) };
    const screen = render(<ProfileScreen navigation={profile} />);

    fireEvent.press(screen.getByText('Notifications'));
    expect(root.navigate).toHaveBeenCalledWith('Notifications');
    expect(profile.navigate).not.toHaveBeenCalled();
  });
});
