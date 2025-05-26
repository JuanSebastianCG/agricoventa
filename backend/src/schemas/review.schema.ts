import { z } from "zod";

// Base schema for review validation
export const reviewSchema = z.object({
  userId: z.string().min(1, { message: "User ID is required" }),
  productId: z.string().min(1, { message: "Product ID is required" }),
  orderId: z.string().optional(),
  rating: z.number().int().min(1).max(5, { message: "Rating must be between 1 and 5" }),
  comment: z.string().optional(),
  isVerifiedPurchase: z.boolean().optional().default(false),
});

// Schema for creating a review
export const createReviewSchema = reviewSchema;

// Schema for updating a review
export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5, { message: "Rating must be between 1 and 5" }).optional(),
  comment: z.string().optional(),
});

// Schema for admin approval/rejection of a review
export const reviewApprovalSchema = z.object({
  isApproved: z.boolean(),
  rejectionReason: z.string().optional(),
});

// Schema for review query parameters
export const reviewQuerySchema = z.object({
  productId: z.string().optional(),
  userId: z.string().optional(),
  minRating: z.number().int().min(1).max(5).optional(),
  isVerifiedPurchase: z.boolean().optional(),
  isApproved: z.boolean().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10),
  sortBy: z.enum(["createdAt", "rating"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Types derived from schemas
export type CreateReviewDto = z.infer<typeof createReviewSchema>;
export type UpdateReviewDto = z.infer<typeof updateReviewSchema>;
export type ReviewApprovalDto = z.infer<typeof reviewApprovalSchema>;
export type ReviewQueryParams = z.infer<typeof reviewQuerySchema>;

// Review response type
export interface ReviewResponse {
  id: string;
  userId: string;
  productId: string;
  orderId?: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  user?: {
    id: string;
    username: string;
  };
  product?: {
    id: string;
    name: string;
  };
} 