export interface PropertyCardDTO {
  id: number;
  title: string;
  listingType: string;
  price: number;
  city: string;
  locality: string;
  bedrooms: number;
  furnishedStatus: string;
  primaryImageUrl: string;
  verified: boolean;
  premium: boolean;
  distanceInKm?: number;
}

export interface HomeDiscoveryResponse {
  popular: PropertyCardDTO[];
  recommended: PropertyCardDTO[];
  nearest: PropertyCardDTO[];
}

export interface ViewMoreRequest {
  category: 'POPULAR' | 'RECOMMENDED' | 'NEAREST';
  city?: string;
  lat?: number;
  lng?: number;
  page?: number;
  size?: number;
}