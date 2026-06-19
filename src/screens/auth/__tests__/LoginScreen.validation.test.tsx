import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useDispatch, useSelector } from 'react-redux';

import LoginScreen from '../LoginScreen';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;
const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;

describe('LoginScreen identifier validation', () => {
  it('rejects malformed identifiers before requesting an OTP', async () => {
    const dispatch = jest.fn();
    mockUseDispatch.mockReturnValue(dispatch);
    mockUseSelector.mockImplementation((selector: any) =>
      selector({ auth: { loading: false, error: null } }),
    );

    const screen = render(<LoginScreen navigation={{ navigate: jest.fn() } as any} />);

    fireEvent.changeText(
      screen.getByPlaceholderText('Enter your email or phone'),
      'not-an-email-or-phone',
    );
    fireEvent.press(screen.getByText('Continue with OTP'));

    await waitFor(() => {
      expect(screen.getByText('Enter valid email or phone')).toBeTruthy();
    });
    expect(dispatch).not.toHaveBeenCalled();
  });
});

/**
 * Bug 14 regression guard — switching between OTP and password mode must call
 * clearError() so a stale server error from one mode is not visible in the other.
 */
describe('LoginScreen mode switch clears stale error (Bug 14)', () => {
  it('dispatches clearError when the mode toggle button is pressed', async () => {
    const dispatch = jest.fn();
    mockUseDispatch.mockReturnValue(dispatch);
    mockUseSelector.mockImplementation((selector: any) =>
      selector({ auth: { loading: false, error: 'Invalid credentials' } }),
    );

    const screen = render(<LoginScreen navigation={{ navigate: jest.fn() } as any} />);

    // Default mode is OTP — toggle to password
    fireEvent.press(screen.getByText('Login with password'));

    // clearError action creator returns { type: 'auth/clearError' }
    const clearErrorCall = dispatch.mock.calls.find(
      ([action]: any[]) => action?.type === 'auth/clearError'
    );
    expect(clearErrorCall).toBeDefined();
  });

  it('dispatches clearError when switching back from password to OTP', async () => {
    const dispatch = jest.fn().mockReturnValue({ type: '' });
    mockUseDispatch.mockReturnValue(dispatch);
    mockUseSelector.mockImplementation((selector: any) =>
      selector({ auth: { loading: false, error: null } }),
    );

    const screen = render(<LoginScreen navigation={{ navigate: jest.fn() } as any} />);

    // Switch to password first
    fireEvent.press(screen.getByText('Login with password'));
    dispatch.mockClear();

    // Then back to OTP — clearError must fire again
    fireEvent.press(screen.getByText('Use OTP instead'));
    const clearErrorCall = dispatch.mock.calls.find(
      ([action]: any[]) => action?.type === 'auth/clearError'
    );
    expect(clearErrorCall).toBeDefined();
  });
});
