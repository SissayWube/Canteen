import dotenv from 'dotenv';
dotenv.config({ path: '.env', override: true });
console.log('MONGODB_URI loaded:', process.env.MONGODB_URI ? 'YES' : 'NO');
console.log('SESSION_SECRET loaded:', process.env.SESSION_SECRET ? 'YES' : 'NO');
import getSessionMiddleware from './config/session.js';
import express from 'express';
import connectDB from './config/db.js';
import mongoose from 'mongoose';
import logger from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import foodItemRoutes from './routes/foodItems.js';
import userRoutes from './routes/users.js';
import customerRoutes from './routes/customers.js';
import settingsRoutes from './routes/settings.js';
import orderRoutes from './routes/orders.js';
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import eventRoutes from './routes/device.js';
import analysisRoutes from './routes/analysis.js';
import { corsOptions } from './config/cors.js';
import deviceRoutes from './routes/device.js';
import { fileURLToPath } from 'url';
import path from 'path';
import cors from 'cors';
import { mongoSanitize } from './middleware/mongoSanitize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 5000);
const httpServer = new HttpServer(app);

export const io = new SocketIOServer(httpServer, {
    cors: corsOptions
});


io.on('connection', (socket) => {
    logger.info('Operator connected', { socketId: socket.id });
    socket.on('disconnect', () => {
        logger.info('Operator disconnected', { socketId: socket.id });
    });
})


// Connect to Database
connectDB();


// Middleware
app.use(getSessionMiddleware(mongoose));
app.use(express.text({ type: 'text/plain' }));
app.use(cors(corsOptions));
app.use(express.json());
app.use(mongoSanitize); // Custom sanitization middleware to prevent NoSQL injection



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings', settingsRoutes);
app.use("/api/events", eventRoutes);
app.use('/api/food-items', foodItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('', deviceRoutes);


// Health check endpoint 
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.use(express.static(path.join(__dirname, '../client/dist')));

// Catch-all: serve index.html for ALL non-API routes
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next(); // Let API routes handle /api/...
    }
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
})


// Global error handler (must be last)
app.use(errorHandler);

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on http://localhost:${PORT}`);
});