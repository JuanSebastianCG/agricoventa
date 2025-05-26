import { z } from "zod";

// Base schema for blacklisted token validation
export const blacklistedTokenSchema = z.object({
  token: z.string().min(1, { message: "Token is required" }),
  expiresAt: z.date(),
});

// Schema for adding a token to the blacklist
export const blacklistTokenSchema = z.object({
  token: z.string().min(1, { message: "Token is required" }),
  expiresAt: z.date(),
});

// Types derived from schemas
export type BlacklistedTokenDto = z.infer<typeof blacklistedTokenSchema>;
export type BlacklistTokenDto = z.infer<typeof blacklistTokenSchema>;

// Blacklisted token response type
export interface BlacklistedTokenResponse {
  id: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
} 