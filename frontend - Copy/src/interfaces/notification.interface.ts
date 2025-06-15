// src/interfaces/notification.interface.ts
export interface Notification {
  _id: string;
  userId: string;
  message: string;
  type?: string;
  createdAt: string;
  read: boolean;
}
