export interface CreateRatingRequest {
  propertyId: number;
  rating: number;
  comment?: string;
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
