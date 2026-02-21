import express, { Request, Response } from 'express';
import Customer from '../models/Customer';
import FoodItem from '../models/FoodItem';
import Order from '../models/Order';
import { requireDeviceKey } from '../middleware/deviceAuth';
import Settings from '../models/Settings';
import { io } from '../server';
import logger from '../config/logger';
const router = express.Router();



router.post('/iclock/cdata', async (req: Request, res: Response) => {
    console.log('=== ZKTeco Device Request Received ===');
    console.log('Query:', req.query);
    console.log('Headers:', req.headers);
    console.log('Raw Body (text):', req.body || '(empty)');
    const table = req.query.table as string;

    // Always respond with OK to keep device happy
    res.set('Content-Type', 'text/plain');
    res.send('OK\n');


    if (table !== 'ATTLOG') {
        console.log(`Ignoring non-attendance table: ${table}`);
        return;
    }

    const rawBody = req.body as string;
    if (!rawBody) return;

    const lines = rawBody.trim().split('\n');

    for (const line of lines) {
        if (!line.trim()) continue;

        // Parse ATTLOG line: Date Time   PIN   WorkCode   VerifyType   Reserved
        const parts = line.trim().split(/\s+/);

        if (parts.length < 4) {
            console.log('Invalid ATTLOG line:', line);
            continue;
        }

        const dateStr = parts[2];  // e.g., 17/01/26
        const timeStr = parts[1];  // e.g., 14:32:15
        // UserID
        const pin = parts[0];      // Device PIN = customer.deviceId
        const workCode = parts[5]; // Meal/work code

        const timestamp = `${dateStr} ${timeStr}`;

        console.log(`✅ ATTENDANCE EVENT → User ID: ${pin} | Food ID: ${workCode} | Time: ${timestamp}`);


        // 1. Find customer by deviceId(customer id) (userId from ZKTeco = our deviceId field)
        const customer = await Customer.findOne({ deviceId: String(pin), isActive: true });
        if (!customer) {
            return console.log('Customer not found or inactive');
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
            return console.log('Daily meal limit reached');
        }

        // 2. Find active food item by work code
        const foodItem = await FoodItem.findOne({ code: String(workCode), isActive: true });
        if (!foodItem) {
            return console.log('Invalid or inactive meal code');
        }

        // Check available days
        if (foodItem.availableDays && foodItem.availableDays.length > 0) {
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            if (!foodItem.availableDays.includes(today)) {
                return console.log('This meal is only available on: ${foodItem.availableDays.join(', ')}. Today is ${today}.')

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

        return

    }
});







export default router;
