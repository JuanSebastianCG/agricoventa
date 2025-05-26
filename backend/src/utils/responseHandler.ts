import { Response } from 'express';
import HttpStatusCode from './HttpStatusCode';

interface SuccessResponse<T> {
  success: true;
  data: T;
}

interface ErrorResponse<T> {
  success: false;
  error: {
    message: T;
    code?: string;
    details?: any;
  };
}

// Success response with data
export const sendSuccessResponse = <T>(
  res: Response,
  data: T,
  status = HttpStatusCode.OK
): Response<SuccessResponse<T>> => {
  return res.status(status).json({ success: true, data });
};

// Success response without data (e.g., for delete operations)
export const sendSuccessNoDataResponse = (
  res: Response,
  message = 'Operation successful',
  status = HttpStatusCode.OK
): Response<SuccessResponse<null>> => {
  return res.status(status).json({ success: true, message });
};

// Error response
export const sendErrorResponse = <T>(
  res: Response,
  message: T,
  status = HttpStatusCode.INTERNAL_SERVER_ERROR,
  code?: string,
  details?: any
): Response<ErrorResponse<T>> => {
  try {
    // Añade encabezados CORS en caso de errores - use set() instead of header() for better compatibility
    if (typeof res.set === 'function') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept');
    }
    
    const errorObject: ErrorResponse<T> = { 
      success: false, 
      error: { 
        message,
        ...(code && { code }),
        ...(details && { details })
      } 
    };
    
    return res.status(status).json(errorObject);
  } catch (err) {
    console.error('Error sending error response:', err);
    // Última opción si todo lo demás falla
    return res.status(500).json({ 
      success: false, 
      error: { message: 'Error while sending error response' } 
    });
  }
};

// Not Found response
export const sendNotFoundResponse = <T>(
  res: Response,
  message: T,
  status = HttpStatusCode.NOT_FOUND
): Response<ErrorResponse<T>> => {
  return sendErrorResponse(res, message, status, 'NOT_FOUND');
};

// Validation Error response
export const sendValidationError = <T>(
  res: Response,
  message: T,
  errors: string[],
  status = HttpStatusCode.BAD_REQUEST
): Response<ErrorResponse<T>> => {
  return sendErrorResponse(res, message, status, 'VALIDATION_ERROR', { errors });
};

// Unauthorized response
export const sendUnauthorizedResponse = <T extends string>(
  res: Response,
  message: T = 'Unauthorized' as T,
  status = HttpStatusCode.UNAUTHORIZED
): Response<ErrorResponse<T>> => {
  return sendErrorResponse(res, message, status, 'UNAUTHORIZED');
};

// Forbidden response
export const sendForbiddenResponse = <T extends string>(
  res: Response,
  message: T = 'Forbidden' as T,
  status = HttpStatusCode.FORBIDDEN
): Response<ErrorResponse<T>> => {
  return sendErrorResponse(res, message, status, 'FORBIDDEN');
};

// Bad Request response
export const sendBadRequestResponse = <T extends string>(
  res: Response,
  message: T,
  status = HttpStatusCode.BAD_REQUEST
): Response<ErrorResponse<T>> => {
  return sendErrorResponse(res, message, status, 'BAD_REQUEST');
};

// CORS Error response
export const sendCorsErrorResponse = (
  res: Response,
  message = 'CORS policy violation. Cross-origin request not allowed.',
  status = HttpStatusCode.FORBIDDEN
): Response<ErrorResponse<string>> => {
  return sendErrorResponse(
    res, 
    message, 
    status, 
    'CORS_ERROR',
    { 
      suggestion: 'Check that your request includes proper CORS headers and that the server is configured to accept requests from your origin.' 
    }
  );
};
