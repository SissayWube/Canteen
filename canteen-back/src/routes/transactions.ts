// src/routes/transactions.ts
import express, { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import Employee from '../models/Employee';
import { requireAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = express.Router();

router.use(requireAuth); // Operators and admins can view

router.get('/', async (req: Request, res: Response) => {
    try {
        const {
            page = '1',
            limit = '20',
            date,           // YYYY-MM-DD
            employeeId,
            search,         // Search by employee name
        } = req.query;

        // Build query object with proper typing
        const query: any = {};

        // Date filter
        if (date && typeof date === 'string') {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setHours(23, 59, 59, 999);
            query.timestamp = { $gte: start, $lte: end };
        } else {
            // Default: today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            query.timestamp = { $gte: today, $lt: tomorrow };
        }

        // Direct employee filter
        if (employeeId && typeof employeeId === 'string') {
            if (mongoose.Types.ObjectId.isValid(employeeId)) {
                query.employee = new mongoose.Types.ObjectId(employeeId);
            }
        }

        // Search by employee name
        if (search && typeof search === 'string' && search.trim() !== '') {
            const matchingEmployees = await Employee.find({
                name: { $regex: search.trim(), $options: 'i' },
            }).select('_id');

            if (matchingEmployees.length > 0) {
                query.employee = { $in: matchingEmployees.map(e => e._id) };
            } else {
                // No matches → return empty result early
                return res.json({
                    transactions: [],
                    pagination: { page: 1, limit: 20, total: 0, pages: 0 },
                });
            }
        }

        // Pagination
        const pageNum = parseInt(page as string, 10) || 1;
        const limitNum = parseInt(limit as string, 10) || 20;
        const skip = (pageNum - 1) * limitNum;

        // Execute queries
        const transactions = await Transaction.find(query)
            .populate('employee', 'name department deviceId')
            .populate('foodItem', 'name code')
            .sort({ timestamp: -1 })
            .limit(limitNum)
            .skip(skip);

        const total = await Transaction.countDocuments(query);

        res.json({
            transactions,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (error: any) {
        console.error('Transaction fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

export default router;