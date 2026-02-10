import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import pino from 'pino';

const logger = pino({ name: 'products-service' });

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      errors: [
        {
          status: String(err.statusCode),
          title: err.title,
          detail: err.message,
        },
      ],
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');

  res.status(500).json({
    errors: [
      {
        status: '500',
        title: 'Internal Server Error',
        detail: 'An unexpected error occurred',
      },
    ],
  });
}
