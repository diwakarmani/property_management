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

  realtorId?: number;
  realtorName?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: string;
  createdAt: string;
}
