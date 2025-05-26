import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendErrorResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';

// Augment Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        userType: string;
        username: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token in Authorization header
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendErrorResponse(res, 'Access denied. No token provided', HttpStatusCode.UNAUTHORIZED);
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return sendErrorResponse(res, 'Access denied. Invalid token format', HttpStatusCode.UNAUTHORIZED);
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Add user to request
    req.user = decoded as {
      userId: string;
      userType: string;
      username: string;
    };
    
    next();
  } catch (error) {
    return sendErrorResponse(res, 'Invalid token', HttpStatusCode.UNAUTHORIZED);
  }
}; 