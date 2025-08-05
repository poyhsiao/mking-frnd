import { NextFunction, Request, Response } from 'express';
import { createError } from './errorHandler';

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = createError(
    `Route ${req.method} ${req.originalUrl} not found`,
    404
  );
  next(error);
};
