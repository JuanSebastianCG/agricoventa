/**
 * Request Validation Middleware
 *
 * This middleware validates incoming requests against Zod schemas.
 * It can validate request body, query parameters, and URL parameters.
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendErrorResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';

/**
 * Middleware for validating request data using Zod schemas
 * @param schema Zod schema to validate against
 * @returns Express middleware function
 */
export const validateRequest = (schema: z.ZodType<any, any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body against schema
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        // Format error messages
        const errorMessages = result.error.errors.map((error) => ({
          path: error.path.join("."),
          message: error.message,
        }));
        
        sendErrorResponse(
          res,
          "Validation error",
          HttpStatusCode.BAD_REQUEST,
          "VALIDATION_ERROR",
          errorMessages
        );
        return;
      }
      
      // Replace req.body with validated data
      req.body = result.data;
      next();
    } catch (error: any) {
      sendErrorResponse(
        res,
        error.message || "Validation error",
        HttpStatusCode.BAD_REQUEST
      );
    }
  };
};

/**
 * Middleware for validating query parameters using Zod schemas
 * @param schema Zod schema to validate against
 * @returns Express middleware function
 */
export const validateQuery = (schema: z.ZodType<any, any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate query parameters against schema
      const result = schema.safeParse(req.query);
      
      if (!result.success) {
        // Format error messages
        const errorMessages = result.error.errors.map((error) => ({
          path: error.path.join("."),
          message: error.message,
        }));
        
        sendErrorResponse(
          res,
          "Query validation error",
          HttpStatusCode.BAD_REQUEST,
          "VALIDATION_ERROR",
          errorMessages
        );
        return;
      }
      
      // Replace req.query with validated data
      req.query = result.data;
      next();
    } catch (error: any) {
      sendErrorResponse(
        res,
        error.message || "Query validation error",
        HttpStatusCode.BAD_REQUEST
      );
    }
  };
};

/**
 * Middleware for validating URL parameters using Zod schemas
 * @param schema Zod schema to validate against
 * @returns Express middleware function
 */
export const validateParams = (schema: z.ZodType<any, any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate URL parameters against schema
      const result = schema.safeParse(req.params);
      
      if (!result.success) {
        // Format error messages
        const errorMessages = result.error.errors.map((error) => ({
          path: error.path.join("."),
          message: error.message,
        }));
        
        sendErrorResponse(
          res,
          "Parameter validation error",
          HttpStatusCode.BAD_REQUEST,
          "VALIDATION_ERROR",
          errorMessages
        );
        return;
      }
      
      // Replace req.params with validated data
      req.params = result.data;
      next();
    } catch (error: any) {
      sendErrorResponse(
        res,
        error.message || "Parameter validation error",
        HttpStatusCode.BAD_REQUEST
      );
    }
  };
};
