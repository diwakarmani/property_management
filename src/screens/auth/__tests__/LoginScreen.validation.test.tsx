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

describe('LoginScreen mode switch clears stale error (Bug 14)', () => {
  it('dispatches clearError when the mode toggle button is pressed', async () => {
    const dispatch = jest.fn();
    mockUseDispatch.mockReturnValue(dispatch);
    mockUseSelector.mockImplementation((selector: any) =>
      selector({ auth: { loading: false, error: 'Invalid credentials' } }),
    );

    const screen = render(<LoginScreen navigation={{ navigate: jest.fn() } as any} />);

    fireEvent.press(screen.getByText('Login with password'));

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

    fireEvent.press(screen.getByText('Login with password'));
    dispatch.mockClear();

    fireEvent.press(screen.getByText('Use OTP instead'));
    const clearErrorCall = dispatch.mock.calls.find(
      ([action]: any[]) => action?.type === 'auth/clearError'
    );
    expect(clearErrorCall).toBeDefined();
  });
});
