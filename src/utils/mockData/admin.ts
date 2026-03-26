export const MOCK_GROUPS = [
  {
    id: 1,
    name: 'Premium Realty Group',
    companyName: 'Premium Realty Pvt Ltd',
    adminId: 10,
    businessLicense: 'BL123456',
    address: 'Mumbai, Maharashtra',
    status: 'APPROVED',
    realtorsCount: 5,
  },
  {
    id: 2,
    name: 'Skyline Properties',
    companyName: 'Skyline Props Inc',
    adminId: 11,
    businessLicense: 'BL789012',
    address: 'Bangalore, Karnataka',
    status: 'PENDING',
    realtorsCount: 0,
  },
];

export const MOCK_REALTORS = [
  {
    id: 1,
    name: 'Amit Sharma',
    email: 'amit@premiumrealty.com',
    groupId: 1,
    commission: 2.5,
    target: 5,
    performance: {
      listingsCreated: 12,
      listingsSold: 3,
      revenue: 15000000,
      achievement: 60,
    },
  },
  {
    id: 2,
    name: 'Priya Singh',
    email: 'priya@premiumrealty.com',
    groupId: 1,
    commission: 3,
    target: 5,
    performance: {
      listingsCreated: 15,
      listingsSold: 5,
      revenue: 25000000,
      achievement: 100,
    },
  },
];

export const MOCK_ANALYTICS = {
  platform: {
    totalUsers: 5420,
    totalGroups: 12,
    totalRealtors: 45,
    totalListings: 1250,
    totalRevenue: 250000000,
  },
  group: {
    totalRealtors: 5,
    activeListings: 23,
    soldThisMonth: 8,
    totalRevenue: 40000000,
  },
};
