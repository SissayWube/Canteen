// src/routes/analysis.ts
import express, { Request, Response } from 'express';
import Order from '../models/Order';
import Employee from '../models/Employee';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.use(requireAuth); // Admin only? Or operator too? (Assume admin for now)

const requireAdmin = (req: Request, res: Response, next: Function) => {
    if (req.session.role !== 'admin') {
        return res.status(403).json({
            error: 'Admin access required',
            details: `User role is: ${req.session.role || 'undefined'}`
        });
    }
    next();
};

router.use(requireAdmin);

// GET /api/analysis?type=department&from=2026-01-01&to=2026-01-31
router.get('/', async (req: Request, res: Response) => {
    try {
        const { type = 'department', from, to, employeeId, department } = req.query;

        const match: any = {};
        if (from || to) {
            match.timestamp = {};
            if (from) match.timestamp.$gte = new Date(from as string);
            if (to) {
                const toDate = new Date(to as string);
                toDate.setUTCHours(23, 59, 59, 999);
                match.timestamp.$lte = toDate;
            }
        }

        if (employeeId) {
            match['employee._id'] = new mongoose.Types.ObjectId(employeeId as string);
        }

        if (department) {
            match['employee.department'] = department;
        }

        let groupBy;
        switch (type) {
            case 'department':
                groupBy = '$employee.department';
                break;
            case 'employee':
                groupBy = '$employee._id';
                break;
            case 'date':
                groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } };
                break;
            case 'summary':
                groupBy = null;
                break;
            case 'orders':
                groupBy = 'orders';
                break;
            default:
                groupBy = 'orders';
        }

        let aggregation;

        if (groupBy === 'orders') {
            aggregation = await Order.aggregate([
                { $lookup: { from: 'employees', localField: 'employee', foreignField: '_id', as: 'employee' } },
                { $unwind: '$employee' },
                // Add foodItem lookup
                { $lookup: { from: 'fooditems', localField: 'foodItem', foreignField: '_id', as: 'foodItem' } },
                { $unwind: { path: '$foodItem', preserveNullAndEmptyArrays: true } },
                // Add operator lookup
                { $lookup: { from: 'users', localField: 'operator', foreignField: '_id', as: 'operator' } },
                { $unwind: { path: '$operator', preserveNullAndEmptyArrays: true } },
                { $match: match },
                { $sort: { timestamp: -1 } },
                {
                    $project: {
                        _id: 1,
                        timestamp: 1,
                        'employee.name': 1,
                        'employee.department': 1,
                        'foodItem.name': 1,
                        price: 1,
                        subsidy: 1,
                        'operator.username': 1
                    }
                }
            ]);
        } else {
            aggregation = await Order.aggregate([
                { $lookup: { from: 'employees', localField: 'employee', foreignField: '_id', as: 'employee' } },
                { $unwind: '$employee' },
                { $match: match },
                {
                    $group: {
                        _id: groupBy,
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$price' },
                        totalSubsidy: { $sum: '$subsidy' },
                    },
                },
                { $sort: { count: -1 } },
            ]);
        }

        if (type === 'employee' && aggregation.length > 0) {
            // Resolve employee names
            const employeeIds = aggregation.map(a => a._id).filter(id => id !== null);
            const employees = await Employee.find({ _id: { $in: employeeIds } }).select('name');
            const employeeMap = new Map(employees.map(e => [e._id.toString(), e.name]));
            aggregation.forEach(a => {
                if (a._id) {
                    a._id = employeeMap.get(a._id.toString()) || a._id;
                }
            });
        }

        res.json(aggregation);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;