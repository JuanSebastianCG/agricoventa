import { z } from "zod";

// Available certification statuses
const CERTIFICATION_STATUSES = ["PENDING", "VERIFIED", "REJECTED"] as const;

// Base schema for user certification validation
export const userCertificationSchema = z.object({
  userId: z.string().min(1, { message: "User ID is required" }),
  certificationName: z.string().min(1, { message: "Certification name is required" }),
  imageUrl: z.string().url({ message: "Image URL must be a valid URL" }),
  status: z.enum(CERTIFICATION_STATUSES).optional().default("PENDING"),
  verifierAdminId: z.string().optional(),
  rejectionReason: z.string().optional(),
});

// Schema for creating a user certification
export const createUserCertificationSchema = userCertificationSchema.omit({ 
  status: true, 
  verifierAdminId: true, 
  rejectionReason: true 
});

// Schema for verifying a certification (admin only)
export const verifyCertificationSchema = z.object({
  adminId: z.string().min(1, { message: "Admin ID is required" }),
  rejectionReason: z.string().optional(),
});

// Schema for user certification query parameters
export const certificationQuerySchema = z.object({
  userId: z.string().optional(),
  status: z.enum(CERTIFICATION_STATUSES).optional(),
  page: z.union([z.string(), z.number()])
    .transform((val) => {
      // Convertir a número si es string
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      // Valor por defecto si no es un número válido
      return isNaN(num) ? 1 : num;
    })
    .optional()
    .default(1),
  limit: z.union([z.string(), z.number()])
    .transform((val) => {
      // Convertir a número si es string
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      // Valor por defecto si no es un número válido
      return isNaN(num) ? 10 : num;
    })
    .optional()
    .default(10),
  sortBy: z.enum(["uploadedAt", "verifiedAt"]).optional().default("uploadedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Types derived from schemas
export type CreateUserCertificationDto = z.infer<typeof createUserCertificationSchema>;
export type VerifyCertificationDto = z.infer<typeof verifyCertificationSchema>;
export type CertificationQueryParams = z.infer<typeof certificationQuerySchema>;

// User certification response type
export interface UserCertificationResponse {
  id: string;
  userId: string;
  certificationName: string;
  imageUrl: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  uploadedAt: Date;
  verifiedAt?: Date;
  verifierAdminId?: string;
  rejectionReason?: string;
  user?: {
    id: string;
    username: string;
  };
  verifierAdmin?: {
    id: string;
    username: string;
  };
} 