import { z } from "zod";

// Cart item schema
export const cartItemSchema = z.object({
  productId: z.string().min(1, { message: "Product ID is required" }),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

// Base schema for cart validation
export const cartSchema = z.object({
  userId: z.string().min(1, { message: "User ID is required" }),
  items: z.array(cartItemSchema).optional(),
});

// Schema for adding an item to the cart
export const addToCartSchema = cartItemSchema;

// Schema for updating a cart item quantity
export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

// Types derived from schemas
export type CartDto = z.infer<typeof cartSchema>;
export type AddToCartDto = z.infer<typeof addToCartSchema>;
export type UpdateCartItemDto = z.infer<typeof updateCartItemSchema>;
export type CartItemDto = z.infer<typeof cartItemSchema>;

// Cart item response type
export interface CartItemResponse {
  id: string;
  productId: string;
  quantity: number;
  addedAt: Date;
  product?: {
    id: string;
    name: string;
    basePrice: number;
    stockQuantity: number;
    unitMeasure: string;
    images?: Array<{
      id: string;
      imageUrl: string;
      isPrimary: boolean;
    }>;
  };
}

// Cart response type
export interface CartResponse {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
  items: CartItemResponse[];
  totalItems: number;
  totalAmount: number;
} 