import { Request, Response, NextFunction } from 'express';
import { sendErrorResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';

/**
 * Admin role middleware
 * Checks if the authenticated user has admin privileges
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user exists in request (should be set by auth middleware)
    if (!req.user) {
      return sendErrorResponse(res, 'Access denied. Not authenticated', HttpStatusCode.UNAUTHORIZED);
    }
    
    // Check if user has admin role
    if (req.user.userType !== 'ADMIN') {
      return sendErrorResponse(res, 'Access denied. Admin privileges required', HttpStatusCode.FORBIDDEN);
    }
    
    next();
  } catch (error) {
    return sendErrorResponse(res, 'Authorization failed', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Seller role middleware
 * Checks if the authenticated user is a seller
 */
export const isSeller = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user exists in request (should be set by auth middleware)
    if (!req.user) {
      return sendErrorResponse(res, 'Access denied. Not authenticated', HttpStatusCode.UNAUTHORIZED);
    }
    
    // Check if user has seller role
    if (req.user.userType !== 'SELLER' && req.user.userType !== 'ADMIN') {
      return sendErrorResponse(res, 'Access denied. Seller privileges required', HttpStatusCode.FORBIDDEN);
    }
    
    next();
  } catch (error) {
    return sendErrorResponse(res, 'Authorization failed', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
}; 