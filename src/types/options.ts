/**
 * SDK Options Types
 *
 * These types define all configuration options for sessions and prompts.
 * Designed for both browser and Node.js environments.
 */

import type { McpServerDefinition, ToolsConfig } from './tools.js';

/**
 * Available Claude models
 */
export type Model =
  | 'claude-sonnet-4-5-20250929'
  | 'claude-opus-4-5-20251101'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-opus-20240229'
  | (string & {}); // Allow custom model strings

/**
 * System prompt configuration
 */
export type SystemPrompt =
  | string
  | {
      /** Use a preset system prompt */
      type: 'preset';
      /** The preset name */
      preset: 'claude_code';
      /** Additional text to append to the preset */
      append?: string;
    };

/**
 * Output format configuration for structured outputs
 */
export interface OutputFormat {
  /** Output format type */
  type: 'json_schema';
  /** JSON Schema definition for the expected output */
  schema: Record<string, unknown>;
}

/**
 * Agent definition for sub-agents
 */
export interface AgentDefinition {
  /** Agent name */
  name: string;
  /** Agent description */
  description?: string;
  /** Model to use for this agent */
  model?: Model;
  /** System prompt for this agent */
  systemPrompt?: SystemPrompt;
  /** Tools available to this agent */
  tools?: string[];
  /** Maximum turns for this agent */
  maxTurns?: number;
}

/**
 * Base options shared between sessions and prompts
 */
export interface BaseOptions {
  /**
   * The model to use for generation
   * @default 'claude-sonnet-4-5-20250929'
   */
  model?: Model;

  /**
   * Fallback model if primary model is unavailable
   */
  fallbackModel?: Model;

  /**
   * Maximum number of conversation turns
   */
  maxTurns?: number;

  /**
   * Maximum budget in USD for this session/prompt
   */
  maxBudgetUsd?: number;

  /**
   * Maximum thinking tokens (for extended thinking)
   */
  maxThinkingTokens?: number;

  /**
   * System prompt or preset configuration
   */
  systemPrompt?: SystemPrompt;

  /**
   * Tool configuration - allowlist of tool names or preset
   * Pass an array of tool names or use the preset to get Claude Code's default tools
   */
  tools?: ToolsConfig;

  /**
   * List of tool names that are allowed
   */
  allowedTools?: string[];

  /**
   * List of tool names that are blocked
   */
  disallowedTools?: string[];

  /**
   * MCP server definitions (array format)
   * Bridge translates to Record format for official SDK
   */
  mcpServers?: McpServerDefinition[];

  /**
   * Sub-agent definitions
   */
  agents?: Record<string, AgentDefinition>;

  /**
   * Beta features to enable
   */
  betas?: string[];

  /**
   * Permission mode for sandbox operations
   */
  permissionMode?: 'default' | 'plan' | 'bypassPermissions';

  /**
   * Allow dangerous operations (use with caution)
   */
  allowDangerouslySkipPermissions?: boolean;

  /**
   * Custom environment variables
   */
  env?: Record<string, string>;

  /**
   * Output format for structured responses
   */
  outputFormat?: OutputFormat;

  /**
   * Include partial messages in the stream
   */
  includePartialMessages?: boolean;
}

/**
 * Session-specific options
 */
export interface SessionOptions extends BaseOptions {
  /**
   * Session ID for resuming an existing session
   */
  sessionId?: string;

  /**
   * Fork from an existing session instead of resuming
   */
  forkSession?: boolean;

  /**
   * Resume session at a specific conversation ID
   */
  resumeSessionAt?: string;

  /**
   * Continue from where the session left off
   */
  continue?: boolean;

  /**
   * Settings sources for configuration
   */
  settingSources?: Array<'user' | 'project' | 'local'>;

  /**
   * Job ID for tracking background/deferred executions
   */
  jobId?: string;
}

/**
 * Prompt-specific options (stateless, one-shot)
 */
export interface PromptOptions extends BaseOptions {
  /**
   * The prompt message to send
   */
  message: string;
}

/**
 * Client configuration options
 */
export interface ClientOptions {
  /**
   * Base URL for the Chucky service
   * @default 'wss://box.chucky.cloud'
   */
  baseUrl?: string;

  /**
   * Authentication token (JWT)
   */
  token: string;

  /**
   * Persistent sandbox name (vessel)
   * When specified, enables reusable sandboxes that persist across connections.
   * First connection creates a new sandbox, subsequent connections resume it.
   */
  vessel?: string;

  /**
   * Enable debug logging
   */
  debug?: boolean;

  /**
   * Connection timeout in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Keep-alive interval in milliseconds
   * @default 300000 (5 minutes)
   */
  keepAliveInterval?: number;

  /**
   * Auto-reconnect on disconnect
   * @default true
   */
  autoReconnect?: boolean;

  /**
   * Maximum reconnect attempts
   * @default 5
   */
  maxReconnectAttempts?: number;
}

/**
 * Connection status
 */
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

/**
 * Event handlers for client events
 */
export interface ClientEventHandlers {
  /** Called when connection status changes */
  onStatusChange?: (status: ConnectionStatus) => void;

  /** Called when a raw message is sent or received (for debugging) */
  onRawMessage?: (direction: 'in' | 'out', message: unknown) => void;

  /** Called when an error occurs */
  onError?: (error: Error) => void;
}
