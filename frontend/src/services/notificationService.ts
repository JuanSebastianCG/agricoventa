import api from './api';

export interface NotificationFetchResponse {
  notifications: Notification[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface Notification {
  id: string;
  recipientUserId: string;
  type: string;
  title: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
}

class NotificationService {
  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(page = 1, limit = 10): Promise<NotificationFetchResponse> {
    try {
      const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data.data.count;
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      return 0;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await api.patch('/notifications/mark-all-read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await api.delete(`/notifications/${notificationId}`);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}

export default new NotificationService(); 