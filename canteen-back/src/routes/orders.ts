import express from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createOrderSchema, updateOrderSchema } from '../validation/schemas';
import * as OrderController from '../controllers/OrderController';

const router = express.Router();

router.use(requireAuth);

router.get('/', OrderController.getOrders);

router.get('/stats', OrderController.getDashboardStats);

// POST /api/orders/manual - Manual ticket issuance by operator
router.post('/manual', validate(createOrderSchema), OrderController.createManualOrder);

// POST /api/transactions/:id/approve
router.post('/:id/approve', OrderController.approveOrder);

// POST /api/orders/:id/reject
router.post('/:id/reject', OrderController.rejectOrder);

// PUT /api/orders/:id - Update order details
router.put('/:id', validate(updateOrderSchema), OrderController.updateOrder);

// POST /api/orders/:id/reprint - Reprint ticket
router.post('/:id/reprint', OrderController.reprintOrder);

export default router;
