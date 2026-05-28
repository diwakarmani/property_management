import axiosClient from '../client/axiosClient';
import type { ApiResponse } from '../types/auth.types';
import type { PageResponse } from '../types/property.types';
import type { CreateInquiryRequest, InquiryDTO } from '../types/inquiry.types';

/** Buyer inquiries / "contact agent" requests (gap analysis RF-02). */
export const InquiryService = {
  create: (data: CreateInquiryRequest) =>
    axiosClient.post<ApiResponse<InquiryDTO>>('/api/inquiries', data),

  getSent: (page = 0, size = 20) =>
    axiosClient.get<ApiResponse<PageResponse<InquiryDTO>>>('/api/inquiries/sent', {
      params: { page, size },
    }),

  getReceived: (page = 0, size = 20) =>
    axiosClient.get<ApiResponse<PageResponse<InquiryDTO>>>('/api/inquiries/received', {
      params: { page, size },
    }),

  updateStatus: (id: number, status: string) =>
    axiosClient.patch<ApiResponse<InquiryDTO>>(`/api/inquiries/${id}/status`, null, {
      params: { status },
    }),
};
