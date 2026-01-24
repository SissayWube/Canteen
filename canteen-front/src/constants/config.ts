// Frontend Configuration Constants

export const CONFIG = {
    // React Query
    QUERY_STALE_TIME: 1000 * 60, // 1 minute (reduced from 5)
    QUERY_GC_TIME: 1000 * 60 * 10, // 10 minutes
    QUERY_RETRY: 1,

    // Pagination
    DEFAULT_PAGE_SIZE: 25,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],

    // Validation
    MAX_NOTE_LENGTH: 500,
    MIN_USERNAME_LENGTH: 3,
    MIN_PASSWORD_LENGTH: 6,

    // Date Formats
    DATE_FORMAT: 'DD/MM/YYYY',
    DATETIME_FORMAT: 'DD/MM/YYYY HH:mm',
    DATE_PICKER_FORMAT: 'YYYY-MM-DD'
} as const;

export const ORDER_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
} as const;

export const USER_ROLE = {
    ADMIN: 'admin',
    OPERATOR: 'operator'
} as const;

export const CURRENCY = {
    DEFAULT: 'ETB'
} as const;

export const DAYS_OF_WEEK = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
] as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];
export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE];
export type DayOfWeek = typeof DAYS_OF_WEEK[number];
