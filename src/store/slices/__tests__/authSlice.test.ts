import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  fetchUser,
  bootstrapSession,
  login,
  logout,
} from '../authSlice';
import { queryClient } from '@/api/queryClient';
import { remove } from '@/utils/helpers/storage';

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
  });
});
