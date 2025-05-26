import { z } from 'zod';

// Base schema for Category
export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  parentId: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date().nullish(),
});

// Schema for creating a new category
export const createCategorySchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().optional().nullish(),
  parentId: z.string().optional().nullish(),
});

// Schema for updating an existing category (all fields optional)
export const updateCategorySchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }).optional(),
  description: z.string().optional().nullish(),
  parentId: z.string().optional().nullish(),
});

// Query parameters for fetching categories
export const categoryQuerySchema = z.object({
  parentId: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'Parent ID must be a valid ObjectId' }).optional(),
  includeChildren: z.coerce.boolean().optional().default(false),
  includeParent: z.coerce.boolean().optional().default(false),
  level: z.coerce.number().int().min(1).max(2).optional(),
});

// Type for creating a category
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;

// Type for updating a category
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;

// Type for category query parameters
export type CategoryQueryDto = z.infer<typeof categoryQuerySchema>;

// Interface for Category response (can include parent and children)
export interface CategoryResponse {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  parent?: CategoryResponse | null;     // Optional parent category
  children?: CategoryResponse[];    // Optional list of child categories
  // Add productCount or recommendationCount if needed later
} 