import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    logger.warn('Unauthorized access attempt', { path: req.path, method: req.method });
    return res.status(401).json({ error: 'Unauthorized - please log in' });
  }
  next();
};