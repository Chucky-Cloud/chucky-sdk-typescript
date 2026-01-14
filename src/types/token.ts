/**
 * Budget Token Types
 *
 * Types for JWT tokens used for authentication and budget control.
 */

/**
 * Budget window types.
 * Use 'lifetime' for one-time tokens where the budget never resets.
 */
export type BudgetWindow = 'hour' | 'day' | 'week' | 'month' | 'lifetime';

/**
 * Budget configuration in a token
 */
export interface TokenBudget {
  /** AI budget in microdollars (1 USD = 1,000,000 microdollars) */
  ai: number;
  /** Compute budget in seconds */
  compute: number;
  /** Budget window period */
  window: BudgetWindow;
  /** When current period started (ISO 8601) */
  windowStart: string;
}

/**
 * Permission configuration in a token
 */
export interface TokenPermissions {
  /** Allowed tool names */
  tools?: string[];
  /** Blocked tool names */
  blockedTools?: string[];
  /** Maximum turns per conversation */
  maxTurns?: number;
  /** Model restriction */
  model?: string;
}

/**
 * SDK configuration overrides in a token
 * When present, these values SUPERSEDE options provided by the SDK client
 */
export interface TokenSdkConfig {
  /** Model to use */
  model?: string;
  /** System prompt */
  systemPrompt?: string;
  /** Tools configuration */
  tools?: unknown;
  /** Allowed tools */
  allowedTools?: string[];
  /** Disallowed tools */
  disallowedTools?: string[];
  /** Maximum turns */
  maxTurns?: number;
  /** Maximum budget in USD */
  maxBudgetUsd?: number;
  /** Maximum thinking tokens */
  maxThinkingTokens?: number;
  /** Permission mode */
  permissionMode?: string;
  /** Allow dangerous skip permissions */
  allowDangerouslySkipPermissions?: boolean;
  /** MCP servers configuration */
  mcpServers?: unknown[];
  /** Agents configuration */
  agents?: unknown;
  /** Betas configuration */
  betas?: string[];
  /** Output format */
  outputFormat?: string;
  /** Environment variables */
  env?: Record<string, string>;
}

/**
 * Budget token payload (JWT claims)
 */
export interface BudgetTokenPayload {
  /** User ID - unique identifier for the end user */
  sub: string;
  /** Project/Issuer ID - identifies which project */
  iss: string;
  /** Token expiry timestamp (Unix seconds) */
  exp: number;
  /** Issued at timestamp (Unix seconds) */
  iat?: number;
  /** Budget declaration */
  budget: TokenBudget;
  /** Permission configuration (optional) */
  permissions?: TokenPermissions;
  /** SDK config overrides (optional) */
  sdkConfig?: TokenSdkConfig;
}

/**
 * Options for creating a budget token
 */
export interface CreateTokenOptions {
  /** User ID */
  userId: string;
  /** Project/Issuer ID (UUID) */
  projectId: string;
  /** HMAC secret key for signing */
  secret: string;
  /** Token expiry duration in seconds (default: 3600 = 1 hour) */
  expiresIn?: number;
  /** Budget configuration */
  budget: TokenBudget;
  /** Permission configuration */
  permissions?: TokenPermissions;
  /** SDK config overrides */
  sdkConfig?: TokenSdkConfig;
}

/**
 * Decoded token result
 */
export interface DecodedToken {
  /** Token header */
  header: {
    alg: string;
    typ: string;
  };
  /** Token payload */
  payload: BudgetTokenPayload;
  /** Token signature (base64url) */
  signature: string;
}
