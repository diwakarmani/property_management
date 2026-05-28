export interface NotificationDTO {
  id: number;
  type: string; // e.g. INQUIRY_RECEIVED, LISTING_APPROVED
  title: string;
  body?: string;
  entityType?: string;
  entityId?: number;
  read: boolean;
  readAt?: string;
  createdAt: string;
}
