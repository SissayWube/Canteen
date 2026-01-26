import { Request, Response, NextFunction } from 'express';

/**
 * MongoDB Sanitization Middleware
 * Prevents NoSQL injection by removing dangerous operators from user input
 */

const sanitizeValue = (value: any): any => {
    if (value === null || value === undefined) {
        return value;
    }

    // Handle arrays
    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }

    // Handle objects
    if (typeof value === 'object') {
        const sanitized: any = {};

        for (const [key, val] of Object.entries(value)) {
            // Skip keys that start with $ or contain dots
            if (key.startsWith('$') || key.includes('.')) {
                continue;
            }
            sanitized[key] = sanitizeValue(val);
        }

        return sanitized;
    }

    // Return primitives as-is
    return value;
};

export const mongoSanitize = (req: Request, res: Response, next: NextFunction) => {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
        const sanitizedBody = sanitizeValue(req.body);
        // Body is usually reassignable, but for consistency we can clear and assign
        Object.keys(req.body).forEach(key => delete req.body[key]);
        Object.assign(req.body, sanitizedBody);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
        const sanitizedQuery = sanitizeValue(req.query);
        // Property query is often a getter only in modern Express/IncomingMessage
        // So we delete individual keys and re-assign properties found in sanitizedQuery
        Object.keys(req.query).forEach(key => delete req.query[key]);
        Object.assign(req.query, sanitizedQuery);
    }

    // Sanitize route parameters
    if (req.params && typeof req.params === 'object') {
        const sanitizedParams = sanitizeValue(req.params);
        Object.keys(req.params).forEach(key => delete req.params[key]);
        Object.assign(req.params, sanitizedParams);
    }

    next();
};
