import MockAdapter from 'axios-mock-adapter';
import axiosClient from '@/api/client/axiosClient';
import { NotificationTokenService } from '@/api/services/notificationToken.service';

describe('NotificationTokenService', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosClient);
  });
  afterEach(() => mock.restore());

  it('register() POSTs token + platform to /api/notification-tokens', async () => {
    mock.onPost('/api/notification-tokens').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({
        token: 'ExponentPushToken[device-1]',
        platform: 'ios',
      });
      return [200, { success: true, data: null, message: 'Push token registered' }];
    });

    const res = await NotificationTokenService.register('ExponentPushToken[device-1]', 'ios');
    expect(res.status).toBe(200);
  });

  it('unregister(token) DELETEs the URL-encoded token', async () => {

    mock.onDelete(/\/api\/notification-tokens\/.+/).reply(200, {
      success: true,
      data: null,
      message: 'Push token unregistered',
    });

    const tokenWithBrackets = 'ExponentPushToken[device-2]';
    const res = await NotificationTokenService.unregister(tokenWithBrackets);
    expect(res.status).toBe(200);

    const lastDelete = mock.history.delete[mock.history.delete.length - 1];
    expect(lastDelete.url).toContain(encodeURIComponent(tokenWithBrackets));
  });
});
