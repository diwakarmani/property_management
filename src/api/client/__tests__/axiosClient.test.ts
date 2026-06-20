import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import axiosClient from '../axiosClient';
import { saveTokens, getAccessToken, getRefreshToken } from '@/utils/helpers/storage';

describe('axiosClient', () => {
  let mock: MockAdapter;
  let globalAxiosMock: MockAdapter;

  beforeEach(async () => {
    mock = new MockAdapter(axiosClient);

    globalAxiosMock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.restore();
    globalAxiosMock.restore();
  });

  it('refreshes the access token on 401 and retries the original request (UT-AXIOS-REFRESH)', async () => {
    await saveTokens('expired-access', 'valid-refresh');

    let callCount = 0;
    mock.onGet('/api/users/me').reply(() => {
      callCount += 1;
      if (callCount === 1) {
        return [401, { success: false, message: 'expired', status: 401 }];
      }
      return [200, { success: true, data: { id: 1, email: 'a@b.com', roles: ['BUYER'] } }];
    });

    globalAxiosMock.onPost(/\/api\/auth\/refresh-token$/).reply(200, {
      success: true,
      data: { accessToken: 'new-access', refreshToken: 'new-refresh' },
    });

    const response = await axiosClient.get('/api/users/me');

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({ success: true });
    expect(callCount).toBe(2);
    expect(await getAccessToken()).toBe('new-access');
    expect(await getRefreshToken()).toBe('new-refresh');
  });

  it('clears stored tokens and rejects when the refresh call fails', async () => {
    await saveTokens('expired-access', 'stale-refresh');

    mock.onGet('/api/users/me').reply(401, { message: 'expired', status: 401 });
    globalAxiosMock.onPost(/\/api\/auth\/refresh-token$/).reply(401, { message: 'invalid refresh', status: 401 });

    await expect(axiosClient.get('/api/users/me')).rejects.toBeDefined();

    expect(await getAccessToken()).toBeNull();
    expect(await getRefreshToken()).toBeNull();
  });

  it('does not attempt a refresh when the failing call is itself an auth endpoint', async () => {
    await saveTokens('any-access', 'any-refresh');

    mock.onPost('/api/auth/login-with-identifier').reply(401, { message: 'bad creds' });

    await expect(
      axiosClient.post('/api/auth/login-with-identifier', { identifier: 'x', password: 'y' })
    ).rejects.toBeDefined();

    expect(globalAxiosMock.history.post.length).toBe(0);
  });
});
