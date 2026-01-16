import express, { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Middleware: Only admins can manage users
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.role !== 'admin') {
        return res.status(403).json({
            error: 'Forbidden: Admin access required',
            details: `User role is: ${req.session.role || 'undefined'}`
        });
    }
    next();
};

router.use(requireAuth);
router.use(requireAdmin); // All routes below require admin role

// GET all users (operators + admins) with pagination and filtering
router.get('/', async (req: Request, res: Response) => {
    try {
        const {
            page = '1',
            limit = '20',
            search,
            role,
            isActive,
        } = req.query;

        const query: any = {};

        // Search by username or fullName
        if (search && typeof search === 'string' && search.trim() !== '') {
            query.$or = [
                { username: { $regex: search.trim(), $options: 'i' } },
                { fullName: { $regex: search.trim(), $options: 'i' } }
            ];
        }

        // Filter by role
        if (role && typeof role === 'string' && ['admin', 'operator'].includes(role)) {
            query.role = role;
        }

        // Filter by active status
        if (isActive !== undefined && typeof isActive === 'string') {
            query.isActive = isActive === 'true';
        }

        // Pagination
        const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        // Execute query
        const users = await User.find(query)
            .select('-password')
            .sort({ username: 1 })
            .skip(skip)
            .limit(limitNum);

        const total = await User.countDocuments(query);

        res.json({
            users,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new user (operator or admin)
router.post('/', async (req: Request, res: Response) => {
    try {
        const { username, password, role = 'operator', fullName } = req.body;
        const hashed = await bcrypt.hash(password, 12);
        const user = await User.create({ username, password: hashed, role, fullName });
        res.status(201).json({ message: 'User created', user: { username: user.username, role: user.role } });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// PUT update user
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const updates = req.body;
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 12);
        }
        const user = await User.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        }).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE user
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;