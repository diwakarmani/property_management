export interface GroupMemberDTO {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImageUrl?: string;
  membershipRole: string;
  commissionPercent?: number;
  monthlyTarget?: number;
  isActive: boolean;
  joinedAt: string;
  activeListings: number;
  soldThisMonth: number;
}

export interface GroupDashboardStatsDTO {
  totalMembers: number;
  activeListings: number;
  pendingApprovals: number;
  soldThisMonth: number;
  rentedThisMonth: number;
  topPerformers: GroupMemberDTO[];
}

export interface RealtorGroupDTO {
  id: number;
  name: string;
  companyName?: string;
  businessLicense?: string;
  address?: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  status: string;
  rejectionReason?: string;
  isActive: boolean;
  groupAdminId: number;
  groupAdminName: string;
  groupAdminEmail: string;
  memberCount: number;
  members?: GroupMemberDTO[];
  createdAt: string;
}

export interface AddMemberRequest {
  userId: number;
  commissionPercent?: number;
  monthlyTarget?: number;
}

export interface CreateRealtorRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  commissionPercent?: number;
  monthlyTarget?: number;
}

export interface CreateGroupRequest {
  name: string;
  companyName?: string;
  businessLicense?: string;
  address?: string;
  description?: string;
  logoUrl?: string;
  website?: string;
}
