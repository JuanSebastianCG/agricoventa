import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const notificationController = new NotificationController();

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get all notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', authenticate, (req, res) => {
  notificationController.getUserNotifications(req, res);
});

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Get unread notification count for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread notification count
 */
router.get('/unread-count', authenticate, (req, res) => {
  notificationController.getUnreadCount(req, res);
});

/**
 * @swagger
 * /notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch('/:notificationId/read', authenticate, (req, res) => {
  notificationController.markAsRead(req, res);
});

/**
 * @swagger
 * /notifications/mark-all-read:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch('/mark-all-read', authenticate, (req, res) => {
  notificationController.markAllAsRead(req, res);
});

/**
 * @swagger
 * /notifications/{notificationId}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 */
router.delete('/:notificationId', authenticate, (req, res) => {
  notificationController.deleteNotification(req, res);
});

export default router; 