// src/routes/orders.ts
import express, { Request, Response } from 'express';
import Order from '../models/Order';
import Employee from '../models/Employee';
import mongoose from 'mongoose';
import FoodItem from '../models/FoodItem';
import Settings from '../models/Settings';
import { requireAuth } from '../middleware/auth';
import { printTicket } from '../services/printerService';
import { io } from '../server';

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
                return res.json({ orders: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
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
        const orders = await Order.find(query)
            .populate('employee', 'name department deviceId')
            .populate('foodItem', 'name code')
            .populate('operator', 'username')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Order.countDocuments(query);

        res.json({
            orders,
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
        console.error('Order fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});



// POST /api/orders/manual - Manual ticket issuance by operator
router.post('/manual', requireAuth, async (req: Request, res: Response) => {
    try {
        const { employeeId, foodItemCode } = req.body;

        if (!employeeId || !foodItemCode) {
            return res.status(400).json({ error: 'employeeId and foodItemCode are required' });
        }

        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({ error: 'Invalid employeeId' });
        }

        // Find employee
        const employee = await Employee.findOne({
            _id: employeeId,
            isActive: true,
        });

        if (!employee) {
            return res.status(404).json({ error: 'Active employee not found' });
        }

        // Find food item
        const foodItem = await FoodItem.findOne({
            code: String(foodItemCode),
            isActive: true,
        });

        if (!foodItem) {
            return res.status(404).json({ error: 'Active food item not found' });
        }

        // Get global settings
        const settings = await Settings.findOne();

        if (!settings) {
            return res.status(500).json({ error: 'System settings not initialized' });
        }

        // Check daily limit
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const mealsToday = await Order.countDocuments({
            employee: employee._id,
            timestamp: { $gte: today },
        });

        if (mealsToday >= settings.dailyMealLimit) {
            return res.status(403).json({
                error: 'Daily meal limit reached for this employee',
                mealsToday,
                limit: settings.dailyMealLimit,
            });
        }

        // Create manual order
        const order = await Order.create({
            employee: employee._id,
            foodItem: foodItem._id,
            price: foodItem.price,
            subsidy: foodItem.subsidy || 0,
            currency: foodItem.currency || 'ETB',
            workCode: foodItem.code,
            timestamp: new Date(),
            status: 'approved',
            type: 'manual',
            ticketPrinted: false,
            operator: req.session.userId,
        });

        // Print ticket
        const printSuccess = await printTicket({
            companyName: settings.companyName,
            employeeName: employee.name,
            employeeId: employee.deviceId,
            mealName: foodItem.name,
            timestamp: order.timestamp,
            orderId: order._id.toString().slice(-8),
            operatorName: req.session.username,
        });

        order.ticketPrinted = printSuccess;
        await order.save();

        // Notify dashboard of new order
        if (io) {
            io.emit('newPendingOrder', { orderId: order._id });
        }

        res.json({
            success: true,
            printed: printSuccess,
            orderId: order._id,
            message: printSuccess
                ? 'Manual ticket issued and printed successfully'
                : 'Order recorded but printing failed',
            employee: employee.name,
            meal: foodItem.name,
            mealsToday: mealsToday + 1,
        });
    } catch (error: any) {
        console.error('Manual order error:', error);
        res.status(500).json({ error: 'Failed to issue manual ticket' });
    }
});


// POST /api/transactions/:id/approve
router.post('/:id/approve', requireAuth, async (req: Request, res: Response) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('employee', 'name deviceId')
            .populate('foodItem', 'name');

        if (!order) return res.status(404).json({ error: 'Transaction not found' });
        if (order.status !== 'pending') {
            return res.status(400).json({ error: 'Transaction already processed' });
        }

        // Update status
        order.status = 'approved';
        order.operator = new mongoose.Types.ObjectId(req.session.userId as string);

        // Now print
        const settings = await Settings.findOne() || { companyName: 'Company Canteen' };
        const printSuccess = await printTicket({
            companyName: settings.companyName,
            employeeName: (order.employee as any).name,
            employeeId: (order.employee as any).deviceId,
            mealName: (order.foodItem as any).name,
            timestamp: order.timestamp,
            orderId: order._id.toString().slice(-8),
            operatorName: req.session.username,
        });

        order.ticketPrinted = printSuccess;
        await order.save();

        // Notify all clients
        if (io) {
            io.emit('orderApproved', {
                orderId: order._id,
                printed: printSuccess,
            });
        }

        res.json({ success: true, printed: printSuccess });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/orders/:id/reject
router.post('/:id/reject', requireAuth, async (req: Request, res: Response) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.status !== 'pending') {
            return res.status(400).json({ error: 'Order already processed' });
        }

        // Update status to rejected
        order.status = 'rejected';
        order.operator = new mongoose.Types.ObjectId(req.session.userId as string);
        await order.save();

        // Notify all clients
        if (io) {
            io.emit('orderRejected', {
                orderId: order._id,
            });
        }

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;