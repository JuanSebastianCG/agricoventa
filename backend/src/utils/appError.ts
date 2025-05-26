/**
 * Custom application error class
 * Extends Error to add status code and other properties
 */
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Capturing stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
} 