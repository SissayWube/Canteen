import express, { Request, Response, NextFunction } from 'express';
import Customer from '../models/Customer';
import { requireAuth } from '../middleware/auth';

const router = express.Router();


// Only admins can manage customers
const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
    if (req.session.role !== 'admin') {
        return _res.status(403).json({
            error: 'Forbidden: Admin access required',
            details: `User role is: ${req.session.role || 'undefined'}`
        });
    }
    next();
};

router.use(requireAuth);

// Public (Authenticated) Routes - Accessible by Operators
// GET all customers
router.get('/', async (_req: Request, res: Response) => {
    try {
        const customers = await Customer.find().sort({ name: 1 });
        res.json(customers);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET single customer
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        res.json(customer);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Admin Only Routes
router.use(requireAdmin);

// POST create new customer
router.post('/', async (req: Request, res: Response) => {
    try {
        const customer = await Customer.create(req.body);
        res.status(201).json(customer);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// PUT update customer
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        res.json(customer);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE (or soft-deactivate)
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        res.json({ message: 'Customer deactivated' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
