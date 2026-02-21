import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import getSessionMiddleware from './config/session';
import connectDB from './config/db';
import mongoose from 'mongoose';
import logger from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import foodItemRoutes from './routes/foodItems';
import userRoutes from './routes/users';
import customerRoutes from './routes/customers';
import settingsRoutes from './routes/settings';
import orderRoutes from './routes/orders';
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import eventRoutes from './routes/device';
import analysisRoutes from './routes/analysis';
import { corsOptions } from './config/cors';
import deviceRoutes from './routes/device';

dotenv.config();

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

import { mongoSanitize } from './middleware/mongoSanitize';

// Middleware
app.use(express.text({ type: 'text/plain' }));
app.use(cors(corsOptions));
app.use(express.json());
app.use(mongoSanitize); // Custom sanitization middleware to prevent NoSQL injection

app.use(getSessionMiddleware(mongoose));

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

/////














///////

// Health check endpoint 
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on http://localhost:${PORT}`);
});