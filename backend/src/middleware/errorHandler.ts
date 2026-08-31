import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error in ${req.method} ${req.originalUrl}:`, err);

  if (err.name === 'ZodError') {
    const message = err.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ') || 'Validation error';
    return sendError(res, message, 400);
  }

  if (err.code === 'P2002') {
    const target = (err.meta?.target as string[])?.join(', ') || 'field';
    return sendError(res, `A record with this ${target} already exists.`, 409);
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500 
    ? 'An unexpected internal error occurred.' 
    : err.message || 'Internal server error';

  return sendError(res, message, statusCode);
};
