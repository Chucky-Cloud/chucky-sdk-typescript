/**
 * Chucky Client
 *
 * Main entry point for the Chucky SDK.
 * Provides methods to create sessions and execute prompts.
 * Matches the official Claude Agent SDK V2 interface.
 */

import type {
  ClientOptions,
  SessionOptions,
  PromptOptions,
  ClientEventHandlers,
} from '../types/options.js';
import type { SDKResultMessage } from '../types/messages.js';
import { WebSocketTransport } from '../transport/WebSocketTransport.js';
import { Session, getAssistantText, getResultText } from './Session.js';

/**
 * Default base URL for the Chucky service
 */
const DEFAULT_BASE_URL = 'wss://conjure.chucky.cloud/ws';

/**
 * Chucky client for interacting with the sandbox service
 *
 * Matches the official Claude Agent SDK V2 interface.
 *
 * @example
 * ```typescript
 * import { ChuckyClient } from '@chucky.cloud/sdk';
 *
 * const client = new ChuckyClient({
 *   token: 'your-jwt-token',
 * });
 *
 * // Create a session (V2 style)
 * const session = client.createSession({
 *   model: 'claude-sonnet-4-5-20250929',
 *   systemPrompt: 'You are a helpful assistant.',
 * });
 *
 * // Send messages and stream responses
 * await session.send('Hello, world!');
 * for await (const msg of session.stream()) {
 *   if (msg.type === 'assistant') {
 *     const text = getAssistantText(msg);
 *     console.log(text);
 *   }
 *   if (msg.type === 'result') {
 *     console.log('Done:', msg);
 *   }
 * }
 *
 * session.close();
 * ```
 */
export class ChuckyClient {
  private readonly options: Required<Pick<ClientOptions, 'baseUrl' | 'token' | 'debug'>> &
    Omit<ClientOptions, 'baseUrl' | 'token' | 'debug'>;
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
   * Set event handlers
   */
  on(handlers: ClientEventHandlers): this {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
    return this;
  }

  /**
   * Create a new session
   *
   * Matches V2 SDK: createSession() returns a Session immediately.
   * Connection happens automatically on first send().
   *
   * @param options - Session configuration options
   * @returns A new session instance
   *
   * @example
   * ```typescript
   * const session = client.createSession({
   *   model: 'claude-sonnet-4-5-20250929',
   *   systemPrompt: 'You are a helpful coding assistant.',
   * });
   *
   * await session.send('Hello!');
   * for await (const msg of session.stream()) {
   *   // Handle messages
   * }
   * ```
   */
  createSession(options: SessionOptions = {}): Session {
    const transport = this.createTransport();
    const session = new Session(transport, options, {
      debug: this.options.debug,
    });

    // Track the session
    session.on({
      onSessionInfo: (info) => {
        if (info.sessionId) {
          this.activeSessions.set(info.sessionId, session);
        }
      },
    });

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
   * const session = client.resumeSession('session-123');
   * await session.send('Continue our conversation');
   * ```
   */
  resumeSession(sessionId: string, options: Omit<SessionOptions, 'sessionId'> = {}): Session {
    return this.createSession({
      ...options,
      sessionId,
    });
  }

  /**
   * Execute a one-shot prompt (stateless)
   *
   * Supports two call signatures:
   * - `prompt('message', { model: '...' })` - positional style
   * - `prompt({ message: '...', model: '...' })` - object style
   *
   * @param messageOrOptions - The message string OR an options object with message
   * @param options - Prompt configuration (only used with positional style)
   * @returns The result message
   *
   * @example
   * ```typescript
   * // Positional style
   * const result = await client.prompt(
   *   'Explain quantum computing in simple terms',
   *   { model: 'claude-sonnet-4-5-20250929' }
   * );
   *
   * // Object style
   * const result = await client.prompt({
   *   message: 'Explain quantum computing in simple terms',
   *   model: 'claude-sonnet-4-5-20250929',
   * });
   *
   * if (result.subtype === 'success') {
   *   console.log(result.result);
   * }
   * ```
   */
  async prompt(
    messageOrOptions: string | PromptOptions,
    options: SessionOptions = {}
  ): Promise<SDKResultMessage> {
    // Support both call signatures
    let message: string;
    let sessionOptions: SessionOptions;

    if (typeof messageOrOptions === 'object') {
      // Object style: prompt({ message: '...', model: '...' })
      const { message: msg, ...rest } = messageOrOptions;
      message = msg;
      sessionOptions = rest;
    } else {
      // Positional style: prompt('...', { model: '...' })
      message = messageOrOptions;
      sessionOptions = options;
    }

    const session = this.createSession(sessionOptions);

    try {
      await session.send(message);

      let result: SDKResultMessage | null = null;
      for await (const msg of session.stream()) {
        if (msg.type === 'result') {
          result = msg as SDKResultMessage;
          break;
        }
      }

      if (!result) {
        throw new Error('No result message received');
      }

      return result;
    } finally {
      session.close();
    }
  }

  /**
   * Close all active sessions and disconnect
   */
  close(): void {
    for (const session of this.activeSessions.values()) {
      session.close();
    }
    this.activeSessions.clear();
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

// Re-export helpers for convenience
export { getAssistantText, getResultText };
