import express, { Request, Response, NextFunction } from 'express';
import Settings from '../models/Settings.js';
import { requireAuth } from '../middleware/auth.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
    if (req.session.role !== 'admin') {
        return _res.status(403).json({
            error: 'Admin access required',
            details: `User role is: ${req.session.role || 'undefined'}`
        });
    }
    next();
};

router.use(requireAuth);

// GET current settings
router.get('/', async (_req: Request, res: Response) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            // Create default on first access
            settings = await Settings.create({ dailyMealLimit: 3 });
        }
        res.json(settings);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH update settings
router.patch('/', requireAdmin, async (req: Request, res: Response) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
        }

        if (req.body.dailyMealLimit !== undefined) {
            settings.dailyMealLimit = req.body.dailyMealLimit;
        }
        if (req.body.companyName !== undefined) {
            settings.companyName = req.body.companyName;
        }
        settings.updatedBy = req.session.userId as any;

        await settings.save();

        res.json(settings);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// GET logs download
router.get('/logs', requireAdmin, (req: Request, res: Response) => {
    try {
        const logPath = path.join(process.cwd(), 'logs/combined.log');
        if (!fs.existsSync(logPath)) {
            return res.status(404).json({ error: 'Log file not found' });
        }
        res.download(logPath, 'canteen-combined.log');
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET backup
router.get('/backup', requireAdmin, async (req: Request, res: Response) => {
    try {
        const collections = Object.keys(mongoose.connection.collections);
        const backupData: Record<string, any[]> = {};

        for (const collectionName of collections) {
            const collection = mongoose.connection.collections[collectionName];
            backupData[collectionName] = await collection.find({}).toArray();
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `canteen-backup-${timestamp}.json`;

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(JSON.stringify(backupData, null, 2));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST restore
router.post('/restore', requireAdmin, upload.single('backupFile'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No backup file provided' });
        }

        const backupData = JSON.parse(req.file.buffer.toString('utf8'));
        const collections = Object.keys(mongoose.connection.collections);

        // Optional: Start a transaction if replica set is used, but for simple local setup we'll just drop and restore sequentially.

        for (const [collectionName, data] of Object.entries(backupData)) {
            if (collections.includes(collectionName)) {
                const collection = mongoose.connection.collections[collectionName];
                await collection.deleteMany({});
                if (Array.isArray(data) && data.length > 0) {
                    await collection.insertMany(data);
                }
            }
        }

        res.json({ message: 'System restored successfully' });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to restore: ' + error.message });
    }
});

export default router;