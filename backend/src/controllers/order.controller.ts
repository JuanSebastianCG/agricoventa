import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { CreateOrderDto, UpdateOrderDto, CancelOrderDto, UpdateOrderStatusDto } from "../schemas/order.schema";
import { sendSuccessResponse, sendErrorResponse, sendNotFoundResponse } from "../utils/responseHandler";
import HttpStatusCode from "../utils/HttpStatusCode";
import { NotificationService } from "../utils/notification.service";

const prisma = new PrismaClient();

export class OrderController {
  /**
   * Create a new order
   * @param req Express request
   * @param res Express response
   */
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderData: CreateOrderDto = req.body;

      // Set buyer ID from authenticated user if not provided
      if (!orderData.buyerUserId && req.user?.userId) {
        orderData.buyerUserId = req.user.userId;
      }

      // Ensure user can only create orders for themselves unless they're an admin
      if (req.user?.userType !== "ADMIN" && orderData.buyerUserId !== req.user?.userId) {
        sendErrorResponse(res, "You can only create orders for yourself", HttpStatusCode.FORBIDDEN);
        return;
      }

      // Create order with transaction to ensure atomicity
      const order = await prisma.$transaction(async (tx) => {
        // Calculate total amount
        let totalAmount = 0;

        // Process order items
        const orderItems = [];
        
        for (const item of orderData.items) {
          // Get product
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new Error(`Product with ID ${item.productId} not found`);
          }

          if (!product.isActive) {
            throw new Error(`Product ${product.name} is not available`);
          }

          if (product.stockQuantity < item.quantity) {
            throw new Error(`Insufficient quantity for product ${product.name}`);
          }

          // Calculate item total
          const itemTotal = product.basePrice * item.quantity;
          totalAmount += itemTotal;

          // Create order item
          orderItems.push({
            productId: product.id,
            quantity: item.quantity,
            unitPrice: product.basePrice,
            subtotal: itemTotal
          });

          // Update product quantity
          await tx.product.update({
            where: { id: product.id },
            data: { 
              stockQuantity: product.stockQuantity - item.quantity
            },
          });
        }

        // Create the order
        return tx.order.create({
          data: {
            buyerUserId: orderData.buyerUserId,
            status: "PENDING",
            totalAmount,
            paymentMethod: orderData.paymentMethod,
            paymentStatus: "PENDING",
            items: {
              create: orderItems
            }
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    sellerId: true
                  }
                }
              }
            },
            buyer: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          },
        });
      });

      // Send notifications to buyer and seller(s)
      try {
        // Collect unique seller IDs from order items
        const sellerIds = new Set<string>();
        for (const item of order.items) {
          if (item.product?.sellerId) {
            sellerIds.add(item.product.sellerId);
          }
        }

        // Notify buyer
        await NotificationService.notifyOrderPlaced(
          order.buyerUserId,
          Array.from(sellerIds)[0], // Using the first seller for simplicity
          order.id,
          order.totalAmount
        );

        console.log(`[OrderController.createOrder] Order placed notification sent to buyer and seller(s)`);
      } catch (notificationError) {
        console.error('[OrderController.createOrder] Error creating notification:', notificationError);
        // Continue with order creation even if notification fails
      }

      // Map order to response object
      const orderResponse = this.mapToOrderResponse(order);
      sendSuccessResponse(res, orderResponse, HttpStatusCode.CREATED);
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * Get an order by ID
   * @param req Express request
   * @param res Express response
   */
  async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params.orderId;
      
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sellerId: true
                }
              }
            }
          },
          buyer: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });

      if (!order) {
        sendNotFoundResponse(res, "Order not found");
        return;
      }

      // Only allow buyer, seller of products in the order, or admin to view the order
      const isAdmin = req.user?.userType === "ADMIN";
      const isBuyer = order.buyerUserId === req.user?.userId;
      const isSeller = order.items.some((item) => item.product?.sellerId === req.user?.userId);

      if (!isAdmin && !isBuyer && !isSeller) {
        sendErrorResponse(res, "You don't have permission to view this order", HttpStatusCode.FORBIDDEN);
        return;
      }

      // Map order to response object
      const orderResponse = this.mapToOrderResponse(order);
      sendSuccessResponse(res, orderResponse);
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get all orders
   * @param req Express request
   * @param res Express response
   */
  async getOrders(req: Request, res: Response): Promise<void> {
    try {
      // Parse query parameters
      const queryParams = {
        buyerUserId: req.query.buyerUserId as string | null,
        sellerId: req.query.sellerId as string | null,
        status: req.query.status as string,
        paymentStatus: req.query.paymentStatus as string,
        fromDate: req.query.fromDate as string,
        toDate: req.query.toDate as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: (req.query.sortBy as string) || "createdAt",
        sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
      };

      // If not admin, restrict to user's own orders
      if (req.user?.userType !== "ADMIN") {
        if (req.user?.userType === "BUYER") {
          // Buyers can only see their own orders
          queryParams.buyerUserId = req.user.userId;
          queryParams.sellerId = null;
        } else if (req.user?.userType === "SELLER") {
          // Sellers can only see orders containing their products
          queryParams.sellerId = req.user.userId;
          queryParams.buyerUserId = null;
        }
      }

      const {
        buyerUserId,
        sellerId,
        status,
        paymentStatus,
        fromDate,
        toDate,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = queryParams;

      const skip = (page - 1) * limit;

      // Build where clause for filtering
      const where: any = {};

      if (buyerUserId) {
        where.buyerUserId = buyerUserId;
      }

      if (status) {
        where.status = status;
      }

      if (paymentStatus) {
        where.paymentStatus = paymentStatus;
      }

      // Date range filter
      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) where.createdAt.gte = new Date(fromDate);
        if (toDate) where.createdAt.lte = new Date(toDate);
      }

      // Handle seller ID (find orders containing products sold by the seller)
      let orders;
      let total;

      if (sellerId) {
        orders = await prisma.order.findMany({
          where: {
            ...where,
            items: {
              some: {
                product: {
                  sellerId
                }
              }
            }
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    sellerId: true
                  }
                }
              }
            },
            buyer: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        });

        total = await prisma.order.count({
          where: {
            ...where,
            items: {
              some: {
                product: {
                  sellerId
                }
              }
            }
          }
        });
      } else {
        [orders, total] = await Promise.all([
          prisma.order.findMany({
            where,
            include: {
              items: {
                include: {
                  product: {
                    select: {
                      name: true,
                      sellerId: true
                    }
                  }
                }
              },
              buyer: {
                select: {
                  id: true,
                  username: true,
                  email: true
                }
              }
            },
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder }
          }),
          prisma.order.count({ where })
        ]);
      }

      sendSuccessResponse(res, {
        orders: orders.map(this.mapToOrderResponse),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        }
      });
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update an order
   * @param req Express request
   * @param res Express response
   */
  async updateOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params.orderId;
      const updateData: UpdateOrderDto = req.body;

      // Check if order exists
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true
        }
      });
      
      if (!order) {
        sendNotFoundResponse(res, "Order not found");
        return;
      }

      // Only allow admin to update order status
      if (req.user?.userType !== "ADMIN") {
        sendErrorResponse(res, "Only administrators can update orders", HttpStatusCode.FORBIDDEN);
        return;
      }

      // Update order
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sellerId: true
                }
              }
            }
          },
          buyer: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });

      // Map order to response object
      const orderResponse = this.mapToOrderResponse(updatedOrder);
      sendSuccessResponse(res, orderResponse);
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update only the status of an order
   * @param req Express request
   * @param res Express response
   */
  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params.orderId;
      const { status } = req.body as UpdateOrderStatusDto;
      
      // Check if order exists
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sellerId: true
                }
              }
            }
          }
        }
      });
      
      if (!existingOrder) {
        sendNotFoundResponse(res, "Order not found");
        return;
      }
      
      // Only allow admin to update status (security check already in route middleware)
      // For more granular permissions, you could check if user is the seller of any item
      
      // Update order status
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status,
          updatedAt: new Date()
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sellerId: true
                }
              }
            }
          },
          buyer: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });
      
      // Create notification for buyer
      try {
        await NotificationService.notifyOrderStatusChange(
          updatedOrder.buyerUserId,
          orderId,
          status,
          existingOrder.status || 'PENDING'
        );
        console.log(`[OrderController.updateOrderStatus] Notification sent for order status change: ${orderId}`);
      } catch (notificationError) {
        console.error('[OrderController.updateOrderStatus] Error creating notification:', notificationError);
        // Continue with order update even if notification fails
      }
      
      // Map order to response object
      const orderResponse = this.mapToOrderResponse(updatedOrder);
      sendSuccessResponse(res, orderResponse);
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Cancel an order
   * @param req Express request
   * @param res Express response
   */
  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params.orderId;
      const { cancelReason }: CancelOrderDto = req.body;

      // Check if order exists
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });
      
      if (!order) {
        sendNotFoundResponse(res, "Order not found");
        return;
      }

      // Only allow buyer or admin to cancel
      const isAdmin = req.user?.userType === "ADMIN";
      const isBuyer = order.buyerUserId === req.user?.userId;

      if (!isAdmin && !isBuyer) {
        sendErrorResponse(res, "Only the buyer or an administrator can cancel this order", HttpStatusCode.FORBIDDEN);
        return;
      }

      // Check if order can be canceled
      if (["SHIPPED", "DELIVERED"].includes(order.status)) {
        sendErrorResponse(res, "Cannot cancel an order that has been shipped or delivered", HttpStatusCode.BAD_REQUEST);
        return;
      }

      // Cancel order with transaction
      const canceledOrder = await prisma.$transaction(async (tx) => {
        // Restore product quantities
        for (const item of order.items) {
          if (item.product) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: item.product.stockQuantity + item.quantity
              }
            });
          }
        }

        // Update order status
        return tx.order.update({
          where: { id: orderId },
          data: {
            status: "CANCELLED",
            updatedAt: new Date()
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    sellerId: true
                  }
                }
              }
            },
            buyer: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          }
        });
      });

      // Map order to response object
      const orderResponse = this.mapToOrderResponse(canceledOrder);
      sendSuccessResponse(res, orderResponse);
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * Get orders for the current seller
   * @param req Express request
   * @param res Express response
   */
  async getSellerOrders(req: Request, res: Response): Promise<void> {
    try {
      // Verify seller ID is available from the authenticated user
      if (!req.user || !req.user.userId) {
        sendErrorResponse(res, "Authentication required", HttpStatusCode.UNAUTHORIZED);
        return;
      }

      const sellerId = req.user.userId;

      // Parse query parameters
      const status = req.query.status as string;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const sortBy = (req.query.sortBy as string) || "createdAt";
      const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

      const skip = (page - 1) * limit;

      // Build where clause for filtering
      const where: any = {
        items: {
          some: {
            product: {
              sellerId
            }
          }
        }
      };

      // Add status filter if provided
      if (status) {
        where.status = status;
      }

      // Find orders containing products sold by the seller
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    basePrice: true,
                    sellerId: true,
                    images: {
                      where: { isPrimary: true },
                      take: 1
                    }
                  }
                }
              }
            },
            buyer: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.order.count({
          where
        })
      ]);

      // Filter items in each order to only include items from the current seller
      const processedOrders = orders.map(order => {
        // Only include items that belong to this seller
        const sellerItems = order.items.filter(item => 
          item.product && item.product.sellerId === sellerId
        );
        
        // Calculate seller's portion of the order total
        const sellerTotal = sellerItems.reduce((sum, item) => 
          sum + (item.unitPrice * item.quantity), 0
        );

        return {
          ...order,
          items: sellerItems,
          // Include the seller's portion of the order
          sellerTotal
        };
      });

      sendSuccessResponse(res, {
        orders: processedOrders.map(this.mapToOrderResponse),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        }
      });
    } catch (error: any) {
      console.error("Error in getSellerOrders:", error);
      sendErrorResponse(res, 
        error.message || "Failed to fetch seller orders", 
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Map order entity to order response
   * @param order Order entity with relations
   * @returns Order response
   */
  private mapToOrderResponse(order: any): any {
    return {
      id: order.id,
      buyerUserId: order.buyerUserId,
      status: order.status,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      trackingNumber: order.trackingNumber,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        product: item.product ? {
          name: item.product.name,
          sellerId: item.product.sellerId
        } : undefined
      })),
      buyer: order.buyer ? {
        id: order.buyer.id,
        username: order.buyer.username,
        email: order.buyer.email
      } : undefined
    };
  }
}