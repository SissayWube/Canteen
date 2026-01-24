// Error Handling Utility

interface ApiError {
    response?: {
        data?: {
            error?: string;
            message?: string;
            details?: any;
        };
    };
    message?: string;
}

/**
 * Centralized error handler for API calls
 * @param error - Error object from API call
 * @param fallbackMessage - Default message if no error message found
 * @returns User-friendly error message
 */
export const handleApiError = (error: unknown, fallbackMessage = 'An error occurred'): string => {
    const apiError = error as ApiError;

    // Try to extract error message from various possible locations
    const message =
        apiError.response?.data?.error ||
        apiError.response?.data?.message ||
        apiError.message ||
        fallbackMessage;

    // Log for debugging in development
    if (import.meta.env.DEV) {
        console.error('API Error:', {
            message,
            details: apiError.response?.data?.details,
            fullError: error
        });
    }

    return message;
};

/**
 * Format validation errors from backend
 * @param error - Error with validation details
 * @returns Formatted error message
 */
export const formatValidationError = (error: unknown): string => {
    const apiError = error as ApiError;
    const details = apiError.response?.data?.details;

    if (Array.isArray(details)) {
        return details.map((err: any) => `${err.field}: ${err.message}`).join(', ');
    }

    return handleApiError(error, 'Validation failed');
};
