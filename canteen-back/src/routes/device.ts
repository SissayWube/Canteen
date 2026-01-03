import express, { Request, Response } from 'express';
import Employee from '../models/Employee';
import FoodItem from '../models/FoodItem';
import Transaction from '../models/Transaction';
// import { printTicket } from '../services/printerService';
import { requireDeviceKey } from '../middleware/deviceAuth.ts';
import Settings from '../models/Settings.ts';

const router = express.Router();

// Public endpoint — only accessible with correct DEVICE_API_KEY
router.post('/event', requireDeviceKey, async (req: Request, res: Response) => {
    try {
        const { userId, workCode, verifyTime } = req.body;

        // Basic validation
        if (!userId || !workCode) {
            return res.status(400).json({ error: 'Missing userId or workCode' });
        }

        // 1. Find employee by deviceId (userId from ZKTeco = our deviceId field)
        const employee = await Employee.findOne({ deviceId: String(userId), isActive: true });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found or inactive' });
        }

        const settings = await Settings.findOne() || { dailyMealLimit: 3 };
        // Count meals today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const mealsToday = await Transaction.countDocuments({
            employee: employee._id,
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

        // 3. Optional: Enforce daily meal limit
        // const today = new Date();
        // today.setHours(0, 0, 0, 0);

        // const mealsToday = await Transaction.countDocuments({
        //     employee: employee._id,
        //     timestamp: { $gte: today },
        // });

        // if (employee.dailyLimit && mealsToday >= employee.dailyLimit) {
        //     return res.status(403).json({
        //         error: 'Daily meal limit reached',
        //         mealsToday,
        //         limit: employee.dailyLimit,
        //     });
        // }
        // 4. Create transaction record
        const transaction = await Transaction.create({
            employee: employee._id,
            foodItem: foodItem._id,
            workCode: String(workCode),
            timestamp: verifyTime ? new Date(verifyTime) : new Date(),
            status: 'success',
            ticketPrinted: false, // We'll update this after printing
            amountDeducted: foodItem.price - (foodItem.subsidy || 0),
        });

        // 5. TODO: Trigger thermal printer (next step)
        // ... after creating transaction
        // const printSuccess = await printTicket({
        //     companyName: 'Your Company Canteen',
        //     employeeName: employee.name,
        //     mealName: foodItem.name,
        //     timestamp: transaction.timestamp,
        //     transactionId: transaction._id.toString(),
        // });

        // // Update transaction with print status
        // transaction.ticketPrinted = printSuccess;
        // await transaction.save();

        // res.json({
        //     success: true,
        //     transactionId: transaction._id,
        //     message: 'Event processed',
        //     employee: employee.name,
        //     meal: foodItem.name,
        //     printed: printSuccess,
        // });

        // For now, just acknowledge
        console.log(`Meal issued: ${employee.name} - ${foodItem.name}`);

        res.json({
            success: true,
            transactionId: transaction._id,
            message: 'Event processed',
            employee: employee.name,
            meal: foodItem.name,
        });
    } catch (error: any) {
        console.error('Device event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;