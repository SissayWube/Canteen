import express, { Request, Response } from 'express';
import Customer from '../models/Customer';
import FoodItem from '../models/FoodItem';
import Order from '../models/Order';
import { requireDeviceKey } from '../middleware/deviceAuth';
import Settings from '../models/Settings';
import { io } from '../server';
import logger from '../config/logger';
const router = express.Router();

// Device endpoint — protected with DEVICE_API_KEY
router.post('/', async (req: Request, res: Response) => {


    try {
        const { userId, workCode, verifyTime } = req.body;


        // Basic validation
        if (!userId || !workCode) {
            return res.status(400).json({ error: 'Missing userId or workCode' });
        }

        // 1. Find customer by deviceId(customer id) (userId from ZKTeco = our deviceId field)
        const customer = await Customer.findOne({ deviceId: String(userId), isActive: true });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found or inactive' });
        }


        const settings = await Settings.findOne() || { dailyMealLimit: 3 };
        // Count meals today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const mealsToday = await Order.countDocuments({
            customer: customer._id,
            status: 'approved', // Only count approved orders
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

        // Check available days
        if (foodItem.availableDays && foodItem.availableDays.length > 0) {
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            if (!foodItem.availableDays.includes(today)) {
                return res.status(403).json({
                    error: `This meal is only available on: ${foodItem.availableDays.join(', ')}. Today is ${today}.`
                });
            }
        }

        // 3. Create order record
        const order = await Order.create({
            customer: customer._id,
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
                customerName: customer.name,
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
        logger.error('Device event error:', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
