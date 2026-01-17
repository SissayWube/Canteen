import express, { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

router.use(requireAuth);
router.use(requireAdmin);

// GET /api/audit
router.get('/', async (req: Request, res: Response) => {
    try {
        const { page = '1', limit = '50', action } = req.query;

        const query: any = {};
        if (action) {
            query.action = { $regex: action as string, $options: 'i' };
        }

        const pageNum = Math.max(1, parseInt(page as string, 10));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10)));
        const skip = (pageNum - 1) * limitNum;

        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await AuditLog.countDocuments(query);

        res.json({
            logs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
