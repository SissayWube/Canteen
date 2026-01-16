import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

interface ApiError extends Error {
    statusCode?: number;
    details?: any;
}

export const errorHandler = (
    err: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Log the error
    logger.error(`${req.method} ${req.path} - ${message}`, {
        statusCode,
        errorStack: err.stack,
        requestBody: req.body,
        userId: req.session?.userId,
    });

    // Send error response
    res.status(statusCode).json({
        error: message,
        ...(err.details && { details: err.details }),
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};

// Helper to create errors with status codes
export class AppError extends Error {
    statusCode: number;
    details?: any;

    constructor(message: string, statusCode: number = 500, details?: any) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
