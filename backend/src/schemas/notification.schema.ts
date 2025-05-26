import { z } from "zod";

// User notification schema
export const userNotificationSchema = z.object({
  recipientUserId: z.string().min(1, { message: "Recipient user ID is required" }),
  type: z.string().min(1, { message: "Notification type is required" }),
  title: z.string().optional(),
  message: z.string().min(1, { message: "Message is required" }),
  isRead: z.boolean().optional().default(false),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().optional(),
});

// Product notification schema
export const productNotificationSchema = z.object({
  productId: z.string().min(1, { message: "Product ID is required" }),
  type: z.string().min(1, { message: "Notification type is required" }),
  title: z.string().optional(),
  message: z.string().min(1, { message: "Message is required" }),
  isActive: z.boolean().optional().default(true),
  startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
});

// Schema for creating a user notification
export const createUserNotificationSchema = userNotificationSchema;

// Schema for creating a product notification
export const createProductNotificationSchema = productNotificationSchema;

// Schema for updating a user notification
export const updateUserNotificationSchema = z.object({
  isRead: z.boolean().optional(),
});

// Schema for updating a product notification
export const updateProductNotificationSchema = z.object({
  title: z.string().optional(),
  message: z.string().optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
});

// Schema for notification query parameters
export const notificationQuerySchema = z.object({
  recipientUserId: z.string().optional(),
  type: z.string().optional(),
  isRead: z.boolean().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10),
  sortBy: z.enum(["createdAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Types derived from schemas
export type CreateUserNotificationDto = z.infer<typeof createUserNotificationSchema>;
export type CreateProductNotificationDto = z.infer<typeof createProductNotificationSchema>;
export type UpdateUserNotificationDto = z.infer<typeof updateUserNotificationSchema>;
export type UpdateProductNotificationDto = z.infer<typeof updateProductNotificationSchema>;
export type NotificationQueryParams = z.infer<typeof notificationQuerySchema>;

// User notification response type
export interface UserNotificationResponse {
  id: string;
  recipientUserId: string;
  type: string;
  title?: string;
  message: string;
  isRead: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Product notification response type
export interface ProductNotificationResponse {
  id: string;
  productId: string;
  type: string;
  title?: string;
  message: string;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  product?: {
    id: string;
    name: string;
  };
} 