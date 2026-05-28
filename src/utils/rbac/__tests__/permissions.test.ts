import { ROLES, PERMISSIONS, hasPermission, hasAnyRole } from '../permissions';

/**
 * Unit tests for RBAC helpers (gap analysis §15.2 — utils/rbac).
 * Pure functions — fast and deterministic.
 */
describe('rbac/permissions', () => {
  describe('hasPermission', () => {
    it('grants a permission the role actually has', () => {
      expect(hasPermission([ROLES.SELLER], PERMISSIONS.MANAGE_OWN_PROPERTIES)).toBe(true);
      expect(hasPermission([ROLES.BUYER], PERMISSIONS.VIEW_PROPERTIES)).toBe(true);
    });

    it('denies a permission the role does not have', () => {
      expect(hasPermission([ROLES.BUYER], PERMISSIONS.MANAGE_SYSTEM)).toBe(false);
      expect(hasPermission([ROLES.SELLER], PERMISSIONS.APPROVE_REALTOR_LISTINGS)).toBe(false);
    });

    it('SUPER_ADMIN holds every permission', () => {
      expect(hasPermission([ROLES.SUPER_ADMIN], PERMISSIONS.MANAGE_SYSTEM)).toBe(true);
      expect(hasPermission([ROLES.SUPER_ADMIN], PERMISSIONS.CREATE_LISTING)).toBe(true);
    });

    it('returns false for an empty or unknown role set', () => {
      expect(hasPermission([], PERMISSIONS.VIEW_PROPERTIES)).toBe(false);
      expect(hasPermission(['NOT_A_ROLE'], PERMISSIONS.VIEW_PROPERTIES)).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('is true when the user holds one of the allowed roles', () => {
      expect(hasAnyRole([ROLES.REALTOR], [ROLES.REALTOR, ROLES.SUPER_ADMIN])).toBe(true);
    });

    it('is false when the user holds none of the allowed roles', () => {
      expect(hasAnyRole([ROLES.BUYER], [ROLES.REALTOR, ROLES.SUPER_ADMIN])).toBe(false);
    });
  });
});
