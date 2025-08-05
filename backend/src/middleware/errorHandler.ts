import { Request, Response } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('errorHandler');

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error details
  logger.error('Error occurred:', {
    error: {
      message: err.message,
      stack: err.stack,
      statusCode,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body as Record<string, unknown>,
      params: req.params as Record<string, string>,
      query: req.query as Record<string, unknown>,
    },
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env['NODE_ENV'] === 'development' && {
        stack: err.stack,
        details: err,
      }),
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  });
};

export const createError = (
  message: string,
  statusCode: number = 500,
  isOperational: boolean = true
): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = isOperational;
  return error;
};
