import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'canteen-backend' },
    transports: [
        // Console transport for development
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ level, message, timestamp, stack }) => {
                    const msg = `${timestamp} [${level}]: ${message}`;
                    return stack ? `${msg}\n${stack}` : msg;
                })
            ),
        }),
        // File transport for production errors
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.json()
        }),
        // File transport for all logs
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: winston.format.json()
        }),
    ],
});

// If we're not in production, log to console only
if (process.env.NODE_ENV !== 'production') {
    logger.remove(new winston.transports.File({ filename: 'logs/error.log' }));
    logger.remove(new winston.transports.File({ filename: 'logs/combined.log' }));
}

export default logger;
