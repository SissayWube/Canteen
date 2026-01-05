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
import transactionRoutes from './routes/transactions';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));

await mongoose.connect(process.env.MONGODB_URI!);
app.use(getSessionMiddleware(mongoose));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/settings', settingsRoutes);
// Health check endpoint 
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.use('/api/food-items', foodItemRoutes);
app.use('/api/transactions', transactionRoutes);


// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});