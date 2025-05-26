import { z } from "zod";

// Base schema for product image validation
export const productImageSchema = z.object({
  productId: z.string().min(1, { message: "Product ID is required" }),
  imageUrl: z.string().url({ message: "Image URL must be a valid URL" }),
  altText: z.string().optional(),
  displayOrder: z.number().int().nonnegative().optional().default(0),
  isPrimary: z.boolean().optional().default(false),
});

// Schema for creating a product image
export const createProductImageSchema = productImageSchema;

// Schema for updating a product image
export const updateProductImageSchema = z.object({
  imageUrl: z.string().url({ message: "Image URL must be a valid URL" }).optional(),
  altText: z.string().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
  isPrimary: z.boolean().optional(),
});

// Schema for setting a primary image
export const setPrimaryImageSchema = z.object({
  isPrimary: z.literal(true),
});

// Types derived from schemas
export type CreateProductImageDto = z.infer<typeof createProductImageSchema>;
export type UpdateProductImageDto = z.infer<typeof updateProductImageSchema>;
export type SetPrimaryImageDto = z.infer<typeof setPrimaryImageSchema>;

// Product image response type
export interface ProductImageResponse {
  id: string;
  productId: string;
  imageUrl: string;
  altText?: string;
  displayOrder: number;
  isPrimary: boolean;
  createdAt: Date;
} 