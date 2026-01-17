import express, { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import Customer from '../models/Customer';
import mongoose from 'mongoose';
import FoodItem from '../models/FoodItem';
import Settings from '../models/Settings';
import { requireAuth } from '../middleware/auth';
import { printTicket } from '../services/printerService';
import { io } from '../server';
import OrderService from '../services/OrderService.js';
import { AuditService } from '../services/AuditService';

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req: Request, res: Response, next) => {
    try {
        const filters = {
            page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
            limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
            from: req.query.from as string,
            to: req.query.to as string,
            customerId: req.query.customerId as string,
            department: req.query.department as string,
            search: req.query.search as string,
            status: req.query.status as 'pending' | 'approved' | 'rejected',
        };

        const result = await OrderService.getOrders(filters);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.get('/stats', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await OrderService.getDashboardStats();
        res.json(stats);
    } catch (error) {
        next(error);
    }
});



// POST /api/orders/manual - Manual ticket issuance by operator
interface ManualOrderBody {
    customerId?: string;
    foodItemCode: string | number;
    isGuest?: boolean;
    guestName?: string;
    notes?: string;
}

router.post('/manual', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            customerId,
            foodItemCode,
            isGuest = false,
            guestName = '',
            notes = '',
        } = req.body as ManualOrderBody;

        const { order, ticketData } = await OrderService.createManualOrder({
            customerId,
            foodItemCode,
            isGuest,
            guestName,
            notes,
            operatorId: req.session.userId!,
            operatorUsername: req.session.username,
        });

        // Print ticket
        const printSuccess = await printTicket(ticketData);

        order.ticketPrinted = printSuccess;
        await order.save();

        AuditService.log('Manual Order', { orderId: order._id, customer: ticketData.customerName, meal: ticketData.mealName }, { req }, 'Order', order._id.toString());

        // Notify dashboard
        if (io) {
            io.emit('orderApproved', {
                orderId: order._id,
                printed: printSuccess,
            });
        }

        res.json({
            success: true,
            printed: printSuccess,
            orderId: order._id,
            message: printSuccess
                ? 'Ticket issued and printed successfully'
                : 'Order recorded but printing failed',
            customer: ticketData.customerName,
            meal: ticketData.mealName,
        });
    } catch (error) {
        next(error);
    }
});


// POST /api/transactions/:id/approve
router.post('/:id/approve', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { order, ticketData } = await OrderService.approveOrder(
            req.params.id,
            req.session.userId!,
            req.session.username
        );

        // Print ticket
        const printSuccess = await printTicket(ticketData);

        order.ticketPrinted = printSuccess;
        await order.save();

        AuditService.log('Approve Order', { orderId: order._id }, { req }, 'Order', order._id.toString());

        // Notify all clients
        if (io) {
            io.emit('orderApproved', {
                orderId: order._id,
                printed: printSuccess,
            });
        }

        res.json({ success: true, printed: printSuccess });
    } catch (error) {
        next(error);
    }
});

// POST /api/orders/:id/reject
router.post('/:id/reject', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { reason } = req.body;

        await OrderService.rejectOrder(
            req.params.id,
            req.session.userId!,
            reason
        );

        AuditService.log('Reject Order', { orderId: req.params.id, reason }, { req }, 'Order', req.params.id);

        // Notify all clients
        if (io) {
            io.emit('orderRejected', {
                orderId: req.params.id,
            });
        }

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

// PUT /api/orders/:id - Update order details
router.put('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const order = await OrderService.updateOrder(
            req.params.id,
            req.body,
            req.session.userId!,
            req.session.username
        );

        // Notify dashboard of update
        if (io) {
            io.emit('newPendingOrder', { orderId: order?._id }); // Reuse existing event to trigger refresh
        }

        res.json({ success: true, order });
    } catch (error) {
        next(error);
    }
});

export default router;
