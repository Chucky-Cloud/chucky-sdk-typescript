/**
 * Error Classes
 *
 * Custom error types for the Chucky SDK.
 */
/**
 * Base error class for Chucky SDK errors
 */
export declare class ChuckyError extends Error {
    /** Error code */
    readonly code: string;
    /** Additional error details */
    readonly details?: Record<string, unknown>;
    constructor(message: string, code: string, details?: Record<string, unknown>);
}
/**
 * Connection error
 */
export declare class ConnectionError extends ChuckyError {
    constructor(message: string, details?: Record<string, unknown>);
}
/**
 * Authentication error
 */
export declare class AuthenticationError extends ChuckyError {
    constructor(message: string, details?: Record<string, unknown>);
}
/**
 * Budget exceeded error
 */
export declare class BudgetExceededError extends ChuckyError {
    constructor(message: string, details?: Record<string, unknown>);
}
/**
 * Concurrency limit error
 */
export declare class ConcurrencyLimitError extends ChuckyError {
    constructor(message: string, details?: Record<string, unknown>);
}
/**
 * Rate limit error
 */
export declare class RateLimitError extends ChuckyError {
    constructor(message: string, details?: Record<string, unknown>);
}
/**
 * Session error
 */
export declare class SessionError extends ChuckyError {
    constructor(message: string, details?: Record<string, unknown>);
}
/**
 * Tool execution error
 */
export declare class ToolExecutionError extends ChuckyError {
    /** Tool name */
    readonly toolName: string;
    constructor(message: string, toolName: string, details?: Record<string, unknown>);
}
/**
 * Timeout error
 */
export declare class TimeoutError extends ChuckyError {
    constructor(message: string, details?: Record<string, unknown>);
}
/**
 * Validation error
 */
export declare class ValidationError extends ChuckyError {
    constructor(message: string, details?: Record<string, unknown>);
}
/**
 * Parse error code from error message
 */
export declare function parseErrorCode(message: string): string | null;
/**
 * Create appropriate error from message and optional code
 */
export declare function createError(message: string, code?: string): ChuckyError;
//# sourceMappingURL=errors.d.ts.map