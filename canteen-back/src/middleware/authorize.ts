// src/middleware/authorize.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.role !== 'admin') {
        throw new AppError('Admin privileges required', 403);
    }
    next();
};
