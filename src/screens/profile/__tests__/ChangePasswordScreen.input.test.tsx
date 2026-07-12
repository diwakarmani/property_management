import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import ChangePasswordScreen from '../ChangePasswordScreen';
import { UserService } from '@/api/services/user.service';

jest.mock('@/api/services/user.service', () => ({
  UserService: { changePassword: jest.fn() },
}));

describe('ChangePasswordScreen', () => {
  it('keeps the first character and submits the exact current password', async () => {
    (UserService.changePassword as jest.Mock).mockResolvedValue({});
    const navigation = { goBack: jest.fn() };
    const screen = render(<ChangePasswordScreen navigation={navigation} />);

    const current = screen.getByPlaceholderText('Enter current password');
    fireEvent.changeText(current, 'x');
    expect(current.props.value).toBe('x');
    fireEvent.changeText(screen.getByPlaceholderText('Min 8 characters'), 'NewPass1!');
    fireEvent.changeText(screen.getByPlaceholderText('Re-enter new password'), 'NewPass1!');
    fireEvent.press(screen.getByText('Update Password'));

    await waitFor(() => expect(UserService.changePassword)
      .toHaveBeenCalledWith('x', 'NewPass1!', 'NewPass1!'));
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('preserves the typed value when the eye icon is toggled (Bug 5)', () => {
    const navigation = { goBack: jest.fn() };
    const screen = render(<ChangePasswordScreen navigation={navigation} />);

    const current = screen.getByPlaceholderText('Enter current password');
    fireEvent.changeText(current, 'secret123');
    expect(current.props.value).toBe('secret123');

    fireEvent.press(screen.getByLabelText('Toggle Current Password visibility'));

    // iOS fires a spurious onChangeText('') immediately after secureTextEntry toggles —
    // simulate that here and assert the guard suppresses it instead of wiping the field.
    fireEvent.changeText(current, '');
    expect(current.props.value).toBe('secret123');

    // A real subsequent edit (non-empty) must still go through normally.
    fireEvent.changeText(current, 'secret1234');
    expect(current.props.value).toBe('secret1234');
  });
});
