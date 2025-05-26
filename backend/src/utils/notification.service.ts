import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export interface NotificationData {
  recipientUserId: string;
  type: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

/**
 * NotificationService handles the creation and management of user notifications
 */
export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(data: NotificationData) {
    try {
      const notification = await prisma.userNotification.create({
        data: {
          recipientUserId: data.recipientUserId,
          type: data.type,
          title: data.title,
          message: data.message,
          relatedEntityType: data.relatedEntityType,
          relatedEntityId: data.relatedEntityId,
          isRead: false,
          createdAt: new Date(),
        },
      });
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string) {
    try {
      const notification = await prisma.userNotification.update({
        where: { id: notificationId },
        data: { isRead: true, updatedAt: new Date() },
      });
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    try {
      await prisma.userNotification.updateMany({
        where: { 
          recipientUserId: userId,
          isRead: false
        },
        data: { 
          isRead: true,
          updatedAt: new Date()
        },
      });
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string) {
    try {
      const count = await prisma.userNotification.count({
        where: {
          recipientUserId: userId,
          isRead: false,
        },
      });
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Get all notifications for a user with pagination
   */
  static async getUserNotifications(userId: string, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const [notifications, total] = await Promise.all([
        prisma.userNotification.findMany({
          where: { recipientUserId: userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.userNotification.count({
          where: { recipientUserId: userId },
        }),
      ]);
      
      return {
        notifications,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  /**
   * Notify admins about a certification that needs to be verified
   */
  static async notifyAdminsAboutCertification(certificationId: string, userId: string, certificationName: string) {
    try {
      // Get all users with ADMIN role
      const admins = await prisma.user.findMany({
        where: {
          userType: 'ADMIN',
          isActive: true
        },
        select: {
          id: true
        }
      });

      // Get user information
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          username: true,
          firstName: true,
          lastName: true
        }
      });

      const userDisplayName = user 
        ? (user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.username)
        : 'Un usuario';

      // Create notifications for all admins
      const notificationPromises = admins.map(admin => 
        this.createNotification({
          recipientUserId: admin.id,
          type: 'NEW_CERTIFICATION',
          title: 'Nueva Certificación para Revisar',
          message: `${userDisplayName} ha enviado una certificación "${certificationName}" que requiere verificación.`,
          relatedEntityType: 'CERTIFICATION',
          relatedEntityId: certificationId
        })
      );

      await Promise.all(notificationPromises);
      console.log(`Successfully sent certification notifications to ${admins.length} admins.`);
      
      return true;
    } catch (error) {
      console.error('Error notifying admins about certification:', error);
      throw error;
    }
  }

  /**
   * Notify when a product is created
   */
  static async notifyProductCreated(sellerId: string, productId: string, productName: string) {
    return this.createNotification({
      recipientUserId: sellerId,
      type: 'PRODUCT_CREATED',
      title: 'Producto Creado',
      message: `Tu producto "${productName}" ha sido creado exitosamente.`,
      relatedEntityType: 'PRODUCT',
      relatedEntityId: productId
    });
  }

  /**
   * Notify when an order status changes
   */
  static async notifyOrderStatusChange(recipientId: string, orderId: string, newStatus: string, previousStatus: string) {
    return this.createNotification({
      recipientUserId: recipientId,
      type: 'ORDER_STATUS',
      title: 'Estado de Pedido Actualizado',
      message: `Tu pedido #${orderId.substring(0, 8).toUpperCase()} ha cambiado de estado ${previousStatus} a ${newStatus}.`,
      relatedEntityType: 'ORDER',
      relatedEntityId: orderId
    });
  }

  /**
   * Notify when an order is placed
   */
  static async notifyOrderPlaced(buyerId: string, sellerId: string, orderId: string, totalAmount: number) {
    // Notify buyer
    await this.createNotification({
      recipientUserId: buyerId,
      type: 'ORDER_PLACED',
      title: 'Pedido Realizado',
      message: `Has realizado un pedido por $${totalAmount.toLocaleString('es-ES')}. Número de pedido: #${orderId.substring(0, 8).toUpperCase()}`,
      relatedEntityType: 'ORDER',
      relatedEntityId: orderId
    });

    // Notify seller
    return this.createNotification({
      recipientUserId: sellerId,
      type: 'NEW_ORDER',
      title: 'Nuevo Pedido Recibido',
      message: `Has recibido un nuevo pedido por $${totalAmount.toLocaleString('es-ES')}. Número de pedido: #${orderId.substring(0, 8).toUpperCase()}`,
      relatedEntityType: 'ORDER',
      relatedEntityId: orderId
    });
  }

  /**
   * Notify when product stock is low
   */
  static async notifyLowStock(sellerId: string, productId: string, productName: string, currentStock: number) {
    return this.createNotification({
      recipientUserId: sellerId,
      type: 'LOW_STOCK',
      title: 'Stock Bajo',
      message: `Tu producto "${productName}" tiene stock bajo (${currentStock} unidades restantes).`,
      relatedEntityType: 'PRODUCT',
      relatedEntityId: productId
    });
  }

  /**
   * Notify when a certification status changes
   */
  static async notifyCertificationStatusChange(userId: string, certificationId: string, status: string, certificationName: string) {
    const statusText = status === 'VERIFIED' ? 'aprobado' : 'rechazado';
    
    return this.createNotification({
      recipientUserId: userId,
      type: 'CERTIFICATION_STATUS',
      title: 'Estado de Certificación',
      message: `Tu certificación "${certificationName}" ha sido ${statusText}.`,
      relatedEntityType: 'CERTIFICATION',
      relatedEntityId: certificationId
    });
  }

  /**
   * Notify when a product receives a review
   */
  static async notifyProductReview(sellerId: string, productId: string, productName: string, rating: number) {
    return this.createNotification({
      recipientUserId: sellerId,
      type: 'PRODUCT_REVIEW',
      title: 'Nueva Reseña',
      message: `Tu producto "${productName}" ha recibido una nueva reseña con calificación de ${rating} estrellas.`,
      relatedEntityType: 'PRODUCT',
      relatedEntityId: productId
    });
  }

  /**
   * Notify when payment is received
   */
  static async notifyPaymentReceived(sellerId: string, orderId: string, amount: number) {
    return this.createNotification({
      recipientUserId: sellerId,
      type: 'PAYMENT_RECEIVED',
      title: 'Pago Recibido',
      message: `Has recibido un pago de $${amount.toLocaleString('es-ES')} por el pedido #${orderId.substring(0, 8).toUpperCase()}.`,
      relatedEntityType: 'ORDER',
      relatedEntityId: orderId
    });
  }
} 