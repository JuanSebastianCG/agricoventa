import { z } from "zod";

// Base schema for user validation
export const userSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  userType: z.enum(["SELLER", "BUYER", "ADMIN"]).default("BUYER"),
  primaryLocationId: z.string().optional(),
  subscriptionType: z.enum(["NORMAL", "PREMIUM"]).default("NORMAL"),
});

// Schema for creating a user
export const createUserSchema = userSchema;

// Schema for updating a user - all fields are optional except for id
export const updateUserSchema = userSchema.partial().extend({
  // Don't allow changing username
  username: z.string().optional(),
});

// Schema for user login
export const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

// Schema for change password
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
});

// Types derived from schemas
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

// User response type (excludes sensitive data)
export interface UserResponse {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  userType: string;
  primaryLocationId?: string;
  subscriptionType: string;
  isActive: boolean;
  createdAt: Date;
} 