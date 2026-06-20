export interface CreateInquiryRequest {
  propertyId: number;
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface InquiryDTO {
  id: number;
  propertyId: number;
  propertyTitle: string;
  inquirerId: number;
  /** Populated only when the property owner is a REALTOR — used to show the Rate button. */
  realtorId?: number;
  realtorName?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: string; // NEW | CONTACTED | CLOSED
  createdAt: string;
}
