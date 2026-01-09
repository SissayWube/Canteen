import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import getSessionMiddleware from './config/session';
import connectDB from './config/db';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import foodItemRoutes from './routes/foodItems';
import userRoutes from './routes/users';
import employeeRoutes from './routes/employees';
import settingsRoutes from './routes/settings';
import orderRoutes from './routes/orders';
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import eventRoutes from './routes/device';
import analysisRoutes from './routes/analysis';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


const httpServer = new HttpServer(app);
export const io = new SocketIOServer(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    },
});


io.on('connection', (socket) => {
    console.log('Operator connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Operator disconnected:', socket.id);
    });
})


// Connect to Database
connectDB();

// Middleware
app.use(express.json());
app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));

await mongoose.connect(process.env.MONGODB_URI!);
app.use(getSessionMiddleware(mongoose));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/settings', settingsRoutes);
app.use("/api/events", eventRoutes);
app.use('/api/food-items', foodItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analysis', analysisRoutes);

// Health check endpoint 
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});
// Start server
httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});