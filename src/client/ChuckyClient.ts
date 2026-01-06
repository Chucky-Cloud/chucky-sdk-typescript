/**
 * Chucky Client
 *
 * Main entry point for the Chucky SDK.
 * Provides methods to create sessions and execute prompts.
 */

import type {
  ClientOptions,
  SessionOptions,
  PromptOptions,
  ConnectionStatus,
  ClientEventHandlers,
} from '../types/options.js';
import type { PromptResult } from '../types/results.js';
import { WebSocketTransport } from '../transport/WebSocketTransport.js';
import { Session } from './Session.js';

/**
 * Default base URL for the Chucky service
 */
const DEFAULT_BASE_URL = 'wss://conjure.chucky.cloud/ws';

/**
 * Chucky client for interacting with the sandbox service
 *
 * @example
 * ```typescript
 * import { ChuckyClient } from '@chucky.cloud/sdk';
 *
 * const client = new ChuckyClient({
 *   token: 'your-jwt-token',
 * });
 *
 * // Create a session
 * const session = await client.createSession({
 *   model: 'claude-sonnet-4-5-20250929',
 *   systemPrompt: 'You are a helpful assistant.',
 * });
 *
 * // Send messages
 * const result = await session.send('Hello, world!');
 * console.log(result.text);
 *
 * // Or use one-shot prompts
 * const response = await client.prompt({
 *   message: 'What is 2 + 2?',
 *   model: 'claude-sonnet-4-5-20250929',
 * });
 * console.log(response.text);
 * ```
 */
export class ChuckyClient {
  private readonly options: Required<Pick<ClientOptions, 'baseUrl' | 'token' | 'debug'>> &
    Omit<ClientOptions, 'baseUrl' | 'token' | 'debug'>;
  private transport: WebSocketTransport | null = null;
  private eventHandlers: ClientEventHandlers = {};
  private activeSessions: Map<string, Session> = new Map();

  /**
   * Create a new Chucky client
   */
  constructor(options: ClientOptions) {
    this.options = {
      baseUrl: DEFAULT_BASE_URL,
      debug: false,
      ...options,
    };
  }

  /**
   * Get the current connection status
   */
  get status(): ConnectionStatus {
    return this.transport?.status ?? 'disconnected';
  }

  /**
   * Set event handlers
   */
  on(handlers: ClientEventHandlers): this {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
    return this;
  }

  /**
   * Create a new session
   *
   * @param options - Session configuration options
   * @returns A new session instance
   *
   * @example
   * ```typescript
   * const session = await client.createSession({
   *   model: 'claude-sonnet-4-5-20250929',
   *   systemPrompt: 'You are a helpful coding assistant.',
   *   tools: [
   *     {
   *       name: 'get_weather',
   *       description: 'Get the current weather',
   *       inputSchema: {
   *         type: 'object',
   *         properties: {
   *           city: { type: 'string', description: 'City name' },
   *         },
   *         required: ['city'],
   *       },
   *       handler: async ({ city }) => ({
   *         content: [{ type: 'text', text: `Weather in ${city}: Sunny, 72°F` }],
   *       }),
   *     },
   *   ],
   * });
   * ```
   */
  async createSession(options: SessionOptions = {}): Promise<Session> {
    const transport = this.createTransport();
    const session = new Session(transport, options, {
      debug: this.options.debug,
    });

    // Track the session
    session.on({
      onSessionInfo: (info) => {
        this.activeSessions.set(info.sessionId, session);
      },
    });

    await session.connect();
    return session;
  }

  /**
   * Resume an existing session
   *
   * @param sessionId - The session ID to resume
   * @param options - Additional session options
   * @returns The resumed session
   *
   * @example
   * ```typescript
   * const session = await client.resumeSession('session-123', {
   *   continue: true,
   * });
   * ```
   */
  async resumeSession(sessionId: string, options: Omit<SessionOptions, 'sessionId'> = {}): Promise<Session> {
    return this.createSession({
      ...options,
      sessionId,
    });
  }

  /**
   * Execute a one-shot prompt (stateless)
   *
   * @param options - Prompt configuration
   * @returns The prompt result
   *
   * @example
   * ```typescript
   * const result = await client.prompt({
   *   message: 'Explain quantum computing in simple terms',
   *   model: 'claude-sonnet-4-5-20250929',
   * });
   * console.log(result.text);
   * ```
   */
  async prompt(options: PromptOptions): Promise<PromptResult> {
    const transport = this.createTransport();
    const session = new Session(transport, options, {
      debug: this.options.debug,
      oneShot: true,
    });

    await session.connect();
    return session.prompt(options.message) as Promise<PromptResult>;
  }

  /**
   * Execute a prompt with streaming
   *
   * @param options - Prompt configuration
   * @yields Stream events and final result
   *
   * @example
   * ```typescript
   * for await (const event of client.promptStream({ message: 'Tell me a story' })) {
   *   if (event.type === 'text') {
   *     process.stdout.write(event.text);
   *   }
   * }
   * ```
   */
  async *promptStream(options: PromptOptions): AsyncGenerator<StreamingEvent, PromptResult, unknown> {
    const transport = this.createTransport();
    const session = new Session(transport, options, {
      debug: this.options.debug,
      oneShot: true,
    });

    await session.connect();

    for await (const event of session.sendStream(options.message)) {
      yield event;
    }

    // Return final result
    return session.getResult() as PromptResult;
  }

  /**
   * Close all active sessions and disconnect
   */
  async close(): Promise<void> {
    for (const session of this.activeSessions.values()) {
      await session.close();
    }
    this.activeSessions.clear();

    if (this.transport) {
      await this.transport.disconnect();
      this.transport = null;
    }
  }

  /**
   * Create a new transport instance
   */
  private createTransport(): WebSocketTransport {
    return new WebSocketTransport({
      url: this.options.baseUrl,
      token: this.options.token,
      timeout: this.options.timeout,
      keepAliveInterval: this.options.keepAliveInterval,
      autoReconnect: this.options.autoReconnect,
      maxReconnectAttempts: this.options.maxReconnectAttempts,
      debug: this.options.debug,
    });
  }
}

/**
 * Streaming event types
 */
export interface StreamingTextEvent {
  type: 'text';
  text: string;
}

export interface StreamingToolUseEvent {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface StreamingToolResultEvent {
  type: 'tool_result';
  id: string;
  content: unknown;
  isError?: boolean;
}

export interface StreamingThinkingEvent {
  type: 'thinking';
  thinking: string;
}

export interface StreamingErrorEvent {
  type: 'error';
  error: Error;
}

export type StreamingEvent =
  | StreamingTextEvent
  | StreamingToolUseEvent
  | StreamingToolResultEvent
  | StreamingThinkingEvent
  | StreamingErrorEvent;

/**
 * Create a Chucky client
 *
 * @param options - Client configuration
 * @returns A new ChuckyClient instance
 *
 * @example
 * ```typescript
 * import { createClient } from '@chucky.cloud/sdk';
 *
 * const client = createClient({
 *   token: 'your-jwt-token',
 * });
 * ```
 */
export function createClient(options: ClientOptions): ChuckyClient {
  return new ChuckyClient(options);
}
