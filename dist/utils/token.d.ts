/**
 * Token Utilities
 *
 * Helpers for creating and decoding JWT tokens for authentication.
 * These are primarily for server-side use (Node.js).
 */
import type { CreateTokenOptions, DecodedToken, TokenBudget } from '../types/token.js';
/**
 * Create a budget token (JWT) for authenticating with Chucky
 *
 * @param options - Token creation options
 * @returns Signed JWT token
 *
 * @example
 * ```typescript
 * // Server-side token creation
 * const token = await createToken({
 *   userId: 'user-123',
 *   projectId: '550e8400-e29b-41d4-a716-446655440000',
 *   secret: 'your-hmac-secret',
 *   budget: {
 *     ai: 1_000_000, // $1 in microdollars
 *     compute: 3600,  // 1 hour
 *     window: 'day',
 *     windowStart: new Date().toISOString(),
 *   },
 * });
 * ```
 */
export declare function createToken(options: CreateTokenOptions): Promise<string>;
/**
 * Decode a token without verification
 *
 * @param token - JWT token to decode
 * @returns Decoded token parts
 *
 * @example
 * ```typescript
 * const decoded = decodeToken(token);
 * console.log(decoded.payload.sub); // User ID
 * console.log(decoded.payload.budget); // Budget limits
 * ```
 */
export declare function decodeToken(token: string): DecodedToken;
/**
 * Verify a token signature
 *
 * @param token - JWT token to verify
 * @param secret - HMAC secret for verification
 * @returns True if signature is valid
 *
 * @example
 * ```typescript
 * const isValid = await verifyToken(token, 'your-hmac-secret');
 * if (!isValid) {
 *   throw new Error('Invalid token');
 * }
 * ```
 */
export declare function verifyToken(token: string, secret: string): Promise<boolean>;
/**
 * Check if a token is expired
 *
 * @param token - JWT token to check
 * @returns True if token is expired
 */
export declare function isTokenExpired(token: string): boolean;
/**
 * @deprecated The project ID is now separate from the HMAC key for security reasons.
 * Get your project ID from the Chucky portal (app.chucky.cloud) instead.
 *
 * Previously, the HMAC key embedded the project ID, but this exposed the secret
 * in JWT tokens. Project IDs are now Convex document IDs visible in the portal.
 *
 * @param _hmacKey - Ignored (previously used to extract project ID)
 * @throws Always throws an error directing users to get project ID from portal
 */
export declare function extractProjectId(_hmacKey: string): never;
/**
 * Create a simple budget configuration
 *
 * @param options - Budget options
 * @returns Budget configuration
 *
 * @example
 * ```typescript
 * const budget = createBudget({
 *   aiDollars: 1.00,    // $1 AI budget
 *   computeHours: 1,    // 1 hour compute
 *   window: 'day',
 * });
 * ```
 */
export declare function createBudget(options: {
    /** AI budget in dollars */
    aiDollars: number;
    /** Compute budget in hours */
    computeHours: number;
    /** Budget window */
    window: 'hour' | 'day' | 'week' | 'month';
    /** Window start (default: now) */
    windowStart?: Date;
}): TokenBudget;
//# sourceMappingURL=token.d.ts.map