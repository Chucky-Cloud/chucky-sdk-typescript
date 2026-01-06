/**
 * Error Classes
 *
 * Custom error types for the Chucky SDK.
 */
/**
 * Base error class for Chucky SDK errors
 */
export class ChuckyError extends Error {
    /** Error code */
    code;
    /** Additional error details */
    details;
    constructor(message, code, details) {
        super(message);
        this.name = 'ChuckyError';
        this.code = code;
        this.details = details;
        // Maintains proper stack trace for where the error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ChuckyError);
        }
    }
}
/**
 * Connection error
 */
export class ConnectionError extends ChuckyError {
    constructor(message, details) {
        super(message, 'CONNECTION_ERROR', details);
        this.name = 'ConnectionError';
    }
}
/**
 * Authentication error
 */
export class AuthenticationError extends ChuckyError {
    constructor(message, details) {
        super(message, 'AUTHENTICATION_ERROR', details);
        this.name = 'AuthenticationError';
    }
}
/**
 * Budget exceeded error
 */
export class BudgetExceededError extends ChuckyError {
    constructor(message, details) {
        super(message, 'BUDGET_EXCEEDED', details);
        this.name = 'BudgetExceededError';
    }
}
/**
 * Concurrency limit error
 */
export class ConcurrencyLimitError extends ChuckyError {
    constructor(message, details) {
        super(message, 'CONCURRENCY_LIMIT', details);
        this.name = 'ConcurrencyLimitError';
    }
}
/**
 * Rate limit error
 */
export class RateLimitError extends ChuckyError {
    constructor(message, details) {
        super(message, 'RATE_LIMIT', details);
        this.name = 'RateLimitError';
    }
}
/**
 * Session error
 */
export class SessionError extends ChuckyError {
    constructor(message, details) {
        super(message, 'SESSION_ERROR', details);
        this.name = 'SessionError';
    }
}
/**
 * Tool execution error
 */
export class ToolExecutionError extends ChuckyError {
    /** Tool name */
    toolName;
    constructor(message, toolName, details) {
        super(message, 'TOOL_EXECUTION_ERROR', { ...details, toolName });
        this.name = 'ToolExecutionError';
        this.toolName = toolName;
    }
}
/**
 * Timeout error
 */
export class TimeoutError extends ChuckyError {
    constructor(message, details) {
        super(message, 'TIMEOUT', details);
        this.name = 'TimeoutError';
    }
}
/**
 * Validation error
 */
export class ValidationError extends ChuckyError {
    constructor(message, details) {
        super(message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}
/**
 * Parse error code from error message
 */
export function parseErrorCode(message) {
    // Common error patterns
    const patterns = [
        { pattern: /budget.*exceed/i, code: 'BUDGET_EXCEEDED' },
        { pattern: /concurrency.*limit/i, code: 'CONCURRENCY_LIMIT' },
        { pattern: /rate.*limit/i, code: 'RATE_LIMIT' },
        { pattern: /auth|unauthorized|forbidden/i, code: 'AUTHENTICATION_ERROR' },
        { pattern: /timeout/i, code: 'TIMEOUT' },
        { pattern: /connect|disconnect|websocket/i, code: 'CONNECTION_ERROR' },
        { pattern: /session/i, code: 'SESSION_ERROR' },
        { pattern: /tool/i, code: 'TOOL_EXECUTION_ERROR' },
        { pattern: /invalid|validation/i, code: 'VALIDATION_ERROR' },
    ];
    for (const { pattern, code } of patterns) {
        if (pattern.test(message)) {
            return code;
        }
    }
    return null;
}
/**
 * Create appropriate error from message and optional code
 */
export function createError(message, code) {
    const errorCode = code || parseErrorCode(message) || 'UNKNOWN_ERROR';
    switch (errorCode) {
        case 'CONNECTION_ERROR':
            return new ConnectionError(message);
        case 'AUTHENTICATION_ERROR':
            return new AuthenticationError(message);
        case 'BUDGET_EXCEEDED':
            return new BudgetExceededError(message);
        case 'CONCURRENCY_LIMIT':
            return new ConcurrencyLimitError(message);
        case 'RATE_LIMIT':
            return new RateLimitError(message);
        case 'SESSION_ERROR':
            return new SessionError(message);
        case 'TIMEOUT':
            return new TimeoutError(message);
        case 'VALIDATION_ERROR':
            return new ValidationError(message);
        default:
            return new ChuckyError(message, errorCode);
    }
}
//# sourceMappingURL=errors.js.map