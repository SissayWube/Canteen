import { Request, Response, NextFunction } from 'express';

export const requireDeviceKey = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-device-key'] as string;

    if (!apiKey || apiKey !== process.env.DEVICE_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized device' });
    }

    next();
};