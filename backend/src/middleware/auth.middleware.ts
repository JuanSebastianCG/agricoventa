import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendErrorResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request with user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        userType: string;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      sendErrorResponse(res, "No authorization token provided", HttpStatusCode.UNAUTHORIZED);
      return;
    }

    // Check if the header starts with "Bearer "
    if (!authHeader.startsWith("Bearer ")) {
      sendErrorResponse(res, "Invalid token format. Must start with 'Bearer '", HttpStatusCode.UNAUTHORIZED);
      return;
    }

    // Extract the token and trim any whitespace
    const token = authHeader.split(" ")[1]?.trim();

    if (!token) {
      sendErrorResponse(res, "No token provided", HttpStatusCode.UNAUTHORIZED);
      return;
    }

    // Verify the token
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as { userId: string; userType: string };

      // Verify that the user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, userType: true, isActive: true }
      });

      if (!user) {
        sendErrorResponse(res, "User not found", HttpStatusCode.UNAUTHORIZED);
        return;
      }

      if (!user.isActive) {
        sendErrorResponse(res, "User account is inactive", HttpStatusCode.UNAUTHORIZED);
        return;
      }

      // Add the user data to the request object
      req.user = {
        userId: user.id,
        userType: user.userType,
      };

      next();
    } catch (jwtError: any) {
      console.error('JWT Verification error:', jwtError);
      
      if (jwtError.name === "TokenExpiredError") {
        sendErrorResponse(res, "Token has expired", HttpStatusCode.UNAUTHORIZED);
        return;
      }
      if (jwtError.name === "JsonWebTokenError") {
        sendErrorResponse(res, "Invalid token format or signature", HttpStatusCode.UNAUTHORIZED);
        return;
      }
      sendErrorResponse(res, "Token verification failed", HttpStatusCode.UNAUTHORIZED);
    }
  } catch (error: any) {
    console.error('Authentication error:', error);
    sendErrorResponse(res, "Authentication failed", HttpStatusCode.UNAUTHORIZED);
  }
};

/**
 * Middleware to authorize users based on roles
 * @param allowedRoles Array of allowed user types
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        sendErrorResponse(res, "Unauthorized", HttpStatusCode.UNAUTHORIZED);
        return;
      }

      // Check if user has an allowed role
      if (!allowedRoles.includes(req.user.userType)) {
        sendErrorResponse(
          res, 
          "Insufficient permissions to access this resource", 
          HttpStatusCode.FORBIDDEN
        );
        return;
      }

      next();
    } catch (error: any) {
      console.error('Authorization error:', error);
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  };
};

