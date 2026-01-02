import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sessionConfig from './config/session.ts';
import connectDB from './config/db.ts';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.ts';
import employeeRoutes from './routes/employees.ts';

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
app.use(sessionConfig);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);

// Health check endpoint (good practice)
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});