import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useDispatch, useSelector } from 'react-redux';

import EditProfileScreen from '../EditProfileScreen';
import { UserService } from '@/api/services/user.service';
import { fetchUser } from '@/store/slices/authSlice';

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

const setup = (overrides?: Partial<typeof MOCK_USER>) => {
  const dispatch = jest.fn().mockResolvedValue(undefined);
  (useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
  (useSelector as unknown as jest.Mock).mockImplementation((selector: any) =>
    selector({ auth: { user: { ...MOCK_USER, ...overrides } } })
  );
  const navigation = { goBack: jest.fn() };
  return { dispatch, navigation };
};

/**
 * Bug 26 regression guard — EditProfileScreen save must:
 *   1. Call UserService.updateMe() with the correct PUT payload.
 *   2. Dispatch fetchUser() immediately after a successful save so the Redux
 *      store (and profile header) shows the updated name.
 *   3. Disable the save button while isSubmitting is true to prevent double-taps
 *      from firing multiple concurrent PUT requests.
 */
describe('EditProfileScreen save flow (Bug 26)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (UserService.updateMe as jest.Mock).mockResolvedValue({});
  });

  it('calls UserService.updateMe with the correct payload on save', async () => {
    const { navigation } = setup();
    const screen = render(<EditProfileScreen navigation={navigation} />);

    fireEvent.changeText(screen.getByDisplayValue('Alice'), 'Alicia');
    fireEvent.press(screen.getByLabelText('Save changes'));

    await waitFor(() =>
      expect(UserService.updateMe).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'Alicia', lastName: 'Smith' })
      )
    );
  });

  it('dispatches fetchUser after a successful save to refresh the Redux user', async () => {
    const { dispatch, navigation } = setup();
    const screen = render(<EditProfileScreen navigation={navigation} />);

    fireEvent.press(screen.getByLabelText('Save changes'));

    await waitFor(() => expect(UserService.updateMe).toHaveBeenCalled());
    expect(fetchUser).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth/fetchUser' }));
  });

  it('navigates back after a successful save', async () => {
    const { navigation } = setup();
    const screen = render(<EditProfileScreen navigation={navigation} />);

    fireEvent.press(screen.getByLabelText('Save changes'));

    await waitFor(() => expect(navigation.goBack).toHaveBeenCalled());
  });

  it('disables the save button while the PUT request is in-flight (prevents double-tap)', async () => {
    let resolvePut!: () => void;
    (UserService.updateMe as jest.Mock).mockReturnValue(
      new Promise<void>((res) => { resolvePut = res; })
    );

    const { navigation } = setup();
    const screen = render(<EditProfileScreen navigation={navigation} />);

    // Tap once — starts the in-flight request
    fireEvent.press(screen.getByLabelText('Save changes'));

    // The button must be disabled before the promise resolves
    await waitFor(() =>
      expect(screen.getByLabelText('Save changes').props.accessibilityState?.disabled).toBe(true)
    );

    // Tap again while in-flight — must NOT fire a second PUT
    try { fireEvent.press(screen.getByLabelText('Save changes')); } catch { /* disabled elements may throw */ }

    await act(async () => { resolvePut(); });

    // Only one call total
    expect(UserService.updateMe).toHaveBeenCalledTimes(1);
  });

  it('does NOT navigate back when UserService.updateMe rejects', async () => {
    (UserService.updateMe as jest.Mock).mockRejectedValue(
      Object.assign(new Error('Server error'), { response: { status: 400, data: { message: 'Invalid data' } } })
    );

    const { navigation } = setup();
    const screen = render(<EditProfileScreen navigation={navigation} />);

    fireEvent.press(screen.getByLabelText('Save changes'));

    await waitFor(() => expect(UserService.updateMe).toHaveBeenCalled());
    // goBack must NOT be called — user stays on the screen with the form
    expect(navigation.goBack).not.toHaveBeenCalled();
    // fetchUser must NOT be called either — only called on success
    expect(fetchUser).not.toHaveBeenCalled();
  });

  it('omits undefined optional fields from the PUT payload (no null bleed)', async () => {
    const { navigation } = setup({ bio: '', occupation: '', website: '', phone: '' });
    const screen = render(<EditProfileScreen navigation={navigation} />);

    fireEvent.press(screen.getByLabelText('Save changes'));

    await waitFor(() => expect(UserService.updateMe).toHaveBeenCalled());

    const payload = (UserService.updateMe as jest.Mock).mock.calls[0][0];
    // Empty strings → undefined → must be absent from the PUT body
    expect(payload.bio).toBeUndefined();
    expect(payload.occupation).toBeUndefined();
    expect(payload.website).toBeUndefined();
    expect(payload.phone).toBeUndefined();
  });
});
