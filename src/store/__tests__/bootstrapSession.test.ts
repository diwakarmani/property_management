import axios from 'axios';
import { configureStore } from '@reduxjs/toolkit';
import MockAdapter from 'axios-mock-adapter';
import axiosClient from '@/api/client/axiosClient';
import authReducer, { bootstrapSession } from '@/store/slices/authSlice';
import { saveTokens, clearTokens, getAccessToken } from '@/utils/helpers/storage';

/**
 * IT-BOOT-SESSION (gap analysis §15.4) — a stored session token is restored on
 * app boot without bouncing the user to Login.
 */
describe('bootstrapSession (NB-03)', () => {
  let mock: MockAdapter;

  const makeStore = () =>
    configureStore({ reducer: { auth: authReducer } });

  beforeEach(() => {
    mock = new MockAdapter(axiosClient);
  });

  afterEach(async () => {
    mock.restore();
    await clearTokens();
  });

  it('with a stored token + a working /me, lands authenticated and bootstrapped', async () => {
    await saveTokens('valid-access', 'valid-refresh');
    mock.onGet('/api/users/me').reply(200, {
      success: true,
      data: {
        id: 7,
        email: 'realtor@test.example.com',
        firstName: 'Test',
        lastName: 'Realtor',
        roles: ['REALTOR'],
      },
    });

    const store = makeStore();
    await store.dispatch(bootstrapSession() as any);

    const state = store.getState().auth;
    expect(state.bootstrapped).toBe(true);
    expect(state.isAuthenticated).toBe(true);
    expect(state.bootstrapFailed).toBe(false);
    expect(state.user).toMatchObject({
      id: 7,
      email: 'realtor@test.example.com',
      roles: ['REALTOR'],
    });
  });

  it('with NO stored token, completes bootstrap as unauthenticated (routes to Login)', async () => {
    // No saveTokens — storage is empty.
    const store = makeStore();
    await store.dispatch(bootstrapSession() as any);

    const state = store.getState().auth;
    expect(state.bootstrapped).toBe(true);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.bootstrapFailed).toBe(false);
  });

  it('with a token but /me returning 401, clears tokens and routes to Login', async () => {
    await saveTokens('expired-access', 'expired-refresh');
    // /me 401; axios interceptor will try to refresh — make the refresh fail too.
    mock.onGet('/api/users/me').reply(401, { message: 'expired', status: 401 });

    // Mock refresh on the global axios (used by axiosClient interceptor).
    const globalMock = new MockAdapter(axios);
    globalMock.onPost(/\/api\/auth\/refresh-token$/).reply(401, { message: 'bad refresh' });

    const store = makeStore();
    await store.dispatch(bootstrapSession() as any);

    const state = store.getState().auth;
    expect(state.bootstrapped).toBe(true);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    // Tokens were cleared by the interceptor on refresh failure.
    expect(await getAccessToken()).toBeNull();

    globalMock.restore();
  });
});
