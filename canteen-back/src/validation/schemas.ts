import { z } from 'zod';

// Order Validation Schemas
export const createOrderSchema = z.object({
    customerId: z.string().optional(),
    foodItemCode: z.string().min(1, 'Food item code is required'),
    isGuest: z.boolean().default(false),
    guestName: z.string().optional(),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
}).refine(
    data => {
        if (data.isGuest && !data.guestName) {
            return false;
        }
        if (!data.isGuest && !data.customerId) {
            return false;
        }
        return true;
    },
    {
        message: 'Guest orders require guestName, employee orders require customerId'
    }
);

export const updateOrderSchema = z.object({
    customerId: z.string().optional(),
    foodItemCode: z.string().min(1).optional(),
    isGuest: z.boolean().optional(),
    guestName: z.string().optional(),
    notes: z.string().max(500).optional()
});

// Customer Validation Schemas
export const createCustomerSchema = z.object({
    deviceId: z.string().min(1, 'Device ID is required'),
    name: z.string().min(1, 'Name is required').max(100),
    department: z.string().min(1, 'Department is required').max(100)
});

export const updateCustomerSchema = z.object({
    deviceId: z.string().min(1).max(50).optional(),
    name: z.string().min(1).max(100).optional(),
    department: z.string().min(1).max(100).optional(),
    isActive: z.boolean().optional()
});

// Food Item Validation Schemas
export const createFoodItemSchema = z.object({
    code: z.string().min(1, 'Code is required').max(50),
    name: z.string().min(1, 'Name is required').max(100),
    price: z.number().positive('Price must be positive'),
    subsidy: z.number().min(0, 'Subsidy cannot be negative').default(0),
    currency: z.string().default('ETB'),
    availableDays: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])).optional(),
    isActive: z.boolean().default(true)
}).refine(
    data => data.subsidy <= data.price,
    {
        message: 'Subsidy cannot exceed price'
    }
);

export const updateFoodItemSchema = z.object({
    code: z.string().min(1).max(50).optional(),
    name: z.string().min(1).max(100).optional(),
    price: z.number().positive().optional(),
    subsidy: z.number().min(0).optional(),
    currency: z.string().optional(),
    availableDays: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])).optional(),
    isActive: z.boolean().optional()
}).refine(
    data => {
        if (data.price !== undefined && data.subsidy !== undefined) {
            return data.subsidy <= data.price;
        }
        return true;
    },
    {
        message: 'Subsidy cannot exceed price'
    }
);

// User Validation Schemas
export const createUserSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(50),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(1, 'Full name is required').max(100),
    role: z.enum(['admin', 'operator'])
});

export const updateUserSchema = z.object({
    username: z.string().min(3).max(50).optional(),
    password: z.string().min(6).optional(),
    fullName: z.string().min(1).max(100).optional(),
    role: z.enum(['admin', 'operator']).optional()
});

// Settings Validation Schema
export const updateSettingsSchema = z.object({
    dailyMealLimit: z.number().int().positive('Daily meal limit must be positive'),
    currency: z.string().default('ETB'),
    companyName: z.string().min(1).max(200).optional()
});

// Auth Validation Schemas
export const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required')
});

// Query Parameter Schemas
export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10)
});

export const dateRangeSchema = z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional()
});
