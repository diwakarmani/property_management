import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { render } from '@testing-library/react-native';
import { useDispatch, useSelector } from 'react-redux';

import EditProfileScreen from '../EditProfileScreen';

jest.mock('react-redux', () => ({ useDispatch: jest.fn(), useSelector: jest.fn() }));

jest.mock('@/api/services/user.service', () => ({
  UserService: { updateMe: jest.fn() },
}));

jest.mock('@/store/slices/authSlice', () => ({
  fetchUser: jest.fn(() => ({ type: 'auth/fetchUser' })),
}));

const MOCK_USER = {
  email: 'buyer@propertyapp.com',
  firstName: 'Alice',
  lastName: 'Smith',
  phone: '+1555000001',
  bio: '',
  dateOfBirth: '',
  occupation: '',
  website: '',
  roles: ['BUYER'],
};

const setup = () => {
  (useDispatch as unknown as jest.Mock).mockReturnValue(jest.fn());
  (useSelector as unknown as jest.Mock).mockImplementation((selector: any) =>
    selector({ auth: { user: MOCK_USER } })
  );
  return { navigation: { goBack: jest.fn() } };
};

describe('EditProfileScreen keyboard behavior (Bug 2)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses the "padding" KeyboardAvoidingView behavior on iOS so the growing multiline Bio field stays visible', () => {
    Platform.OS = 'ios';
    const { navigation } = setup();
    const screen = render(<EditProfileScreen navigation={navigation} />);

    const kav = screen.UNSAFE_getByType(KeyboardAvoidingView);
    expect(kav.props.behavior).toBe('padding');
  });

  it('uses the "height" KeyboardAvoidingView behavior on Android', () => {
    Platform.OS = 'android';
    const { navigation } = setup();
    const screen = render(<EditProfileScreen navigation={navigation} />);

    const kav = screen.UNSAFE_getByType(KeyboardAvoidingView);
    expect(kav.props.behavior).toBe('height');

    Platform.OS = 'ios';
  });
});
