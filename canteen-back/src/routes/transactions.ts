// src/routes/transactions.ts
import express, { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import Employee from '../models/Employee';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
    try {
        const {
            page = '1',
            limit = '20',
            from,           // YYYY-MM-DD (start date, inclusive)
            to,             // YYYY-MM-DD (end date, inclusive)
            employeeId,
            department,
            search,
        } = req.query;

        const query: any = {};

        // === Date Range Filter ===
        const now = new Date();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        let rangeStart: Date = todayStart;
        let rangeEnd: Date = todayEnd;

        if (from && typeof from === 'string') {
            const parsedFrom = new Date(from);
            if (isNaN(parsedFrom.getTime())) {
                return res.status(400).json({ error: 'Invalid "from" date format. Use YYYY-MM-DD' });
            }
            parsedFrom.setHours(0, 0, 0, 0);
            rangeStart = parsedFrom;
        }

        if (to && typeof to === 'string') {
            const parsedTo = new Date(to);
            if (isNaN(parsedTo.getTime())) {
                return res.status(400).json({ error: 'Invalid "to" date format. Use YYYY-MM-DD' });
            }
            parsedTo.setHours(23, 59, 59, 999);
            rangeEnd = parsedTo;
        }

        // Validate range
        if (rangeStart > rangeEnd) {
            return res.status(400).json({ error: '"from" date cannot be after "to" date' });
        }

        query.timestamp = { $gte: rangeStart, $lte: rangeEnd };

        // === Employee Filter ===
        if (employeeId && typeof employeeId === 'string') {
            if (!mongoose.Types.ObjectId.isValid(employeeId)) {
                return res.status(400).json({ error: 'Invalid employeeId' });
            }
            query.employee = new mongoose.Types.ObjectId(employeeId);
        }

        // === Department Filter ===
        if (department && typeof department === 'string' && department.trim() !== '') {
            const employeesInDept = await Employee.find({
                department: { $regex: new RegExp(`^${department.trim()}$`, 'i') },
            }).select('_id');

            if (employeesInDept.length === 0) {
                return res.json({ transactions: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
            }
            query.employee = { $in: employeesInDept.map(e => e._id) };
        }

        // === Name Search ===
        if (search && typeof search === 'string' && search.trim() !== '') {
            const matchingEmployees = await Employee.find({
                name: { $regex: search.trim(), $options: 'i' },
            }).select('_id');

            if (matchingEmployees.length === 0) {
                return res.json({ transactions: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
            }
            query.employee = { $in: matchingEmployees.map(e => e._id) };
        }

        // Pagination
        const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        // Execute
        const transactions = await Transaction.find(query)
            .populate('employee', 'name department deviceId')
            .populate('foodItem', 'name code')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Transaction.countDocuments(query);

        res.json({
            transactions,
            dateRange: {
                from: rangeStart.toISOString().split('T')[0],
                to: rangeEnd.toISOString().split('T')[0],
            },
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