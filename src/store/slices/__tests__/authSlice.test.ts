import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  fetchUser,
  bootstrapSession,
  login,
  logout,
  enableBiometric,
  unlockWithBiometrics,
} from '../authSlice';
import { queryClient } from '@/api/queryClient';
import { remove, clearBiometricPreference } from '@/utils/helpers/storage';
import * as biometricService from '@/utils/biometric/biometricService';

jest.mock('@/api/queryClient', () => ({
  queryClient: { clear: jest.fn() },
  queryKeys: {},
  STALE_TIME: {},
}));

jest.mock('@/utils/helpers/storage', () => ({
  saveTokens: jest.fn(),
  clearTokens: jest.fn().mockResolvedValue(undefined),
  getAccessToken: jest.fn().mockResolvedValue(null),
  clearActiveRole: jest.fn().mockResolvedValue(undefined),
  getActiveRole: jest.fn().mockResolvedValue(null),
  saveActiveRole: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue(undefined),
  getBiometricEnabled: jest.fn().mockResolvedValue(false),
  setBiometricEnabled: jest.fn().mockResolvedValue(undefined),
  getBiometricPromptShown: jest.fn().mockResolvedValue(false),
  setBiometricPromptShown: jest.fn().mockResolvedValue(undefined),
  clearBiometricPreference: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/utils/biometric/biometricService', () => ({
  isHardwareAvailable: jest.fn().mockResolvedValue(false),
  isEnrolled: jest.fn().mockResolvedValue(false),
  getSupportedTypes: jest.fn().mockResolvedValue([]),
  authenticate: jest.fn().mockResolvedValue({ success: false, error: 'not mocked' }),
}));

