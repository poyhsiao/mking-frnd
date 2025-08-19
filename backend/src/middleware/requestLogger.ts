import { NextFunction, Request, Response } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('requestLogger');

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  // Override res.end to log response
  const originalEnd = res.end.bind(res);
  const originalEndAny = originalEnd as any;
  res.end = ((...args: any[]) => {
    const duration = Date.now() - startTime;

    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    // Call original end with all arguments
    return originalEndAny(...args);
  }) as any;

  next();
};
