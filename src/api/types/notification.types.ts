export interface NotificationDTO {
  id: number;
  type: string;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: number;
  read: boolean;
  readAt?: string;
  createdAt: string;
}