describe('authSlice', () => {
  const initialState = authReducer(undefined, { type: '@@INIT' });

  it('starts unauthenticated and not bootstrapped', () => {
    expect(initialState.isAuthenticated).toBe(false);
    expect(initialState.user).toBeNull();
    expect(initialState.bootstrapped).toBe(false);
    expect(initialState.bootstrapFailed).toBe(false);
  });

  describe('fetchUser', () => {
    it('populates the user and authenticates on fulfilled (NB-02)', () => {
      const payload = {
        id: 7,
        email: 'realtor@propertyapp.com',
        firstName: 'Test',
        lastName: 'Realtor',
        phone: '+10000000000',
        roles: ['REALTOR'],
      };
      const state = authReducer(initialState, fetchUser.fulfilled(payload as any, 'req', undefined));

      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual({
        id: 7,
        email: 'realtor@propertyapp.com',
        firstName: 'Test',
        lastName: 'Realtor',
        phone: '+10000000000',
        profileImageUrl: undefined,
        roles: ['REALTOR'],
      });
      expect(state.loading).toBe(false);
    });

    it('defaults roles to BUYER when the payload has none', () => {
      const state = authReducer(
        initialState,
        fetchUser.fulfilled({ email: 'x@y.com', firstName: 'X', lastName: 'Y' } as any, 'req', undefined)
      );
      expect(state.user?.roles).toEqual(['BUYER']);
    });

    it('sets an error and does not crash on rejected', () => {
      const action = { type: fetchUser.rejected.type, payload: 'Failed to fetch user' };
      const state = authReducer(initialState, action as any);
      expect(state.error).toBe('Failed to fetch user');
      expect(state.loading).toBe(false);
    });
  });

  describe('bootstrapSession', () => {
    it('restores the session when authenticated', () => {
      const state = authReducer(
        initialState,
        bootstrapSession.fulfilled(
          { authenticated: true, user: { email: 'a@b.com', firstName: 'A', lastName: 'B', roles: ['SELLER'] } } as any,
          'req',
          undefined
        )
      );
      expect(state.bootstrapped).toBe(true);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.roles).toEqual(['SELLER']);
    });

    it('marks bootstrapped but unauthenticated when no valid session', () => {
      const state = authReducer(
        initialState,
        bootstrapSession.fulfilled({ authenticated: false } as any, 'req', undefined)
      );
      expect(state.bootstrapped).toBe(true);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('flags bootstrapFailed and marks bootstrapped when retries are exhausted (routes to Login)', () => {
      const state = authReducer(
        initialState,
        { type: bootstrapSession.rejected.type, payload: 'bootstrap-failed' } as any
      );
      expect(state.bootstrapFailed).toBe(true);
      expect(state.bootstrapped).toBe(true);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('login / logout', () => {
    it('authenticates on login.fulfilled', () => {
      const state = authReducer(
        initialState,
        login.fulfilled(
          { email: 'admin@propertyapp.com', firstName: 'Admin', lastName: 'User', roles: ['SUPER_ADMIN'] } as any,
          'req',
          {} as any
        )
      );
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.roles).toEqual(['SUPER_ADMIN']);
    });

    it('clears the session on logout.fulfilled', () => {
      const loggedIn = authReducer(
        initialState,
        login.fulfilled(
          { email: 'a@b.com', firstName: 'A', lastName: 'B', roles: ['BUYER'] } as any,
          'req',
          {} as any
        )
      );
      const state = authReducer(loggedIn, { type: logout.fulfilled.type } as any);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.bootstrapFailed).toBe(false);
    });

    it('calls queryClient.clear() when the logout thunk executes (Bug 9)', async () => {
      const store = configureStore({ reducer: { auth: authReducer } });

      await store.dispatch(logout());

      expect(queryClient.clear).toHaveBeenCalledTimes(1);
    });

    it('clears the persisted selectedLocation key when the logout thunk executes (Bug 14)', async () => {
      const store = configureStore({ reducer: { auth: authReducer } });

      await store.dispatch(logout());

      expect(remove).toHaveBeenCalledWith('selectedLocation');
    });

    it('clears the biometric preference when the logout thunk executes, so a different user on this device gets their own enroll prompt', async () => {
      const store = configureStore({ reducer: { auth: authReducer } });

      await store.dispatch(logout());

      expect(clearBiometricPreference).toHaveBeenCalledTimes(1);
    });
  });

  describe('biometric unlock', () => {
    it('locks the session on bootstrapSession.fulfilled when the stored preference is enabled', () => {
      const state = authReducer(
        initialState,
        bootstrapSession.fulfilled(
          {
            authenticated: true,
            user: { email: 'a@b.com', firstName: 'A', lastName: 'B', roles: ['BUYER'] },
            storedRole: null,
            biometricEnabled: true,
          } as any,
          'req',
          undefined
        )
      );
      expect(state.isAuthenticated).toBe(true);
      expect(state.biometricEnabled).toBe(true);
      expect(state.locked).toBe(true);
    });

    it('does not lock the session when no biometric preference is stored', () => {
      const state = authReducer(
        initialState,
        bootstrapSession.fulfilled(
          {
            authenticated: true,
            user: { email: 'a@b.com', firstName: 'A', lastName: 'B', roles: ['BUYER'] },
            storedRole: null,
            biometricEnabled: false,
          } as any,
          'req',
          undefined
        )
      );
      expect(state.locked).toBe(false);
    });

    it('unlocks on unlockWithBiometrics.fulfilled', () => {
      const locked = { ...initialState, isAuthenticated: true, locked: true, biometricEnabled: true };
      const state = authReducer(
        locked,
        unlockWithBiometrics.fulfilled({ autoDisabled: false } as any, 'req', undefined)
      );
      expect(state.locked).toBe(false);
      expect(state.biometricEnabled).toBe(true);
    });

    it('fails open (unlocks and disables the preference) when hardware/enrollment was revoked at the OS level', () => {
      const locked = { ...initialState, isAuthenticated: true, locked: true, biometricEnabled: true };
      const state = authReducer(
        locked,
        unlockWithBiometrics.fulfilled({ autoDisabled: true } as any, 'req', undefined)
      );
      expect(state.locked).toBe(false);
      expect(state.biometricEnabled).toBe(false);
    });

    it('stays locked and records the error on unlockWithBiometrics.rejected', () => {
      const locked = { ...initialState, isAuthenticated: true, locked: true, biometricEnabled: true };
      const state = authReducer(
        locked,
        { type: unlockWithBiometrics.rejected.type, payload: 'user_cancel' } as any
      );
      expect(state.locked).toBe(true);
      expect(state.biometricError).toBe('user_cancel');
    });

    it('only persists the enabled preference after a real successful scan (enableBiometric.fulfilled)', () => {
      const state = authReducer(initialState, enableBiometric.fulfilled(true as any, 'req', undefined));
      expect(state.biometricEnabled).toBe(true);
      expect(state.biometricPromptShown).toBe(true);
    });

    it('does not enable the preference when the confirm scan fails (enableBiometric.rejected)', () => {
      const state = authReducer(
        initialState,
        { type: enableBiometric.rejected.type, payload: 'user_cancel' } as any
      );
      expect(state.biometricEnabled).toBe(false);
      expect(state.biometricPromptShown).toBe(true);
    });

    it('never flips the preference on a bare enableBiometric() dispatch without a successful authenticate() call', async () => {
      (biometricService.authenticate as jest.Mock).mockResolvedValueOnce({ success: false, error: 'user_cancel' });
      const store = configureStore({ reducer: { auth: authReducer } });

      await store.dispatch(enableBiometric());

      expect(store.getState().auth.biometricEnabled).toBe(false);
    });
  });
});
