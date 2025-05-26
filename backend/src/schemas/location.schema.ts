import { z } from "zod";

// Base schema for location validation
export const locationSchema = z.object({
  addressLine1: z.string().min(1, { message: "Address line 1 is required" }),
  addressLine2: z.string().optional(),
  city: z.string().min(1, { message: "City is required" }),
  department: z.string().min(1, { message: "Department is required" }),
  postalCode: z.string().optional(),
  country: z.string().default("Colombia"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// Schema for creating a location
export const createLocationSchema = locationSchema;

// Schema for updating a location - all fields are optional
export const updateLocationSchema = locationSchema.partial();

// Types derived from schemas
export type CreateLocationDto = z.infer<typeof createLocationSchema>;
export type UpdateLocationDto = z.infer<typeof updateLocationSchema>;

// Location response type
export interface LocationResponse {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  department: string;
  postalCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt?: Date;
} 