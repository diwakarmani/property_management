import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import MockAdapter from 'axios-mock-adapter';
import axiosClient from '@/api/client/axiosClient';
import ManageUsersScreen from '../ManageUsersScreen';

let mockAxios: MockAdapter;

const pageOf = (users: object[]) => ({
  success: true,
  data: { content: users, totalElements: users.length, totalPages: 1, page: 0, size: 20, last: true },
});

const buyer = {
  id: 1,
  email: 'buyer@example.com',
  firstName: 'Alice',
  lastName: 'Buyer',
  roles: ['BUYER'],
  emailVerified: true,
  locked: false,
  isActive: true,
};

const realtor = {
  id: 2,
  email: 'realtor@example.com',
  firstName: 'Bob',
  lastName: 'Realtor',
  roles: ['REALTOR'],
  emailVerified: true,
  locked: false,
  isActive: true,
};

describe('ManageUsersScreen — server-side role filter (Bug 38)', () => {
  beforeEach(() => {
    mockAxios = new MockAdapter(axiosClient);
  });
  afterEach(() => mockAxios.restore());

  it('calls GET /api/users without a role param when no roleFilter is provided', async () => {
    mockAxios.onGet('/api/users').reply(200, pageOf([buyer, realtor]));

    render(<ManageUsersScreen route={{ params: {} }} />);

    await waitFor(() =>
      expect(mockAxios.history.get.some(r => r.url === '/api/users')).toBe(true)
    );

    const req = mockAxios.history.get.find(r => r.url === '/api/users');
    expect(req?.params?.role).toBeUndefined();
  });

  it('calls GET /api/users?role=BUYER when roleFilter is BUYER', async () => {
    mockAxios.onGet('/api/users').reply(200, pageOf([buyer]));

    render(<ManageUsersScreen route={{ params: { roleFilter: 'BUYER' } }} />);

    await waitFor(() =>
      expect(mockAxios.history.get.some(r => r.url === '/api/users')).toBe(true)
    );

    const req = mockAxios.history.get.find(r => r.url === '/api/users');
    expect(req?.params?.role).toBe('BUYER');
  });

  it('calls GET /api/users?role=REALTOR when roleFilter is REALTOR', async () => {
    mockAxios.onGet('/api/users').reply(200, pageOf([realtor]));

    render(<ManageUsersScreen route={{ params: { roleFilter: 'REALTOR' } }} />);

    await waitFor(() =>
      expect(mockAxios.history.get.some(r => r.url === '/api/users')).toBe(true)
    );

    const req = mockAxios.history.get.find(r => r.url === '/api/users');
    expect(req?.params?.role).toBe('REALTOR');
  });

  it('renders user cards from the server response without additional client-side filtering', async () => {

    mockAxios.onGet('/api/users').reply(200, pageOf([buyer, realtor]));

    const screen = render(<ManageUsersScreen route={{ params: {} }} />);

    await waitFor(() => expect(screen.getByText('Alice Buyer')).toBeTruthy());
    expect(screen.getByText('Bob Realtor')).toBeTruthy();
  });
});
