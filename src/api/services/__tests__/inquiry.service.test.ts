import MockAdapter from 'axios-mock-adapter';
import axiosClient from '../../client/axiosClient';
import { InquiryService } from '../inquiry.service';

describe('InquiryService', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosClient);
  });
  afterEach(() => mock.restore());

  it('create() POSTs /api/inquiries with the full request body', async () => {
    mock.onPost('/api/inquiries').reply((config) => {
      const body = JSON.parse(config.data);
      expect(body).toEqual({
        propertyId: 99,
        name: 'Buyer One',
        email: 'buyer@test.local',
        phone: '+1-555-0100',
        message: 'Please share more details about this property.',
      });
      return [
        201,
        {
          success: true,
          data: {
            id: 1,
            propertyId: 99,
            propertyTitle: 'Sample',
            inquirerId: 11,
            name: 'Buyer One',
            email: 'buyer@test.local',
            phone: '+1-555-0100',
            message: 'Please share more details about this property.',
            status: 'NEW',
            createdAt: '2026-05-29T17:00:00',
          },
        },
      ];
    });

    const res = await InquiryService.create({
      propertyId: 99,
      name: 'Buyer One',
      email: 'buyer@test.local',
      phone: '+1-555-0100',
      message: 'Please share more details about this property.',
    });

    expect(res.status).toBe(201);
    expect(res.data.data.id).toBe(1);
    expect(res.data.data.status).toBe('NEW');
  });

  it('getReceived() GETs /api/inquiries/received with paging params', async () => {
    mock.onGet('/api/inquiries/received').reply((config) => {
      expect(config.params).toEqual({ page: 0, size: 20 });
      return [
        200,
        {
          success: true,
          data: {
            content: [],
            pageNumber: 0,
            pageSize: 20,
            totalElements: 0,
            totalPages: 0,
            first: true,
            last: true,
            empty: true,
          },
        },
      ];
    });

    const res = await InquiryService.getReceived();
    expect(res.status).toBe(200);
    expect(res.data.data.empty).toBe(true);
  });

  it('getSent() GETs /api/inquiries/sent', async () => {
    mock.onGet('/api/inquiries/sent').reply(200, {
      success: true,
      data: { content: [], totalElements: 0 },
    });
    const res = await InquiryService.getSent(2, 10);
    expect(res.status).toBe(200);
  });

  it('updateStatus() PATCHes /api/inquiries/{id}/status with status query param', async () => {
    mock.onPatch('/api/inquiries/7/status').reply((config) => {
      expect(config.params).toEqual({ status: 'CONTACTED' });
      return [
        200,
        {
          success: true,
          data: {
            id: 7,
            propertyId: 99,
            propertyTitle: 'Sample',
            inquirerId: 11,
            name: 'X',
            email: 'x@x.com',
            message: 'm',
            status: 'CONTACTED',
            createdAt: 'now',
          },
        },
      ];
    });

    const res = await InquiryService.updateStatus(7, 'CONTACTED');
    expect(res.data.data.status).toBe('CONTACTED');
  });
});
