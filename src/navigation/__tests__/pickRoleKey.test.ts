import { pickRoleKey, requiresLocationSelection } from '../AppNavigator';

/**
 * Pure-function unit tests for the role-routing selector (gap analysis §15.4 IT-NAV-ROLES).
 * Verifies that every role lands on its intended navigator key — including the previously
 * broken Seller case where SELLER fell through to the Buyer tab navigator (KB-02).
 */
describe('pickRoleKey', () => {
  it('routes SUPER_ADMIN to admin', () => {
    expect(pickRoleKey(['SUPER_ADMIN'])).toBe('admin');
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
    expect(pickRoleKey(['SELLER', 'REALTOR'])).toBe('realtor');
    expect(pickRoleKey(['BUYER', 'SELLER'])).toBe('seller');
  });

  it('ignores unknown roles and falls back to buyer', () => {
    expect(pickRoleKey(['FAKE_ROLE'])).toBe('buyer');
  });
});

describe('requiresLocationSelection', () => {
  it('only gates buyer sessions without a selected location', () => {
    expect(requiresLocationSelection(['BUYER'], false)).toBe(true);
    expect(requiresLocationSelection(['BUYER'], true)).toBe(false);
  });

  it('does not gate admin, realtor, or seller sessions', () => {
    expect(requiresLocationSelection(['SUPER_ADMIN'], false)).toBe(false);
    expect(requiresLocationSelection(['REALTOR'], false)).toBe(false);
    expect(requiresLocationSelection(['SELLER'], false)).toBe(false);
  });

  it('does not gate mixed higher-privilege sessions', () => {
    expect(requiresLocationSelection(['BUYER', 'SUPER_ADMIN'], false)).toBe(false);
    expect(requiresLocationSelection(['BUYER', 'REALTOR'], false)).toBe(false);
  });
});
