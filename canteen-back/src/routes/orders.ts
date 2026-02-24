import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema, updateOrderSchema } from '../validation/schemas.js';
import * as OrderController from '../controllers/OrderController.js';

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
