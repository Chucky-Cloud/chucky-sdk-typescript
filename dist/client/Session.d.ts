/**
 * Session
 *
 * Represents a conversation session with the Chucky sandbox.
 * Matches the official Claude Agent SDK V2 interface.
 *
 * @example
 * ```typescript
 * const session = createSession({ token, model: 'claude-sonnet-4-5-20250929' });
 *
 * await session.send('Hello!');
 * for await (const msg of session.stream()) {
 *   if (msg.type === 'assistant') {
 *     console.log(getAssistantText(msg));
 *   }
 * }
 * ```
 */
import type { SessionOptions } from '../types/options.js';
import type { SessionInfo } from '../types/results.js';
import type { SDKMessage } from '../types/messages.js';
import type { Transport } from '../transport/Transport.js';
/**
 * Session event handlers
 */
export interface SessionEventHandlers {
    onSessionInfo?: (info: SessionInfo) => void;
    onError?: (error: Error) => void;
}
/**
 * Internal session configuration
 */
interface SessionConfig {
    debug?: boolean;
}
/**
 * Session class - matches official V2 SDK interface
 *
 * Usage:
 * ```typescript
 * const session = createSession({ token, model: 'claude-sonnet-4-5-20250929' });
 *
 * // Multi-turn conversation
 * await session.send('What is 5 + 3?');
 * for await (const msg of session.stream()) {
 *   if (msg.type === 'result') console.log(msg.result);
 * }
 *
 * await session.send('Multiply that by 2');
 * for await (const msg of session.stream()) {
 *   if (msg.type === 'result') console.log(msg.result);
 * }
 *
 * session.close();
 * ```
 */
export declare class Session {
    private transport;
    private options;
    private config;
    private eventHandlers;
    private toolHandlers;
    private messageBuffer;
    private _state;
    private _sessionId;
    private messageResolvers;
    private connected;
    private connectPromise;
    constructor(transport: Transport, options: SessionOptions, config?: SessionConfig);
    /**
     * Get the session ID
     */
    get sessionId(): string;
    /**
     * Set event handlers
     */
    on(handlers: SessionEventHandlers): this;
    /**
     * Connect and initialize the session (called automatically on first send)
     */
    private ensureConnected;
    private connect;
    /**
     * Send a message to the session
     *
     * Matches V2 SDK: send() returns Promise<void>
     * Use stream() to get the response.
     *
     * @example
     * ```typescript
     * await session.send('Hello!');
     * for await (const msg of session.stream()) {
     *   // Handle messages
     * }
     * ```
     */
    send(message: string): Promise<void>;
    /**
     * Stream the response after sending a message
     *
     * Matches V2 SDK: Returns AsyncGenerator<SDKMessage>
     *
     * @example
     * ```typescript
     * await session.send('Hello!');
     * for await (const msg of session.stream()) {
     *   if (msg.type === 'assistant') {
     *     const text = msg.message.content
     *       .filter(b => b.type === 'text')
     *       .map(b => b.text)
     *       .join('');
     *     console.log(text);
     *   }
     *   if (msg.type === 'result') {
     *     console.log('Done:', msg.result);
     *   }
     * }
     * ```
     */
    stream(): AsyncGenerator<SDKMessage, void, unknown>;
    /**
     * Receive messages (alias for stream for V2 compatibility)
     */
    receive(): AsyncGenerator<SDKMessage, void, unknown>;
    /**
     * Close the session
     */
    close(): void;
    /**
     * Support for `await using` (TypeScript 5.2+)
     */
    [Symbol.asyncDispose](): Promise<void>;
    /**
     * Build init payload from options
     */
    private buildInitPayload;
    /**
     * Handle incoming message
     */
    private handleMessage;
    /**
     * Wait for session to be ready
     */
    private waitForReady;
    /**
     * Wait for next message
     */
    private waitForNextMessage;
    /**
     * Handle a tool call
     */
    private handleToolCall;
    /**
     * Log debug messages
     */
    private log;
}
/**
 * Extract text from an assistant message
 */
export declare function getAssistantText(msg: SDKMessage): string | null;
/**
 * Extract result from a result message
 */
export declare function getResultText(msg: SDKMessage): string | null;
export {};
//# sourceMappingURL=Session.d.ts.map