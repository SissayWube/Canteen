import express, { Request, Response, NextFunction } from 'express';
import Employee from '../models/Employee';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Only admins can manage employees
const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
    if (req.session.role !== 'admin') {
        return _res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
};

router.use(requireAuth);
router.use(requireAdmin);

// GET all employees
router.get('/', async (_req: Request, res: Response) => {
    try {
        const employees = await Employee.find().sort({ name: 1 });
        res.json(employees);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET single employee
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) return res.status(404).json({ error: 'Employee not found' });
        res.json(employee);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new employee
router.post('/', async (req: Request, res: Response) => {
    try {
        const employee = await Employee.create(req.body);
        res.status(201).json(employee);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// PUT update employee
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });
        res.json(employee);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE (or soft-deactivate)
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        if (!employee) return res.status(404).json({ error: 'Employee not found' });
        res.json({ message: 'Employee deactivated' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;