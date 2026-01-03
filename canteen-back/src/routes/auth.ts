import express, { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';

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
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.userId = user._id.toString();
        req.session.username = user.username;

        res.json({ message: 'Login successful', user: { username: user.username } });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Current user
router.get('/me', (req: Request, res: Response) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({ user: { username: req.session.username } });
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