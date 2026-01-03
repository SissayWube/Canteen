import express, { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Middleware: Only admins can manage users
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
};

router.use(requireAuth);
router.use(requireAdmin); // All routes below require admin role

// GET all users (operators + admins)
router.get('/', async (_req: Request, res: Response) => {
    const users = await User.find().select('-password').sort({ username: 1 });
    res.json(users);
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