import { Request, Response, NextFunction } from 'express';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    console.log("Unauth in auth middle")
    return res.status(401).json({ error: 'Unauthorized - please log in' });
  }
  next();
};