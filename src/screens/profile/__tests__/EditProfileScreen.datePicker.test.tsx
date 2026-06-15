import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useDispatch, useSelector } from 'react-redux';

import EditProfileScreen from '../EditProfileScreen';
import { UserService } from '@/api/services/user.service';

jest.mock('react-redux', () => ({ useDispatch: jest.fn(), useSelector: jest.fn() }));
jest.mock('@/api/services/user.service', () => ({
  UserService: { updateMe: jest.fn() },
}));
jest.mock('@/store/slices/authSlice', () => ({
  fetchUser: jest.fn(() => ({ type: 'auth/fetchUser' })),
}));

describe('EditProfileScreen date of birth calendar', () => {
  it('selects a calendar date and submits the ISO value', async () => {
    const dispatch = jest.fn().mockResolvedValue(undefined);
    (useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => selector({
      auth: {
        user: {
          email: 'buyer@propertyapp.com',
          firstName: 'Buyer',
          lastName: 'User',
          roles: ['BUYER'],
          dateOfBirth: '2002-12-19',
        },
      },
    }));
    (UserService.updateMe as jest.Mock).mockResolvedValue({});
    const navigation = { goBack: jest.fn() };
    const screen = render(<EditProfileScreen navigation={navigation} />);

    fireEvent.press(screen.getByLabelText('Choose date of birth'));
    expect(screen.getByLabelText('Date of birth calendar')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Select 2002-12-20'));
    fireEvent.press(screen.getByText('Save Changes'));

    await waitFor(() => expect(UserService.updateMe).toHaveBeenCalledWith(
      expect.objectContaining({ dateOfBirth: '2002-12-20' }),
    ));
    expect(navigation.goBack).toHaveBeenCalled();
  });
});
