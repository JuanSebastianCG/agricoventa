import { Request, Response } from 'express';
import { NotificationService } from '../utils/notification.service';
import HttpStatusCode from '../utils/HttpStatusCode';
import { ApiError } from '../middleware/error.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationController {
  /**
   * Get all notifications for the authenticated user
   */
  async getUserNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, 'User not authenticated');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await NotificationService.getUserNotifications(userId, page, limit);

      res.status(HttpStatusCode.OK).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: { message: error.message }
        });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: { message: 'Error fetching notifications' }
        });
      }
    }
  }

  /**
   * Get unread notification count for the authenticated user
   */
  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, 'User not authenticated');
      }

      const count = await NotificationService.getUnreadCount(userId);

      res.status(HttpStatusCode.OK).json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: { message: error.message }
        });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: { message: 'Error fetching unread count' }
        });
      }
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, 'User not authenticated');
      }

      const { notificationId } = req.params;

      // Check if notification belongs to user
      const notification = await prisma.userNotification.findUnique({
        where: { id: notificationId }
      });

      if (!notification) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, 'Notification not found');
      }

      if (notification.recipientUserId !== userId) {
        throw new ApiError(HttpStatusCode.FORBIDDEN, 'You do not have permission to access this notification');
      }

      await NotificationService.markAsRead(notificationId);

      res.status(HttpStatusCode.OK).json({
        success: true,
        data: { message: 'Notification marked as read' }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: { message: error.message }
        });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: { message: 'Error marking notification as read' }
        });
      }
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, 'User not authenticated');
      }

      await NotificationService.markAllAsRead(userId);

      res.status(HttpStatusCode.OK).json({
        success: true,
        data: { message: 'All notifications marked as read' }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: { message: error.message }
        });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: { message: 'Error marking all notifications as read' }
        });
      }
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, 'User not authenticated');
      }

      const { notificationId } = req.params;

      // Check if notification belongs to user
      const notification = await prisma.userNotification.findUnique({
        where: { id: notificationId }
      });

      if (!notification) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, 'Notification not found');
      }

      if (notification.recipientUserId !== userId) {
        throw new ApiError(HttpStatusCode.FORBIDDEN, 'You do not have permission to delete this notification');
      }

      await prisma.userNotification.delete({
        where: { id: notificationId }
      });

      res.status(HttpStatusCode.OK).json({
        success: true,
        data: { message: 'Notification deleted successfully' }
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: { message: error.message }
        });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: { message: 'Error deleting notification' }
        });
      }
    }
  }
} 