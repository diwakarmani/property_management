import MockAdapter from 'axios-mock-adapter';
import axiosClient from '../../client/axiosClient';
import { GroupService } from '../group.service';

/**
 * Unit tests for GroupService — verifies URL/method/param contracts
 * for the new listing management endpoints added in the group admin flow.
 */
describe('GroupService', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosClient);
  });
  afterEach(() => mock.restore());

  // ── Listings ────────────────────────────────────────────────────────────

  it('getPendingListings() GETs /api/group-admin/listings/pending with page/size', async () => {
    mock.onGet('/api/group-admin/listings/pending').reply((config) => {
      expect(config.params).toEqual({ page: 0, size: 50 });
      return [200, { success: true, data: { content: [], totalElements: 0 } }];
    });
    const res = await GroupService.getPendingListings(0, 50);
    expect(res.status).toBe(200);
  });

  it('getAllListings() GETs /api/group-admin/listings with page/size', async () => {
    mock.onGet('/api/group-admin/listings').reply((config) => {
      expect(config.params).toEqual({ page: 0, size: 50 });
      return [200, { success: true, data: { content: [], totalElements: 0 } }];
    });
    const res = await GroupService.getAllListings(0, 50);
    expect(res.status).toBe(200);
  });

  it('approveListing() POSTs /api/group-admin/listings/{id}/approve', async () => {
    mock.onPost('/api/group-admin/listings/42/approve').reply(200, {
      success: true, data: 'Listing approved', message: 'Listing approved and now live',
    });
    const res = await GroupService.approveListing(42);
    expect(res.status).toBe(200);
  });

  it('rejectListing() POSTs /api/group-admin/listings/{id}/reject with reason', async () => {
    mock.onPost('/api/group-admin/listings/42/reject').reply((config) => {
      const body = JSON.parse(config.data);
      expect(body.reason).toBe('Missing photos');
      return [200, { success: true, data: 'Rejected' }];
    });
    const res = await GroupService.rejectListing(42, 'Missing photos');
    expect(res.status).toBe(200);
  });

  // ── Realtor management ───────────────────────────────────────────────────

  it('createRealtor() POSTs /api/group-admin/realtors with full request', async () => {
    const req = {
      firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com',
      password: 'Pass@123', commissionPercent: 5, monthlyTarget: 3,
    };
    mock.onPost('/api/group-admin/realtors').reply((config) => {
      const body = JSON.parse(config.data);
      expect(body.email).toBe('jane@test.com');
      return [201, { success: true, data: { userId: 99, email: 'jane@test.com' } }];
    });
    const res = await GroupService.createRealtor(req);
    expect(res.status).toBe(201);
  });

  it('activateMember() PATCHes /api/group-admin/members/{id}/activate', async () => {
    mock.onPatch('/api/group-admin/members/77/activate').reply(200, {
      success: true, data: { userId: 77, active: true },
    });
    const res = await GroupService.activateMember(77);
    expect(res.status).toBe(200);
  });

  it('removeMember() DELETEs /api/group-admin/members/{id}', async () => {
    mock.onDelete('/api/group-admin/members/77').reply(200, {
      success: true, data: 'Member removed',
    });
    const res = await GroupService.removeMember(77);
    expect(res.status).toBe(200);
  });

  it('updateMemberSettings() PATCHes /api/group-admin/members/{id}/settings', async () => {
    mock.onPatch('/api/group-admin/members/77/settings').reply((config) => {
      const body = JSON.parse(config.data);
      expect(body.commissionPercent).toBe(7.5);
      return [200, { success: true, data: { userId: 77 } }];
    });
    const res = await GroupService.updateMemberSettings(77, { commissionPercent: 7.5 });
    expect(res.status).toBe(200);
  });
});
