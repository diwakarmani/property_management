export interface CreateRatingRequest {
  propertyId: number;
  rating: number;   // 1–5
  comment?: string; // max 500 chars
}

export interface RatingDTO {
  id: number;
  realtorId: number;
  propertyId: number;
  raterId: number;
  raterName: string;
  raterPhotoUrl?: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}
