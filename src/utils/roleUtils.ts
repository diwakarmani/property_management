export type RoleKey = 'admin' | 'realtor' | 'seller' | 'buyer';

export interface RoleMeta {
  key: RoleKey;
  label: string;
  description: string;
  icon: string;
  color: string;
  requiredRole: string;
}

export const ROLE_META: Record<RoleKey, RoleMeta> = {
  admin: {
    key: 'admin',
    label: 'Super Admin',
    description: 'Manage the entire platform, users, listings & analytics',
    icon: 'shield-checkmark',
    color: '#E74C3C',
    requiredRole: 'SUPER_ADMIN',
  },
  realtor: {
    key: 'realtor',
    label: 'Realtor',
    description: 'Create and manage property listings for clients',
    icon: 'briefcase',
    color: '#2980B9',
    requiredRole: 'REALTOR',
  },
  seller: {
    key: 'seller',
    label: 'Seller',
    description: 'List and manage your own properties',
    icon: 'home',
    color: '#27AE60',
    requiredRole: 'SELLER',
  },
  buyer: {
    key: 'buyer',
    label: 'Buyer',
    description: 'Browse, search and save properties',
    icon: 'search',
    color: '#F39C12',
    requiredRole: 'BUYER',
  },
};

// Priority order: highest privilege first
const PRIORITY: RoleKey[] = ['admin', 'realtor', 'seller', 'buyer'];

const BACKEND_TO_KEY: Record<string, RoleKey> = {
  SUPER_ADMIN: 'admin',
  REALTOR:     'realtor',
  SELLER:      'seller',
  BUYER:       'buyer',
};

/** Returns every RoleKey this user can use, in priority order. */
export const getAvailableRoles = (roles: string[] | undefined | null): RoleKey[] => {
  const r = roles ?? [];
  return PRIORITY.filter(key => r.includes(ROLE_META[key].requiredRole));
};

/** Highest-privilege role key — used as the fallback for single-role users. */
export const pickRoleKey = (roles: string[] | undefined | null): RoleKey => {
  const available = getAvailableRoles(roles);
  return available[0] ?? 'buyer';
};

/** True when a stored activeRole is still valid for the user's current roles. */
export const isRoleValid = (role: string | null, userRoles: string[] | undefined | null): role is RoleKey => {
  if (!role) return false;
  const available = getAvailableRoles(userRoles);
  return available.includes(role as RoleKey);
};
