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
