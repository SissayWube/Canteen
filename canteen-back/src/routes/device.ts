import express, { Request, Response } from 'express';
import Employee from '../models/Employee';
import FoodItem from '../models/FoodItem';
import Order from '../models/Order';
// import { printTicket } from '../services/printerService';
import { requireDeviceKey } from '../middleware/deviceAuth';
import Settings from '../models/Settings';
import { io } from '../server';
const router = express.Router();

// Public endpoint — only accessible with correct DEVICE_API_KEY
// router.post('/', requireDeviceKey, async (req: Request, res: Response) => {
router.post('/', async (req: Request, res: Response) => {

    try {
        const { userId, workCode, verifyTime } = req.body;


        // Basic validation
        if (!userId || !workCode) {
            return res.status(400).json({ error: 'Missing userId or workCode' });
        }

        // 1. Find employee by deviceId(employee id) (userId from ZKTeco = our deviceId field)
        const employee = await Employee.findOne({ deviceId: String(userId), isActive: true });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found or inactive' });
        }


        const settings = await Settings.findOne() || { dailyMealLimit: 3 };
        // Count meals today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const mealsToday = await Order.countDocuments({
            employee: employee._id,
            status: 'approved',
            timestamp: { $gte: today },
        });

        if (mealsToday >= settings.dailyMealLimit) {
            return res.status(403).json({
                error: 'Daily meal limit reached',
                mealsToday,
                limit: settings.dailyMealLimit,
            });
        }

        // 2. Find active food item by work code
        const foodItem = await FoodItem.findOne({ code: String(workCode), isActive: true });
        if (!foodItem) {
            return res.status(404).json({ error: 'Invalid or inactive meal code' });
        }

        // 3. Create order record
        const order = await Order.create({
            employee: employee._id,
            foodItem: foodItem._id,
            price: foodItem.price,
            subsidy: foodItem.subsidy || 0,
            currency: foodItem.currency || 'ETB',
            workCode: String(workCode),
            timestamp: new Date(),
            status: 'pending',
            type: 'automatic',
            ticketPrinted: false,
        });

        // 4. Emit new pending order to operator    
        if (io) {
            io.emit('newPendingOrder', {
                orderId: order._id,
                employeeName: employee.name,
                mealName: foodItem.name,
                time: order.timestamp,
            });
        }

        // 5. Return success response   
        res.json({
            success: true,
            message: 'Order received - awaiting operator approval',
            transactionId: order._id,
        });
    } catch (error: any) {
        console.error('Device event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;