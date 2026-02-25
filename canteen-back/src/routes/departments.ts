import express, { Request, Response, NextFunction } from 'express';
import Department from '../models/Department.js';
import Customer from '../models/Customer.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

// GET all departments (sorted by name)
router.get('/', async (_req: Request, res: Response) => {
    try {
        const departments = await Department.find().sort({ name: 1 });
        res.json(departments);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ── Admin-only routes ───────────────────────────────────────
const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
    if (req.session.role !== 'admin') {
        return _res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
};

router.use(requireAdmin);

// POST create department
router.post('/', async (req: Request, res: Response) => {
    try {
        const department = await Department.create(req.body);
        res.status(201).json(department);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'A department with this name already exists' });
        }
        res.status(400).json({ error: error.message });
    }
});

// PUT update department
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!department) return res.status(404).json({ error: 'Department not found' });
        res.json(department);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'A department with this name already exists' });
        }
        res.status(400).json({ error: error.message });
    }
});

// DELETE department (only if no customers reference it)
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) return res.status(404).json({ error: 'Department not found' });

        // Check if any active customers belong to this department
        const customerCount = await Customer.countDocuments({
            department: department.name,
            deletedAt: null,
        });

        if (customerCount > 0) {
            return res.status(400).json({
                error: `Cannot delete: ${customerCount} customer(s) are assigned to this department`,
            });
        }

        await Department.findByIdAndDelete(req.params.id);
        res.json({ message: 'Department deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
