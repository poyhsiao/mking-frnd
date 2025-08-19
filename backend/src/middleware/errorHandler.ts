import { NextFunction, Request, Response } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('errorHandler');

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    validation?: ValidationError[];
    stack?: string;
  };
  timestamp: string;
  path: string;
  requestId?: string;
}

const getErrorCode = (err: AppError): string => {
  if (err.code) return err.code;

  const statusCode = err.statusCode || 500;
  switch (statusCode) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'VALIDATION_ERROR';
    case 429:
      return 'TOO_MANY_REQUESTS';
    case 500:
      return 'INTERNAL_SERVER_ERROR';
    case 502:
      return 'BAD_GATEWAY';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    default:
      return 'UNKNOWN_ERROR';
  }
};

interface PrismaError {
  code: string;
  meta?: {
    target?: string[];
    field_name?: string;
  };
}

interface ValidationErrorInput {
  details?: unknown;
  errors?: unknown;
  isJoi?: boolean;
}

const handlePrismaError = (err: PrismaError): AppError => {
  const error = new Error() as AppError;

  switch (err.code) {
    case 'P2002':
      error.message = 'A record with this data already exists';
      error.statusCode = 409;
      error.code = 'DUPLICATE_RECORD';
      error.details = { constraint: err.meta?.target };
      break;
    case 'P2025':
      error.message = 'Record not found';
      error.statusCode = 404;
      error.code = 'RECORD_NOT_FOUND';
      break;
    case 'P2003':
      error.message = 'Foreign key constraint failed';
      error.statusCode = 400;
      error.code = 'FOREIGN_KEY_CONSTRAINT';
      error.details = { field: err.meta?.field_name };
      break;
    default:
      error.message = 'Database operation failed';
      error.statusCode = 500;
      error.code = 'DATABASE_ERROR';
      error.details = { prismaCode: err.code };
  }

  return error;
};

const handleValidationError = (err: ValidationErrorInput): AppError => {
  const error = new Error('Validation failed') as AppError;
  error.statusCode = 422;
  error.code = 'VALIDATION_ERROR';

  // Handle different validation error formats
  if (err.details) {
    error.details = { validation: err.details };
  } else if (err.errors) {
    error.details = { validation: err.errors };
  }

  return error;
};

interface ErrorWithName {
  name?: string;
  message?: string;
  stack?: string;
  isJoi?: boolean;
}

const isPrismaError = (err: unknown): err is PrismaError => {
  return typeof err === 'object' && err !== null && 'code' in err;
};

const isValidationError = (err: unknown): err is ValidationErrorInput => {
  return (
    typeof err === 'object' &&
    err !== null &&
    ('details' in err || 'errors' in err || 'isJoi' in err)
  );
};

const hasName = (err: unknown): err is ErrorWithName => {
  return typeof err === 'object' && err !== null && 'name' in err;
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  let processedError: AppError;

  // Convert unknown error to AppError
  if (err instanceof Error) {
    processedError = err as AppError;
  } else {
    processedError = new Error('Unknown error occurred') as AppError;
    processedError.statusCode = 500;
  }

  // Handle specific error types
  if (
    hasName(err) &&
    err.name === 'PrismaClientKnownRequestError' &&
    isPrismaError(err)
  ) {
    processedError = handlePrismaError(err);
  } else if (
    hasName(err) &&
    (err.name === 'ValidationError' || (isValidationError(err) && err.isJoi))
  ) {
    processedError = handleValidationError(err as ValidationErrorInput);
  } else if (hasName(err) && err.name === 'JsonWebTokenError') {
    processedError = createError('Invalid token', 401, true, 'INVALID_TOKEN');
  } else if (hasName(err) && err.name === 'TokenExpiredError') {
    processedError = createError('Token expired', 401, true, 'TOKEN_EXPIRED');
  } else if (
    hasName(err) &&
    err.name === 'SyntaxError' &&
    err.message?.includes('JSON')
  ) {
    processedError = createError(
      'Invalid JSON format',
      400,
      true,
      'INVALID_JSON'
    );
  }

  const statusCode = processedError.statusCode || 500;
  const message = processedError.message || 'Internal Server Error';
  const errorCode = getErrorCode(processedError);

  // Generate request ID for tracking
  const requestId =
    (req.headers['x-request-id'] as string) ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Log error details with appropriate level
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  const errorName = hasName(err) ? err.name : 'Unknown';
  const errorStack = hasName(err) ? err.stack : undefined;

  logger[logLevel]('Request error:', {
    requestId,
    error: {
      name: errorName,
      message: processedError.message,
      code: errorCode,
      statusCode,
      stack: errorStack,
      details: processedError.details,
    },
    request: {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      params: req.params as Record<string, string>,
      query: req.query as Record<string, unknown>,
      ...(statusCode >= 500 && {
        headers: req.headers,
        body: req.body as Record<string, unknown>,
      }),
    },
  });

  // Prepare error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  // Add optional properties conditionally
  if (processedError.details) {
    errorResponse.error.details = processedError.details;
  }

  if (process.env['NODE_ENV'] === 'development' && errorStack) {
    errorResponse.error.stack = errorStack;
  }

  if (requestId) {
    errorResponse.requestId = requestId;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

export const createError = (
  message: string,
  statusCode: number = 500,
  isOperational: boolean = true,
  code?: string
): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = isOperational;
  if (code) {
    error.code = code;
  }
  return error;
};
