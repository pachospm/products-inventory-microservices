import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          status: '422',
          title: 'Validation Error',
          detail: e.message,
          source: { pointer: `/${e.path.join('/')}` },
        }));

        _res.status(422).json({ errors });
        return;
      }
      next(err);
    }
  };
}
