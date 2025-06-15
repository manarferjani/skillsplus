// services/notification.api.ts
import apiClient from "@/lib/api-client";

export const fetchNotifications = async (userId: string) => {
  const { data } = await apiClient.get(`/api/notifications/${userId}`);
  return data;
};

export const markNotificationAsRead = async (id: string) => {
  await apiClient.post(`/api/notifications/mark-read/${id}`);
};

export const markAllNotificationsAsRead = async (userId: string) => {
  await apiClient.post(`/api/notifications/mark-all-read`, { userId });
};

// ✅ Nouvelle fonction : envoyer une notification
export const sendNotificationToAdmin = async ({
  userId,
  message,
  type = "info",
  link = "",
  save = true,
}: {
  userId: string
  message: string
  type?: string
  link?: string
  save?: boolean
}) => {
  const { data } = await apiClient.post(`/api/notifications/send`, {
    userId,
    message,
    type,
    link,
    save,
  })
  return data
}
