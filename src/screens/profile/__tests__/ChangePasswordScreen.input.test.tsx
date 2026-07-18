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

  describe('eye-icon double-toggle race condition (live-reproduced on device)', () => {
    // The guard used to be armed inside a useEffect keyed on `show`, which only runs after the
    // render commits. A fast second tap's native side-effect could fire before that effect had
    // a chance to re-arm the guard, and the first toggle's own pending timeout could expire
    // mid-race and disarm it early — reopening the exact gap this component exists to close.
    // Live-verified on the iPhone 17 simulator: two rapid taps on the eye icon followed by more
    // typing wiped everything typed before the toggles, keeping only the new characters.
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('keeps suppressing spurious onChangeText("") through the full window after a second toggle 30ms after the first', () => {
      const navigation = { goBack: jest.fn() };
      const screen = render(<ChangePasswordScreen navigation={navigation} />);
      const current = screen.getByPlaceholderText('Enter current password');
      fireEvent.changeText(current, 'ABCDEFGH');

      const eyeButton = screen.getByLabelText('Toggle Current Password visibility');
      fireEvent.press(eyeButton); // toggle #1 at t=0
      jest.advanceTimersByTime(30);
      fireEvent.press(eyeButton); // toggle #2 at t=30

      // t=101 overall (71ms after the second toggle) — the buggy version's FIRST timeout
      // (armed at t=0, firing at t=100) would have already cleared the guard here.
      jest.advanceTimersByTime(71);
      fireEvent.changeText(current, '');

      expect(current.props.value).toBe('ABCDEFGH');
    });

    it('still lets a real onChangeText("") through once the full 100ms window after the LAST toggle has elapsed', () => {
      const navigation = { goBack: jest.fn() };
      const screen = render(<ChangePasswordScreen navigation={navigation} />);
      const current = screen.getByPlaceholderText('Enter current password');
      fireEvent.changeText(current, 'ABCDEFGH');

      fireEvent.press(screen.getByLabelText('Toggle Current Password visibility'));
      jest.advanceTimersByTime(150);
      fireEvent.changeText(current, '');

      expect(current.props.value).toBe('');
    });
  });
});
