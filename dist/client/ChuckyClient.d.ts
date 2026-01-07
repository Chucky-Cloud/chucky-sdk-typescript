/**
 * Chucky Client
 *
 * Main entry point for the Chucky SDK.
 * Provides methods to create sessions and execute prompts.
 * Matches the official Claude Agent SDK V2 interface.
 */
import type { ClientOptions, SessionOptions, ClientEventHandlers } from '../types/options.js';
import type { SDKResultMessage } from '../types/messages.js';
import { Session, getAssistantText, getResultText } from './Session.js';
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
export declare class ChuckyClient {
    private readonly options;
    private eventHandlers;
    private activeSessions;
    /**
     * Create a new Chucky client
     */
    constructor(options: ClientOptions);
    /**
     * Set event handlers
     */
    on(handlers: ClientEventHandlers): this;
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
    createSession(options?: SessionOptions): Session;
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
    resumeSession(sessionId: string, options?: Omit<SessionOptions, 'sessionId'>): Session;
    /**
     * Execute a one-shot prompt (stateless)
     *
     * Matches V2 SDK: prompt() for simple one-off queries.
     *
     * @param message - The message to send
     * @param options - Prompt configuration
     * @returns The result message
     *
     * @example
     * ```typescript
     * const result = await client.prompt(
     *   'Explain quantum computing in simple terms',
     *   { model: 'claude-sonnet-4-5-20250929' }
     * );
     * if (result.subtype === 'success') {
     *   console.log(result.result);
     * }
     * ```
     */
    prompt(message: string, options?: SessionOptions): Promise<SDKResultMessage>;
    /**
     * Close all active sessions and disconnect
     */
    close(): void;
    /**
     * Create a new transport instance
     */
    private createTransport;
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
export declare function createClient(options: ClientOptions): ChuckyClient;
export { getAssistantText, getResultText };
//# sourceMappingURL=ChuckyClient.d.ts.map