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
// GET all customers with pagination and filtering
router.get('/', async (req: Request, res: Response) => {
    try {
        const {
            page = '1',
            limit = '20',
            search,
            department,
            isActive,
        } = req.query;

        const query: any = {};

        // Search by name
        if (search && typeof search === 'string' && search.trim() !== '') {
            query.name = { $regex: search.trim(), $options: 'i' };
        }

        // Filter by department
        if (department && typeof department === 'string' && department.trim() !== '') {
            query.department = { $regex: new RegExp(`^${department.trim()}$`, 'i') };
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
        const customers = await Customer.find(query)
            .sort({ name: 1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Customer.countDocuments(query);

        res.json({
            customers,
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

// DELETE (Soft Delete)
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { isActive: false, deletedAt: new Date() },
            { new: true }
        );
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        res.json({ message: 'Customer deactivated and soft-deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE hard - permanently delete customer
router.delete('/hard/:id', async (req: Request, res: Response) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        res.json({ message: 'Customer permanently deleted', customer });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
