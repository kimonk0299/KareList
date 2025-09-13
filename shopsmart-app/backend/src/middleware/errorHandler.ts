import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { logger } from '../config/logger';
import { ERROR_CODES } from '@/shared/constants';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = ERROR_CODES.INTERNAL_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let code = ERROR_CODES.INTERNAL_ERROR;

  // Handle known error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
  } else if (error instanceof PrismaClientKnownRequestError) {
    // Handle Prisma errors
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Resource already exists';
        code = ERROR_CODES.ALREADY_EXISTS;
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Resource not found';
        code = ERROR_CODES.NOT_FOUND;
        break;
      default:
        statusCode = 500;
        message = 'Database error';
        code = ERROR_CODES.INTERNAL_ERROR;
    }
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
    code = ERROR_CODES.INVALID_INPUT;
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = ERROR_CODES.UNAUTHORIZED;
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = ERROR_CODES.TOKEN_EXPIRED;
  }

  // Log error details
  logger.error('Request error', {
    error: {
      message: error.message,
      stack: error.stack,
      code: error instanceof AppError ? error.code : 'UNKNOWN'
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    code,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error
    })
  });
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};