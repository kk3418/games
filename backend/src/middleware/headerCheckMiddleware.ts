import { Request, Response, NextFunction } from 'express';

export const validateJsonHeader = (req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType?.includes('application/json')) {
      res.status(415).json({ error: 'Content-Type must be application/json' });
      return;
    }
  }
  next();
};
