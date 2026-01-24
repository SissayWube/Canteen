// CORS Configuration

export const corsOptions = {
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:5174'  // Additional dev port
    ],
    credentials: true as const
};
