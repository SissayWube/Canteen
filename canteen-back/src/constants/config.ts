// Backend Configuration Constants

export const ORDER_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
} as const;

export const ORDER_TYPE = {
    MANUAL: 'manual',
    AUTOMATIC: 'automatic'
} as const;

export const USER_ROLE = {
    ADMIN: 'admin',
    OPERATOR: 'operator'
} as const;

export const CURRENCY = {
    DEFAULT: 'ETB'
} as const;

export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
} as const;

export const VALIDATION = {
    MIN_USERNAME_LENGTH: 3,
    MIN_PASSWORD_LENGTH: 6,
    MAX_NOTES_LENGTH: 500,
    MAX_NAME_LENGTH: 100,
    MAX_CODE_LENGTH: 50
} as const;

export const SESSION = {
    TTL_SECONDS: 24 * 60 * 60, // 24 hours
    COOKIE_MAX_AGE: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
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
export type OrderType = typeof ORDER_TYPE[keyof typeof ORDER_TYPE];
export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE];
export type DayOfWeek = typeof DAYS_OF_WEEK[number];
