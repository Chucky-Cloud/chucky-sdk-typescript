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
 * Extract project UUID from HMAC key
 *
 * The HMAC key format is `hk_live_{32-char-hex}`.
 * The hex part is converted to UUID format (8-4-4-4-12).
 *
 * @param hmacKey - HMAC key from the portal (hk_live_...)
 * @returns Project UUID for use as `iss` claim in tokens
 *
 * @example
 * ```typescript
 * const hmacKey = 'hk_live_938642b649c64cc3975e504c0fbcbbd8';
 * const projectId = extractProjectId(hmacKey);
 * // Returns: '938642b6-49c6-4cc3-975e-504c0fbcbbd8'
 *
 * const token = await createToken({
 *   userId: 'user-123',
 *   projectId,
 *   secret: hmacKey,
 *   // ...
 * });
 * ```
 */
export declare function extractProjectId(hmacKey: string): string;
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