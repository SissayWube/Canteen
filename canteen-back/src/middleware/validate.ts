import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import logger from '../config/logger';

/**
 * Validation middleware factory
 * @param schema - Zod schema to validate against
 * @param source - Where to validate from ('body', 'query', 'params')
 */
export const validate = (
    schema: z.ZodSchema,
    source: 'body' | 'query' | 'params' = 'body'
) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = req[source];
            const validated = await schema.parseAsync(data);
            req[source] = validated;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                logger.warn('Validation error', {
                    path: req.path,
                    errors: error.issues, // Fixed: use 'issues' instead of 'errors'
                    data: req[source]
                });

                return res.status(400).json({
                    error: 'Validation failed',
                    details: error.issues.map((issue) => ({ // Fixed: use 'issues' and proper typing
                        field: issue.path.join('.'),
                        message: issue.message
                    }))
                });
            }
            next(error);
        }
    };
};
