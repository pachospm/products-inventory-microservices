import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { UnauthorizedError } from '../utils/errors';

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (!apiKey || apiKey !== env.API_KEY) {
    return next(new UnauthorizedError());
  }

  next();
}
