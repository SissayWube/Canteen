// src/routes/transactions.ts
import express, { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import Employee from '../models/Employee';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.use(requireAuth); // Operators & admins

router.get('/', async (req: Request, res: Response) => {
    try {
        const {
            page = '1',
            limit = '20',
            date,           // YYYY-MM-DD format
            employeeId,     // Specific employee _id
            department,     // Department name (string)
            search,         // Free text search in employee name
        } = req.query;

        const query: any = {};

        // === Date Filter (required for your use cases) ===
        if (date && typeof date === 'string') {
            const start = new Date(date);
            if (isNaN(start.getTime())) {
                return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
            }
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setHours(23, 59, 59, 999);
            query.timestamp = { $gte: start, $lte: end };
        } else {
            // If no date provided, default to today (optional – you can make it required)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            query.timestamp = { $gte: today, $lt: tomorrow };
        }

        // === Filter by Specific Employee ===
        if (employeeId && typeof employeeId === 'string') {
            if (!mongoose.Types.ObjectId.isValid(employeeId)) {
                return res.status(400).json({ error: 'Invalid employeeId' });
            }
            query.employee = new mongoose.Types.ObjectId(employeeId);
        }

        // === Filter by Department ===
        if (department && typeof department === 'string' && department.trim() !== '') {
            const employeesInDept = await Employee.find({
                department: { $regex: new RegExp(`^${department.trim()}$`, 'i') },
            }).select('_id');

            if (employeesInDept.length === 0) {
                return res.json({
                    transactions: [],
                    pagination: { page: 1, limit: 20, total: 0, pages: 0 },
                });
            }

            query.employee = { $in: employeesInDept.map(e => e._id) };
        }

        // === Free Text Search in Employee Name (optional bonus) ===
        if (search && typeof search === 'string' && search.trim() !== '') {
            const matchingEmployees = await Employee.find({
                name: { $regex: search.trim(), $options: 'i' },
            }).select('_id');

            if (matchingEmployees.length === 0) {
                return res.json({
                    transactions: [],
                    pagination: { page: 1, limit: 20, total: 0, pages: 0 },
                });
            }
            query.employee = { $in: matchingEmployees.map(e => e._id) };
        }

        // Pagination
        const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        // Fetch transactions
        const transactions = await Transaction.find(query)
            .populate('employee', 'name department deviceId')
            .populate('foodItem', 'name code')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limitNum);

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