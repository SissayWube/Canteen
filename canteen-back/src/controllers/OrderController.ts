import { Request, Response, NextFunction } from 'express';
import OrderService from '../services/OrderService';
import { printTicket } from '../services/printerService';
import { io } from '../server';
import Order from '../models/Order';

interface ManualOrderBody {
    customerId?: string;
    foodItemCode: string | number;
    isGuest?: boolean;
    guestName?: string;
    notes?: string;
}

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
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
};

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await OrderService.getDashboardStats();
        res.json(stats);
    } catch (error) {
        next(error);
    }
};

export const createManualOrder = async (req: Request, res: Response, next: NextFunction) => {
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
};

export const approveOrder = async (req: Request, res: Response, next: NextFunction) => {
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
};

export const rejectOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { reason } = req.body;

        await OrderService.rejectOrder(
            req.params.id,
            req.session.userId!,
            reason
        );

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
};

export const updateOrder = async (req: Request, res: Response, next: NextFunction) => {
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
};

export const reprintOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ticketData = await OrderService.getTicketData(
            req.params.id,
            req.session.username
        );

        const printSuccess = await printTicket(ticketData);

        if (printSuccess) {
            // Update ticketPrinted flag
            await Order.findByIdAndUpdate(req.params.id, { ticketPrinted: true });
        }

        res.json({
            success: true,
            printed: printSuccess,
            message: printSuccess ? 'Ticket reprinted successfully' : 'Reprint failed'
        });
    } catch (error) {
        next(error);
    }
};
