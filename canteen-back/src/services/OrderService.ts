import mongoose from 'mongoose';
import Order from '../models/Order';
import Customer from '../models/Customer';
import FoodItem from '../models/FoodItem';
import Settings from '../models/Settings';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

export interface CreateManualOrderData {
    customerId?: string;
    foodItemCode: string | number;
    isGuest?: boolean;
    guestName?: string;
    notes?: string;
    operatorId: string;
    operatorUsername?: string;
}

export interface OrderFilters {
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
    customerId?: string;
    department?: string;
    search?: string;
    status?: 'pending' | 'approved' | 'rejected';
}

class OrderService {
    /**
     * Check if customer has reached daily meal limit
     */
    async checkDailyLimit(customerId: string, dailyLimit: number): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const mealsToday = await Order.countDocuments({
            customer: customerId,
            timestamp: { $gte: today },
            status: 'approved' // Only count approved orders
        });

        if (mealsToday >= dailyLimit) {
            throw new AppError(
                'Daily meal limit reached for this customer',
                403,
                { mealsToday, limit: dailyLimit }
            );
        }

        return mealsToday;
    }

    /**
     * Validate and get food item
     */
    async getFoodItem(code: string | number) {
        const foodItem = await FoodItem.findOne({
            code: String(code),
            isActive: true,
        });

        if (!foodItem) {
            throw new AppError('Active food item not found', 404);
        }

        // Check available days
        if (foodItem.availableDays && foodItem.availableDays.length > 0) {
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            if (!foodItem.availableDays.includes(today)) {
                throw new AppError(
                    `This meal is only available on: ${foodItem.availableDays.join(', ')}. Today is ${today}.`,
                    403,
                    { availableDays: foodItem.availableDays, today }
                );
            }
        }

        return foodItem;
    }

    /**
     * Create a manual order
     */
    async createManualOrder(data: CreateManualOrderData) {
        const {
            customerId,
            foodItemCode,
            isGuest = false,
            guestName = '',
            notes = '',
            operatorId,
            operatorUsername,
        } = data;

        // Validate food item code
        if (!foodItemCode) {
            throw new AppError('foodItemCode is required', 400);
        }

        if (typeof foodItemCode !== 'string' && typeof foodItemCode !== 'number') {
            throw new AppError('foodItemCode must be a string or number', 400);
        }

        // Get food item
        const foodItem = await this.getFoodItem(foodItemCode);

        // Get settings
        const settings = await Settings.findOne();
        if (!settings) {
            throw new AppError('System settings not initialized', 500);
        }

        const orderData: any = {
            foodItem: foodItem._id,
            workCode: foodItem.code,
            timestamp: new Date(),
            status: 'approved', // Manual orders are auto-approved
            type: 'manual',
            ticketPrinted: false,
            operator: operatorId,
            notes: notes.trim(),
            price: foodItem.price,
            subsidy: foodItem.subsidy || 0,
        };

        let ticketCustomerName = '';
        let ticketCustomerId = '';

        if (isGuest) {
            orderData.isGuest = true;
            orderData.guestName = guestName.trim() || 'Guest';
            ticketCustomerName = orderData.guestName;
            ticketCustomerId = orderData.guestName;
        } else {
            if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
                throw new AppError('Valid customerId required for non-guest', 400);
            }

            const customer = await Customer.findOne({
                _id: customerId,
                isActive: true,
            });

            if (!customer) {
                throw new AppError('Active customer not found', 404);
            }

            orderData.customer = customer._id;
            ticketCustomerName = customer.name;
            ticketCustomerId = customer.deviceId;

            // Check daily limit for employees
            await this.checkDailyLimit(customer._id.toString(), settings.dailyMealLimit);
        }

        const order = await Order.create(orderData);

        logger.info('Manual order created', {
            orderId: order._id,
            customer: ticketCustomerName,
            foodItem: foodItem.name,
            operator: operatorUsername,
        });

        return {
            order,
            ticketData: {
                companyName: settings.companyName,
                customerName: ticketCustomerName,
                customerId: ticketCustomerId,
                mealName: foodItem.name,
                timestamp: order.timestamp,
                orderId: order._id.toString().slice(-8),
                operatorName: operatorUsername,
            },
        };
    }

    /**
     * Approve an order
     */
    async approveOrder(orderId: string, operatorId: string, operatorUsername?: string) {
        const order = await Order.findById(orderId)
            .populate('customer', 'name deviceId')
            .populate('foodItem', 'name');

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        if (order.status !== 'pending') {
            throw new AppError('Order already processed', 400);
        }

        // Check daily limit (Approved count only) before approving
        if (order.customer) {
            const settings = await Settings.findOne() || { dailyMealLimit: 3 };
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const approvedToday = await Order.countDocuments({
                customer: order.customer._id,
                status: 'approved',
                timestamp: { $gte: today }
            });

            if (approvedToday >= settings.dailyMealLimit) {
                throw new AppError(
                    `Daily meal limit (${settings.dailyMealLimit}) reached for this customer. Cannot approve.`,
                    403
                );
            }
        }

        order.status = 'approved';
        order.operator = new mongoose.Types.ObjectId(operatorId);
        await order.save();

        const settings = await Settings.findOne() || { companyName: 'Company Canteen' };

        logger.info('Order approved', {
            orderId: order._id,
            customer: (order.customer as any)?.name,
            operator: operatorUsername,
        });

        return {
            order,
            ticketData: {
                companyName: settings.companyName,
                customerName: (order.customer as any).name,
                customerId: (order.customer as any).deviceId,
                mealName: (order.foodItem as any).name,
                timestamp: order.timestamp,
                orderId: order._id.toString().slice(-8),
                operatorName: operatorUsername,
            },
        };
    }

    /**
     * Reject an order
     */
    async rejectOrder(orderId: string, operatorId: string, reason?: string) {
        const order = await Order.findById(orderId);

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        if (order.status !== 'pending') {
            throw new AppError('Order already processed', 400);
        }

        order.status = 'rejected';
        order.operator = new mongoose.Types.ObjectId(operatorId);
        if (reason && typeof reason === 'string') {
            order.notes = reason.trim();
        }
        await order.save();

        logger.info('Order rejected', {
            orderId: order._id,
            reason: reason || 'No reason provided',
        });

        return order;
    }

    /**
     * Update an order
     */
    async updateOrder(orderId: string, updateData: Partial<CreateManualOrderData>, operatorId: string, operatorUsername?: string) {
        const order = await Order.findById(orderId);

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        const {
            customerId,
            foodItemCode,
            isGuest,
            guestName,
            notes,
        } = updateData;

        // Update Food Item if provided
        if (foodItemCode) {
            // Get food item
            const foodItem = await this.getFoodItem(foodItemCode);
            order.foodItem = foodItem._id;
            order.workCode = foodItem.code;
            order.price = foodItem.price;
            order.subsidy = foodItem.subsidy || 0;
        }

        // Update Customer if provided
        if (isGuest !== undefined) order.isGuest = isGuest;

        if (order.isGuest) {
            if (guestName !== undefined) order.guestName = guestName.trim();
            // If switching to guest, clear customer link
            (order as any).customer = undefined;
        } else {
            if (customerId) {
                if (!mongoose.Types.ObjectId.isValid(customerId)) {
                    throw new AppError('Valid customerId required for non-guest', 400);
                }

                const customer = await Customer.findOne({
                    _id: customerId,
                    isActive: true,
                });

                if (!customer) {
                    throw new AppError('Active customer not found', 404);
                }

                order.customer = customer._id as any;
                (order as any).guestName = undefined;
            }
        }

        if (notes !== undefined) order.notes = notes.trim();

        // Track who updated it last (maybe add a lastModifiedBy field later? for now just log it)
        // order.operator = new mongoose.Types.ObjectId(operatorId); // Optional: change operator to who updated it? Maybe not.

        await order.save();

        logger.info('Order updated', {
            orderId: order._id,
            updatedBy: operatorUsername,
            changes: updateData
        });

        const updatedOrder = await Order.findById(orderId)
            .populate('customer', 'name department deviceId')
            .populate('foodItem', 'name code')
            .populate('operator', 'username');

        return updatedOrder;
    }

    /**
     * Get orders with filters and pagination
     */
    async getOrders(filters: OrderFilters) {
        const {
            page = 1,
            limit = 20,
            from,
            to,
            customerId,
            department,
            search,
            status,
        } = filters;

        const query: any = {};

        // Date range filter
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        let rangeStart: Date = todayStart;
        let rangeEnd: Date = todayEnd;

        if (from) {
            const parsedFrom = new Date(from);
            if (isNaN(parsedFrom.getTime())) {
                throw new AppError('Invalid "from" date format. Use YYYY-MM-DD', 400);
            }
            parsedFrom.setHours(0, 0, 0, 0);
            rangeStart = parsedFrom;
        }

        if (to) {
            const parsedTo = new Date(to);
            if (isNaN(parsedTo.getTime())) {
                throw new AppError('Invalid "to" date format. Use YYYY-MM-DD', 400);
            }
            parsedTo.setHours(23, 59, 59, 999);
            rangeEnd = parsedTo;
        }

        if (rangeStart > rangeEnd) {
            throw new AppError('"from" date cannot be after "to" date', 400);
        }

        query.timestamp = { $gte: rangeStart, $lte: rangeEnd };

        // Customer filter
        if (customerId) {
            if (!mongoose.Types.ObjectId.isValid(customerId)) {
                throw new AppError('Invalid customerId', 400);
            }
            query.customer = new mongoose.Types.ObjectId(customerId);
        }

        // Department filter
        if (department && department.trim() !== '') {
            const customersInDept = await Customer.find({
                department: { $regex: new RegExp(`^${department.trim()}$`, 'i') },
            }).select('_id');

            if (customersInDept.length === 0) {
                return {
                    orders: [],
                    pagination: { page: 1, limit, total: 0, pages: 0 },
                    dateRange: {
                        from: rangeStart.toISOString().split('T')[0],
                        to: rangeEnd.toISOString().split('T')[0],
                    },
                };
            }
            query.customer = { $in: customersInDept.map(c => c._id) };
        }

        // Name search
        if (search && search.trim() !== '') {
            const matchingCustomers = await Customer.find({
                name: { $regex: search.trim(), $options: 'i' },
            }).select('_id');

            if (matchingCustomers.length === 0) {
                return {
                    orders: [],
                    pagination: { page: 1, limit, total: 0, pages: 0 },
                    dateRange: {
                        from: rangeStart.toISOString().split('T')[0],
                        to: rangeEnd.toISOString().split('T')[0],
                    },
                };
            }
            query.customer = { $in: matchingCustomers.map(c => c._id) };
        }

        // Status filter
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            query.status = status;
        }

        // Pagination
        const pageNum = Math.max(1, page);
        const limitNum = Math.max(1, Math.min(100, limit));
        const skip = (pageNum - 1) * limitNum;

        // Execute query
        const orders = await Order.find(query)
            .populate('customer', 'name department deviceId')
            .populate('foodItem', 'name code')
            .populate('operator', 'username')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Order.countDocuments(query);

        return {
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
        };
    }
}

export default new OrderService();
