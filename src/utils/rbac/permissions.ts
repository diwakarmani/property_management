export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  REALTOR_GROUP_ADMIN: 'REALTOR_GROUP_ADMIN',
  REALTOR: 'REALTOR',
  SELLER: 'SELLER',
  BUYER: 'BUYER',
} as const;

export const PERMISSIONS = {
  // Super Admin
  MANAGE_SYSTEM: 'manage_system',
  VIEW_PLATFORM_ANALYTICS: 'view_platform_analytics',
  APPROVE_REALTOR_GROUPS: 'approve_realtor_groups',
  
  // Realtor Group Admin
  MANAGE_GROUP: 'manage_group',
  CREATE_REALTOR: 'create_realtor',
  VIEW_GROUP_ANALYTICS: 'view_group_analytics',
  SET_TARGETS: 'set_targets',
  APPROVE_REALTOR_LISTINGS: 'approve_realtor_listings',
  
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
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  
  [ROLES.REALTOR_GROUP_ADMIN]: [
    PERMISSIONS.VIEW_PROPERTIES,
    PERMISSIONS.MANAGE_GROUP,
    PERMISSIONS.CREATE_REALTOR,
    PERMISSIONS.VIEW_GROUP_ANALYTICS,
    PERMISSIONS.SET_TARGETS,
    PERMISSIONS.APPROVE_REALTOR_LISTINGS,
    PERMISSIONS.CREATE_LISTING,
  ],
  
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




export const hasPermission = (userRoles: string[], permission: string) => {
  return userRoles.some(role => 
    ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS]?.includes(permission)
  );
};

export const hasAnyRole = (userRoles: string[], allowedRoles: string[]) => {
  return userRoles.some(role => allowedRoles.includes(role));
};