// src/routes/analysis.ts
import express, { Request, Response } from 'express';
import Order from '../models/Order';
import Customer from '../models/Customer';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.use(requireAuth); // Admin only? Or operator too? (Assume admin for now)

// const requireAdmin = (req: Request, res: Response, next: Function) => {
//     if (req.session.role !== 'admin') {
//         return res.status(403).json({
//             error: 'Admin access required',
//             details: `User role is: ${req.session.role || 'undefined'}`
//         });
//     }
//     next();
// };

// router.use(requireAdmin);

const buildAnalysisMatch = async (query: any, isOrdersRoute = false) => {
    const from = query.from as string;
    const to = query.to as string;
    const customerId = query.customerId as string;
    const department = query.department as string;
    const statusStr = query.status as string;
    const itemCodeStr = query.itemCode as string;
    const type = String(query.type || 'orders');

    const match: any = {};

    // Date Logic (Inclusive of end day)
    if (from || to) {
        match.timestamp = {};
        if (from) {
            // Assume ISO format YYYY-MM-DD
            const fromDate = new Date(from);
            fromDate.setHours(0, 0, 0, 0); // Ensure start of day
            match.timestamp.$gte = fromDate;
        }
        if (to) {
            // Assume ISO format YYYY-MM-DD
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999); // Ensure end of day
            match.timestamp.$lte = toDate;
        }
    }

    // Customer/Department Logic (Intersected)
    if (department === 'Visitor') {
        match.isGuest = true;
        if (customerId) {
            // Cannot filter by specific customer AND "Visitor" department
            // as guests don't have MongoDB IDs in Customer collection.
            match.customer = new mongoose.Types.ObjectId(); // Empty match
        }
    } else {
        const customerQuery: any = {};
        if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
            customerQuery._id = new mongoose.Types.ObjectId(customerId);
        }
        if (department && department !== 'All Departments' && department !== '') {
            customerQuery.department = department;
        }

        if (Object.keys(customerQuery).length > 0) {
            const customers = await Customer.find(customerQuery).select('_id');
            match.customer = { $in: customers.map(c => c._id) };
            match.isGuest = { $ne: true };
        }
    }

    // Status Logic
    if (statusStr) {
        match.status = statusStr;
    } else if (!isOrdersRoute || type !== 'orders') {
        // Defaults: 'approved' for summaries or non-orders type
        match.status = 'approved';
    }

    // Item Logic
    if (itemCodeStr) {
        match.workCode = itemCodeStr;
    }

    return match;
};

// GET /api/analysis?type=orders&from=2026-01-01&to=2026-01-31
router.get('/', async (req: Request, res: Response) => {
    try {
        const query = req.query;
        const type = String(query.type || 'orders');
        const match = await buildAnalysisMatch(query, true);

        // 2. Determine Grouping
        let groupBy: any;
        switch (type) {
            case 'department':
                groupBy = '$customer.department';
                break;
            case 'customer':
                groupBy = '$customer._id';
                break;
            case 'date':
                groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } };
                break;
            case 'summary':
                groupBy = null;
                break;
            default:
                groupBy = 'orders';
        }

        // 3. Execution Pipeline
        let aggregation;

        if (groupBy === 'orders') {
            aggregation = await Order.aggregate([
                { $match: match },
                { $lookup: { from: 'customers', localField: 'customer', foreignField: '_id', as: 'customer' } },
                { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
                { $lookup: { from: 'fooditems', localField: 'foodItem', foreignField: '_id', as: 'foodItem' } },
                { $unwind: { path: '$foodItem', preserveNullAndEmptyArrays: true } },
                { $lookup: { from: 'users', localField: 'operator', foreignField: '_id', as: 'operator' } },
                { $unwind: { path: '$operator', preserveNullAndEmptyArrays: true } },
                { $sort: { timestamp: -1 } },
                {
                    $project: {
                        _id: 1,
                        timestamp: 1,
                        'customer.name': 1,
                        'customer.department': 1,
                        foodItem: 1,
                        price: 1,
                        subsidy: 1,
                        'operator.username': 1,
                        status: 1,
                        notes: 1,
                        isGuest: 1,
                        guestName: 1
                    }
                }
            ]);
        } else {
            aggregation = await Order.aggregate([
                { $match: match },
                { $lookup: { from: 'customers', localField: 'customer', foreignField: '_id', as: 'customer' } },
                { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
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

        if (type === 'customer' && aggregation.length > 0) {
            const customerIds = aggregation.map(a => a._id).filter(id => id !== null);
            const customers = await Customer.find({ _id: { $in: customerIds } }).select('name');
            const customerMap = new Map(customers.map(c => [c._id.toString(), c.name]));
            aggregation.forEach(a => {
                if (a._id) {
                    a._id = customerMap.get(a._id.toString()) || a._id;
                }
            });
        }

        res.json(aggregation);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});


router.get('/totals', async (req: Request, res: Response) => {
    try {
        const match = await buildAnalysisMatch(req.query);

        const totals = await Order.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalPrice: { $sum: "$price" },
                    totalSubsidy: { $sum: "$subsidy" },
                    totalMealsByItem: { $addToSet: "$foodItem.name" },
                },
            },
        ]);

        res.json(totals[0] || { totalOrders: 0, totalPrice: 0, totalSubsidy: 0, totalMealsByItem: [] });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/grouped', async (req: Request, res: Response) => {
    try {
        const { groupBy = 'department' } = req.query;
        const match = await buildAnalysisMatch(req.query);

        let groupField: any;
        switch (groupBy) {
            case 'department':
                groupField = '$department';
                break;
            case 'customer':
                groupField = '$customer.name';
                break;
            case 'date':
                groupField = { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } };
                break;
            case 'item':
                groupField = '$foodItem.name';
                break;
            default:
                return res.status(400).json({ error: 'Invalid groupBy. Use department, customer, date, or item' });
        }

        const grouped = await Order.aggregate([
            { $match: match },
            {
                $group: {
                    _id: groupField,
                    count: { $sum: 1 },
                    totalPrice: { $sum: "$price" },
                    totalSubsidy: { $sum: "$subsidy" },
                },
            },
            { $sort: { count: -1 } },
        ]);

        res.json(grouped);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});



export default router;
