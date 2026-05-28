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
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: string; // NEW | CONTACTED | CLOSED
  createdAt: string;
}
