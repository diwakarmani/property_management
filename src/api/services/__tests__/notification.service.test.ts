import MockAdapter from 'axios-mock-adapter';
import axiosClient from '../../client/axiosClient';
import { NotificationService } from '../notification.service';

/**
 * Unit tests for the notification service URL/method/unwrap contract (RF-06).
 * Uses axios-mock-adapter against the real axiosClient instance.
 */
describe('NotificationService', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosClient);
  });
  afterEach(() => mock.restore());

  it('list() GETs /api/notifications with paging params', async () => {
    mock.onGet('/api/notifications').reply((config) => {
      expect(config.params).toEqual({ page: 1, size: 5 });
      return [200, { success: true, data: { content: [], totalElements: 0 } }];
    });

    const res = await NotificationService.list(1, 5);
    expect(res.status).toBe(200);
    expect(res.data.data.content).toEqual([]);
  });

  it('unreadCount() GETs /api/notifications/unread-count', async () => {
    mock.onGet('/api/notifications/unread-count').reply(200, {
      success: true,
      data: { count: 3 },
    });

    const res = await NotificationService.unreadCount();
    expect(res.data.data.count).toBe(3);
  });

  it('markRead(id) PATCHes /api/notifications/{id}/read', async () => {
    mock.onPatch('/api/notifications/42/read').reply(200, {
      success: true,
      data: { id: 42, type: 'T', title: 't', read: true, createdAt: 'now' },
    });

    const res = await NotificationService.markRead(42);
    expect(res.data.data.read).toBe(true);
  });

  it('markAllRead() POSTs /api/notifications/mark-all-read and returns updated count', async () => {
    mock.onPost('/api/notifications/mark-all-read').reply(200, {
      success: true,
      data: { updated: 5 },
    });

    const res = await NotificationService.markAllRead();
    expect(res.data.data.updated).toBe(5);
  });
});
