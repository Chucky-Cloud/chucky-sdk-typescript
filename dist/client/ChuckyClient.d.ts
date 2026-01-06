/**
 * Chucky Client
 *
 * Main entry point for the Chucky SDK.
 * Provides methods to create sessions and execute prompts.
 */
import type { ClientOptions, SessionOptions, PromptOptions, ConnectionStatus, ClientEventHandlers } from '../types/options.js';
import type { PromptResult } from '../types/results.js';
import { Session } from './Session.js';
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
export declare class ChuckyClient {
    private readonly options;
    private transport;
    private eventHandlers;
    private activeSessions;
    /**
     * Create a new Chucky client
     */
    constructor(options: ClientOptions);
    /**
     * Get the current connection status
     */
    get status(): ConnectionStatus;
    /**
     * Set event handlers
     */
    on(handlers: ClientEventHandlers): this;
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
    createSession(options?: SessionOptions): Promise<Session>;
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
    resumeSession(sessionId: string, options?: Omit<SessionOptions, 'sessionId'>): Promise<Session>;
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
    prompt(options: PromptOptions): Promise<PromptResult>;
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
    promptStream(options: PromptOptions): AsyncGenerator<StreamingEvent, PromptResult, unknown>;
    /**
     * Close all active sessions and disconnect
     */
    close(): Promise<void>;
    /**
     * Create a new transport instance
     */
    private createTransport;
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
export type StreamingEvent = StreamingTextEvent | StreamingToolUseEvent | StreamingToolResultEvent | StreamingThinkingEvent | StreamingErrorEvent;
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
//# sourceMappingURL=ChuckyClient.d.ts.map