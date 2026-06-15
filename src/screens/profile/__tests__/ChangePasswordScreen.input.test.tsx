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
});
