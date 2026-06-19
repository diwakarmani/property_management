export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  REALTOR: 'REALTOR',
  SELLER: 'SELLER',
  BUYER: 'BUYER',
} as const;

export const PERMISSIONS = {
  // Super Admin
  MANAGE_SYSTEM: 'manage_system',
  VIEW_PLATFORM_ANALYTICS: 'view_platform_analytics',
  APPROVE_REALTORS: 'approve_realtors',
  APPROVE_LISTINGS: 'approve_listings',
  REVIEW_DOCUMENTS: 'review_documents',
  
  // Realtor
  CREATE_LISTING: 'create_listing',
  EDIT_OWN_LISTING: 'edit_own_listing',
  VIEW_OWN_PERFORMANCE: 'view_own_performance',
  
  // Seller
  MANAGE_OWN_PROPERTIES: 'manage_own_properties',
  
  // Buyer
  VIEW_PROPERTIES: 'view_properties',
  SAVE_FAVORITES: 'save_favorites',
} as const;

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS).filter(
    permission => permission !== PERMISSIONS.SAVE_FAVORITES
  ),

  [ROLES.REALTOR]: [
    PERMISSIONS.VIEW_PROPERTIES,
    PERMISSIONS.CREATE_LISTING,
    PERMISSIONS.EDIT_OWN_LISTING,
    PERMISSIONS.VIEW_OWN_PERFORMANCE,
  ],
  
  [ROLES.SELLER]: [
    PERMISSIONS.VIEW_PROPERTIES,
    PERMISSIONS.MANAGE_OWN_PROPERTIES,
  ],
  
  [ROLES.BUYER]: [
    PERMISSIONS.VIEW_PROPERTIES,
    PERMISSIONS.SAVE_FAVORITES,
  ],
};




const NON_BUYER_APP_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.REALTOR,
  ROLES.SELLER,
];

/**
 * Returns true when the user should see buyer-specific UI (favorites, inquiries, etc.).
 * Multi-role users who have actively selected 'buyer' get full buyer experience
 * regardless of their other roles.
 */
export const isBuyerExperience = (
  userRoles: string[] | undefined | null,
  activeRole?: string | null,
): boolean => {
  const roles = userRoles ?? [];
  if (!roles.includes(ROLES.BUYER)) return false;
  // Explicit buyer session → always grant buyer experience
  if (activeRole === 'buyer') return true;
  // Single-role buyer or buyer-only account
  return !roles.some(role => NON_BUYER_APP_ROLES.includes(role as any));
};

export const hasPermission = (userRoles: string[], permission: string, activeRole?: string | null) => {
  if (permission === PERMISSIONS.SAVE_FAVORITES) {
    return isBuyerExperience(userRoles, activeRole);
  }
  return userRoles.some(role =>
    (ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] as readonly string[])?.includes(permission)
  );
};

export const hasAnyRole = (userRoles: string[], allowedRoles: string[]) => {
  return userRoles.some(role => allowedRoles.includes(role));
};
