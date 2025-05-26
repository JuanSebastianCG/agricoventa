import { z } from "zod";

// Order item schema
const orderItemSchema = z.object({
  productId: z.string().min(1, { message: "Product ID is required" }),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

// Available order statuses
const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

// Available payment statuses
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;

// Available payment methods
const PAYMENT_METHODS = ["CREDIT_CARD", "DEBIT_CARD", "BANK_TRANSFER", "CASH", "PAYPAL"] as const;

// Base schema for order validation
export const orderSchema = z.object({
  buyerUserId: z.string().min(1, { message: "Buyer ID is required" }),
  items: z.array(orderItemSchema).min(1, { message: "At least one item is required" }),
  paymentMethod: z.enum(PAYMENT_METHODS).default("CASH"),
  notes: z.string().optional(),
});

// Schema for creating an order
export const createOrderSchema = orderSchema;

// Schema for updating an order
export const updateOrderSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
});

// Schema specifically for updating just the status of an order
export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES, { 
    required_error: "Order status is required", 
    invalid_type_error: "Order status must be one of: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED" 
  })
});

// Schema for order query parameters
export const orderQuerySchema = z.object({
  buyerUserId: z.string().optional(),
  sellerId: z.string().optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  sortBy: z.enum(["createdAt", "totalAmount", "updatedAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Schema for canceling an order
export const cancelOrderSchema = z.object({
  cancelReason: z.string().min(1, { message: "Cancel reason is required" }),
});

// Types derived from schemas
export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type UpdateOrderDto = z.infer<typeof updateOrderSchema>;
export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;
export type OrderQueryParams = z.infer<typeof orderQuerySchema>;
export type CancelOrderDto = z.infer<typeof cancelOrderSchema>;

// Order response types
export interface OrderItemResponse {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: {
    name: string;
    sellerId: string;
  };
}

export interface OrderResponse {
  id: string;
  buyerUserId: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  trackingNumber?: string;
  notes?: string;
  items: OrderItemResponse[];
  createdAt: Date;
  updatedAt?: Date;
  buyer?: {
    id: string;
    username: string;
    email: string;
  };
} 