export interface PropertyImageDTO {
  id: number;
  imageUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  displayOrder?: number;
  isPrimary: boolean;
}

export interface PropertyAmenityDTO {
  id: number;
  name: string;
  iconClass?: string;
  category?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface PropertyDTO {
  id: number;
  title: string;
  description: string;
  propertyTypeId?: number;
  propertyTypeName?: string;
  propertySubTypeId?: number;
  propertySubTypeName?: string;
  ownerId?: number;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  ownerIsRealtor?: boolean;
  listingType: string;
  price: number;
  depositAmount?: number;
  maintenanceCharge?: number;
  addressLine1?: string;
  addressLine2?: string;
  locality: string;
  city: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  floorNumber?: number;
  totalFloors?: number;
  carpetArea?: number;
  builtUpArea?: number;
  plotArea?: number;
  facingDirection?: string;
  furnishedStatus?: string;
  parkingCovered?: number;
  parkingOpen?: number;
  ageOfProperty?: number;
  availableFrom?: string;
  ownershipType?: string;
  possessionStatus?: string;
  kitchenType?: string;
  waterSupply?: string;
  shortlistCount?: number;
  status: string;
  isVerified: boolean;
  isFeatured: boolean;
  isPremium: boolean;
  rejectionReason?: string;
  viewCount?: number;
  inquiryCount?: number;
  publishedAt?: string;
  images?: PropertyImageDTO[];
  primaryImageUrl?: string;
  amenities?: PropertyAmenityDTO[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  first?: boolean;
  last: boolean;
  empty?: boolean;
}

export interface PropertySubTypeDTO {
  id: number;
  name: string;
  description?: string;
  propertyTypeId?: number;
  displayOrder?: number;
  isActive?: boolean;
}

export interface PropertyTypeDTO {
  id: number;
  name: string;
  description?: string;
  iconUrl?: string;
  displayOrder?: number;
  subTypes?: PropertySubTypeDTO[];
  isActive?: boolean;
}

export interface RealtorStatsDTO {
  activeListings: number;
  draftListings: number;
  pendingApprovals: number;
  soldCount: number;
  rentedCount: number;
  totalViews: number;
}

export interface RealtorProfileDTO {
  id: number;
  name: string;
  profilePhotoUrl?: string;
  phone?: string;
  email?: string;
  bio?: string;
  areasServed?: string[];
  languages?: string[];
  ratingAverage?: number | null;
  ratingCount?: number;
  totalUserInteractions: number;
  activeListingsCount?: number;
  verificationStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConnectRealtorRequest {
  propertyId?: number;
  message?: string;
}

export interface ConnectRealtorResponse {
  success: boolean;
  interactionId: number;
  realtorId: number;
  propertyId?: number;
  totalUserInteractions: number;
  conversationId?: number;
}
