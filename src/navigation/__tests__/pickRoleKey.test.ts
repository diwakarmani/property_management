import { pickRoleKey } from '../AppNavigator';

/**
 * Pure-function unit tests for the role-routing selector (gap analysis §15.4 IT-NAV-ROLES).
 * Verifies that every role lands on its intended navigator key — including the previously
 * broken Seller case where SELLER fell through to the Buyer tab navigator (KB-02).
 */
describe('pickRoleKey', () => {
  it('routes SUPER_ADMIN to admin', () => {
    expect(pickRoleKey(['SUPER_ADMIN'])).toBe('admin');
  });

  it('routes REALTOR_GROUP_ADMIN to groupAdmin', () => {
    expect(pickRoleKey(['REALTOR_GROUP_ADMIN'])).toBe('groupAdmin');
  });

  it('routes REALTOR to realtor', () => {
    expect(pickRoleKey(['REALTOR'])).toBe('realtor');
  });

  it('routes SELLER to seller (KB-02 regression)', () => {
    expect(pickRoleKey(['SELLER'])).toBe('seller');
  });

  it('routes BUYER to buyer (default tab navigator)', () => {
    expect(pickRoleKey(['BUYER'])).toBe('buyer');
  });

  it('defaults to buyer when no roles are present', () => {
    expect(pickRoleKey([])).toBe('buyer');
    expect(pickRoleKey(undefined)).toBe('buyer');
    expect(pickRoleKey(null)).toBe('buyer');
  });

  it('picks the highest-privilege role first when multiple are present', () => {
    expect(pickRoleKey(['BUYER', 'SUPER_ADMIN'])).toBe('admin');
    expect(pickRoleKey(['REALTOR', 'REALTOR_GROUP_ADMIN'])).toBe('groupAdmin');
    expect(pickRoleKey(['SELLER', 'REALTOR'])).toBe('realtor');
    expect(pickRoleKey(['BUYER', 'SELLER'])).toBe('seller');
  });

  it('ignores unknown roles and falls back to buyer', () => {
    expect(pickRoleKey(['FAKE_ROLE'])).toBe('buyer');
  });
});
