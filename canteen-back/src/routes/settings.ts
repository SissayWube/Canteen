import express, { Request, Response, NextFunction } from 'express';
import Settings from '../models/Settings';
import { requireAuth } from '../middleware/auth';
import { AuditService } from '../services/AuditService';

const router = express.Router();

const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
    if (req.session.role !== 'admin') {
        return _res.status(403).json({
            error: 'Admin access required',
            details: `User role is: ${req.session.role || 'undefined'}`
        });
    }
    next();
};

router.use(requireAuth);

// GET current settings
router.get('/', async (_req: Request, res: Response) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            // Create default on first access
            settings = await Settings.create({ dailyMealLimit: 3 });
        }
        res.json(settings);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH update settings
router.patch('/', requireAdmin, async (req: Request, res: Response) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
        }

        if (req.body.dailyMealLimit !== undefined) {
            settings.dailyMealLimit = req.body.dailyMealLimit;
        }
        if (req.body.companyName !== undefined) {
            settings.companyName = req.body.companyName;
        }
        settings.updatedBy = req.session.userId as any;

        await settings.save();

        AuditService.log('Update Settings', { updates: req.body }, { req }, 'Settings', settings._id.toString());

        res.json(settings);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;