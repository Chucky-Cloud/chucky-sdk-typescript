/**
 * Session
 *
 * Represents a conversation session with the Chucky sandbox.
 * Supports multi-turn conversations, tool execution, and streaming.
 */
import type { SessionOptions } from '../types/options.js';
import type { SessionResult, SessionInfo, SessionState, Message } from '../types/results.js';
import type { ToolResult, ToolCall } from '../types/tools.js';
import type { Transport } from '../transport/Transport.js';
import type { StreamingEvent } from './ChuckyClient.js';
/**
 * Session event handlers
 */
export interface SessionEventHandlers {
    /** Called when session info is received */
    onSessionInfo?: (info: SessionInfo) => void;
    /** Called when a message is received */
    onMessage?: (message: Message) => void;
    /** Called when streaming text is received */
    onText?: (text: string) => void;
    /** Called when a tool is being used */
    onToolUse?: (toolCall: ToolCall) => void;
    /** Called when a tool result is returned */
    onToolResult?: (callId: string, result: ToolResult) => void;
    /** Called when thinking is received */
    onThinking?: (thinking: string) => void;
    /** Called when session completes */
    onComplete?: (result: SessionResult) => void;
    /** Called when an error occurs */
    onError?: (error: Error) => void;
}
/**
 * Internal session configuration
 */
interface SessionConfig {
    debug?: boolean;
    oneShot?: boolean;
}
/**
 * Session class for managing conversations
 *
 * @example
 * ```typescript
 * const session = await client.createSession({
 *   model: 'claude-sonnet-4-5-20250929',
 * });
 *
 * // Simple send
 * const result = await session.send('Hello!');
 *
 * // Streaming
 * for await (const event of session.sendStream('Tell me a story')) {
 *   if (event.type === 'text') {
 *     process.stdout.write(event.text);
 *   }
 * }
 *
 * // Multi-turn
 * await session.send('What is the capital of France?');
 * await session.send('What about Germany?');
 * ```
 */
export declare class Session {
    private transport;
    private options;
    private config;
    private eventHandlers;
    private toolHandlers;
    private messageBuffer;
    private currentResult;
    private _state;
    private _sessionId;
    private messageResolvers;
    constructor(transport: Transport, options: SessionOptions, config?: SessionConfig);
    /**
     * Get the current session state
     */
    get state(): SessionState;
    /**
     * Get the session ID
     */
    get sessionId(): string | null;
    /**
     * Set event handlers
     */
    on(handlers: SessionEventHandlers): this;
    /**
     * Connect and initialize the session
     */
    connect(): Promise<void>;
    /**
     * Send a message and wait for complete response
     */
    send(message: string): Promise<SessionResult>;
    /**
     * Send a message with streaming
     */
    sendStream(message: string): AsyncGenerator<StreamingEvent, void, unknown>;
    /**
     * Execute a one-shot prompt
     */
    prompt(message: string): Promise<SessionResult>;
    /**
     * Get the current/last result
     */
    getResult(): SessionResult | null;
    /**
     * Close the session
     */
    close(): Promise<void>;
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
     * Wait for result
     */
    private waitForResult;
    /**
     * Wait for next message
     */
    private waitForNextMessage;
    /**
     * Handle a tool call
     */
    private handleToolCall;
    /**
     * Convert message to streaming events
     */
    private messageToStreamingEvents;
    /**
     * Log debug messages
     */
    private log;
}
export {};
//# sourceMappingURL=Session.d.ts.map