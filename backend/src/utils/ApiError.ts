import HttpStatusCode from './HttpStatusCode';

/**
 * Custom API Error class for standardized error handling
 */
export class ApiError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = HttpStatusCode.INTERNAL_SERVER_ERROR, code: string = 'API_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'ApiError';

    // Maintain stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
} 