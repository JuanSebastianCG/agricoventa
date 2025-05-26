import { Request, Response, NextFunction } from 'express';
import { sendErrorResponse, sendNotFoundResponse, sendCorsErrorResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';

/**
 * Error response interface
 */
export interface ErrorResponse {
  success: boolean;
  message: string;
  stack?: string;
}

/**
 * Custom error class with status code
 */
export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not found middleware - Handles 404 errors for routes that don't exist
 */
export const notFound = (req: Request, res: Response): void => {
  sendNotFoundResponse(res, `Resource not found - ${req.originalUrl}`);
};

/**
 * Determine if error is CORS related
 */
const isCorsError = (err: Error): boolean => {
  return err.name === 'CORSError' || err.message.includes('CORS');
};

/**
 * Get error status code
 */
const getErrorStatusCode = (err: Error | ApiError): number => {
  return 'statusCode' in err ? err.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
};

/**
 * Get error details for development environment
 */
const getErrorDetails = (err: Error): Record<string, unknown> | undefined => {
  return process.env.NODE_ENV !== 'production' 
    ? { stack: err.stack, name: err.name } 
    : undefined;
};

/**
 * Error handler middleware - Handles all errors in the application
 */
export const errorHandler = (err: Error | ApiError, req: Request, res: Response, next: NextFunction): void => {
  try {
    console.error('Error:', err);

    // Handle CORS errors specifically
    if (isCorsError(err)) {
      sendCorsErrorResponse(res);
      return;
    }

    // Get error details
    const statusCode = getErrorStatusCode(err);
    const message = err.message || 'Internal Server Error';
    const errorDetails = getErrorDetails(err);

    // Send appropriate error response
    sendErrorResponse(res, { message, ...errorDetails }, statusCode);
  } catch (internalError) {
    // Fallback for errors in the error handler
    console.error('Error in error handler:', internalError);
    res.status(500).json({
      success: false,
      error: { message: 'An unexpected error occurred while processing the error' }
    });
  }
};
