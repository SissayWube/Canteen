import express, { Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import * as UserController from '../controllers/UserController';

const router = express.Router();

// Middleware: Only admins can manage users
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.role !== 'admin') {
        return res.status(403).json({
            error: 'Forbidden: Admin access required',
            details: `User role is: ${req.session.role || 'undefined'}`
        });
    }
    next();
};

router.use(requireAuth);
router.use(requireAdmin); // All routes below require admin role

// GET all users (operators + admins) with pagination and filtering
router.get('/', UserController.getUsers);

// POST create new user (operator or admin)
router.post('/', UserController.createUser);

// PUT update user
router.put('/:id', UserController.updateUser);

// DELETE user
router.delete('/:id', UserController.deleteUser);

export default router;