import express, { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { AuditService } from '../services/AuditService';

const router = express.Router();

interface LoginRequest extends Request {
    body: { username: string; password: string };
}

// Login
router.post('/login', async (req: LoginRequest, res: Response) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            // Optional: Log failed login attempts? Maybe too noisy.
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.userId = user._id.toString();
        req.session.username = user.username;
        req.session.role = user.role;

        req.session.save((err) => {
            if (err) return res.status(500).json({ error: 'Session save failed' });

            AuditService.log('Login', {}, { req, userId: user._id.toString(), username: user.username }, 'User', user._id.toString());

            res.json({ message: 'Login successful', user: { username: user.username, role: user.role } });
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Current user
router.get('/me', (req: Request, res: Response) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({ user: { username: req.session.username, role: req.session.role } });
});

// Change Password
router.post('/change-password', async (req: Request, res: Response) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.session.userId);

        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(401).json({ error: 'Invalid current password' });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();

        AuditService.log('Change Password', {}, { req }, 'User', user._id.toString());

        res.json({ message: 'Password updated successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
    if (req.session.userId) {
        AuditService.log('Logout', {}, { req }, 'User', req.session.userId);
    }
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out' });
    });
});

export default router;