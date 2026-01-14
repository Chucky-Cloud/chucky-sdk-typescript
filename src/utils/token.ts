/**
 * Token Utilities
 *
 * Helpers for creating and decoding JWT tokens for authentication.
 * These are primarily for server-side use (Node.js).
 */

import type {
  BudgetTokenPayload,
  CreateTokenOptions,
  DecodedToken,
  TokenBudget,
} from '../types/token.js';

/**
 * Base64URL encode a string
 */
function base64UrlEncode(data: string | Uint8Array): string {
  let base64: string;

  if (typeof data === 'string') {
    // Use TextEncoder for string
    const bytes = new TextEncoder().encode(data);
    base64 = btoa(String.fromCharCode(...bytes));
  } else {
    base64 = btoa(String.fromCharCode(...data));
  }

  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64URL decode a string
 */
function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const bytes = atob(base64 + padding);
  return bytes;
}

/**
 * Get crypto implementation (browser or Node.js)
 */
async function getCrypto(): Promise<{
  subtle: SubtleCrypto;
  getRandomValues: (array: Uint8Array) => Uint8Array;
}> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    return crypto;
  }

  // Node.js: use webcrypto
  const nodeCrypto = await import('crypto');
  return nodeCrypto.webcrypto as unknown as {
    subtle: SubtleCrypto;
    getRandomValues: (array: Uint8Array) => Uint8Array;
  };
}

/**
 * Create HMAC-SHA256 signature
 */
async function createHmacSignature(secret: string, data: string): Promise<string> {
  const { subtle } = await getCrypto();

  const keyData = new TextEncoder().encode(secret);
  const key = await subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return base64UrlEncode(new Uint8Array(signature));
}

/**
 * Verify HMAC-SHA256 signature
 */
async function verifyHmacSignature(
  secret: string,
  data: string,
  signature: string
): Promise<boolean> {
  const expectedSignature = await createHmacSignature(secret, data);
  return signature === expectedSignature;
}

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
export async function createToken(options: CreateTokenOptions): Promise<string> {
  const {
    userId,
    projectId,
    secret,
    expiresIn = 3600,
    budget,
    permissions,
    sdkConfig,
  } = options;

  const now = Math.floor(Date.now() / 1000);

  const payload: BudgetTokenPayload = {
    sub: userId,
    iss: projectId,
    iat: now,
    exp: now + expiresIn,
    budget,
    ...(permissions && { permissions }),
    ...(sdkConfig && { sdkConfig }),
  };

  // Create header
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  // Encode header and payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  // Create signature
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await createHmacSignature(secret, signatureInput);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

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
export function decodeToken(token: string): DecodedToken {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [encodedHeader, encodedPayload, signature] = parts;

  const header = JSON.parse(base64UrlDecode(encodedHeader));
  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as BudgetTokenPayload;

  return { header, payload, signature };
}

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
export async function verifyToken(token: string, secret: string): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  return verifyHmacSignature(secret, signatureInput, signature);
}

/**
 * Check if a token is expired
 *
 * @param token - JWT token to check
 * @returns True if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    const now = Math.floor(Date.now() / 1000);
    return decoded.payload.exp < now;
  } catch {
    return true;
  }
}

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
export function extractProjectId(_hmacKey: string): never {
  throw new Error(
    'extractProjectId() is deprecated. The project ID is now separate from the HMAC key for security. ' +
    'Get your project ID from the Chucky portal (app.chucky.cloud) in your project settings.'
  );
}

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
export function createBudget(options: {
  /** AI budget in dollars */
  aiDollars: number;
  /** Compute budget in hours */
  computeHours: number;
  /** Budget window. Use 'lifetime' for one-time tokens that never reset. */
  window: 'hour' | 'day' | 'week' | 'month' | 'lifetime';
  /** Window start (default: now). For 'lifetime', this is the fixed reference point. */
  windowStart?: Date;
}): TokenBudget {
  return {
    ai: Math.floor(options.aiDollars * 1_000_000), // Convert to microdollars
    compute: Math.floor(options.computeHours * 3600), // Convert to seconds
    window: options.window,
    windowStart: (options.windowStart || new Date()).toISOString(),
  };
}
