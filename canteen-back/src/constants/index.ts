export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
} as const;

export const ALERTS_CONFIG = {
    DAILY_MEAL_LIMIT: 3,
} as const;

export const DEFAULTS = {
    CURRENCY: 'ETB',
    COMPANY_NAME: 'Company Canteen',
} as const;

export const SECURITY = {
    BCRYPT_ROUNDS: 12,
    SESSION_TTL_MS: 24 * 60 * 60 * 1000, // 24 hours
    SESSION_TTL_SECONDS: 24 * 60 * 60,
} as const;

export const LIMITS = {
    MAX_NOTES_LENGTH: 500,
    MAX_USERNAME_LENGTH: 50,
    MAX_NAME_LENGTH: 100,
    MIN_PASSWORD_LENGTH: 6,
    MIN_USERNAME_LENGTH: 3,
} as const;

