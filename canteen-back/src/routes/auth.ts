import express, { Request, Response } from 'express';
import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

interface LoginRequest extends Request {
    body: { username: string; password: string };
}

// Login
router.post('/login', async (req: LoginRequest, res: Response) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });
        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.adminId = admin._id.toString();
        req.session.username = admin.username;

        res.json({ message: 'Login successful', admin: { username: admin.username } });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Current user
router.get('/me', (req: Request, res: Response) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({ admin: { username: req.session.username } });
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out' });
    });
});

export default router;