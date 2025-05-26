import { z } from "zod";
import { CategoryResponse } from './category.schema';

// Placeholder for ProductImage schema if not defined elsewhere
const productImageSchema = z.object({
  id: z.string(),
  imageUrl: z.string().url(),
  altText: z.string().optional().nullable(),
  isPrimary: z.boolean(),
  displayOrder: z.number().int(),
});

// Base schema for product validation
export const productSchema = z.object({
  name: z.string().min(1, { message: "Product name is required" }),
  description: z.string().optional().nullable(),
  basePrice: z.coerce.number().positive("Price must be a positive number"),
  stockQuantity: z.coerce.number().int().min(0, { message: 'Stock quantity cannot be negative' }).default(0),
  unitMeasure: z.string().min(1, { message: 'Unit measure is required' }),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'Category ID must be a valid ObjectId' }).optional().nullable(),
  originLocationId: z.string().min(1, { message: "Location ID is required" }),
  sellerId: z.string().min(1, { message: "Seller ID is required" }),
  isFeatured: z.coerce.boolean().optional().default(false),
  isActive: z.coerce.boolean().optional().default(true),
});

// Schema for creating a product
export const createProductSchema = productSchema;

// Schema for updating a product - all fields are optional
export const updateProductSchema = productSchema.partial().extend({
  images: z.array(z.object({ 
    imageUrl: z.string().url(), 
    altText: z.string().optional().nullable(), 
    isPrimary: z.boolean().optional() 
  })).optional(),
  deleteExistingImages: z.boolean().optional(),
  imagesToDelete: z.array(z.string()).optional(),
});

// Schema for product query parameters
export const productQuerySchema = z.object({
  sellerId: z.string().optional(),
  categoryId: z.string().optional(),
  originLocationId: z.string().optional(),
  name: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  unitMeasure: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional().default(true),
  search: z.string().optional(),
  city: z.string().optional(),
  department: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  sortBy: z.enum(['name', 'basePrice', 'createdAt', 'stockQuantity']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Types derived from schemas
export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
export type ProductQueryParams = z.infer<typeof productQuerySchema>;

// Product response type
export interface ProductResponse {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stockQuantity: number;
  unitMeasure: string;
  sellerId: string;
  categoryId?: string | null;
  originLocationId: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date | null;
  images: Array<{
    id: string;
    imageUrl: string;
    altText?: string | null;
    isPrimary: boolean;
    displayOrder: number;
  }>;
  seller?: {
    id: string;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  category?: CategoryResponse | null;
  originLocation?: {
    id: string;
    addressLine1: string;
    city: string;
    department: string;
  };
  region?: string;
  averageRating?: number | null;
  reviewCount?: number;
} 
