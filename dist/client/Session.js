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
import { createInitMessage, createUserMessage, createControlMessage, createToolResultMessage, isToolCallMessage, isControlMessage, isResultMessage, isErrorMessage, isAssistantMessage, isSystemMessage, isStreamEvent, } from '../types/messages.js';
/**
 * Generate a UUID v4
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
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
export class Session {
    transport;
    options;
    config;
    eventHandlers = {};
    toolHandlers = new Map();
    messageBuffer = [];
    _state = 'idle';
    _sessionId;
    messageResolvers = [];
    connected = false;
    connectPromise = null;
    constructor(transport, options, config = {}) {
        this.transport = transport;
        this.options = options;
        this.config = config;
        this._sessionId = options.sessionId || generateUUID();
        // Extract tool handlers from client-side MCP servers only
        if (options.mcpServers) {
            for (const server of options.mcpServers) {
                // Only extract handlers from servers with tools (not stdio/sse/http)
                if ('tools' in server) {
                    for (const tool of server.tools) {
                        if (tool.handler) {
                            this.toolHandlers.set(tool.name, tool.handler);
                        }
                    }
                }
            }
        }
        // Set up transport event handlers
        this.transport.setEventHandlers({
            onMessage: (message) => this.handleMessage(message),
            onError: (error) => this.eventHandlers.onError?.(error),
            onStatusChange: (status) => {
                if (status === 'disconnected' && this._state !== 'completed') {
                    this._state = 'error';
                }
            },
        });
    }
    /**
     * Get the session ID
     */
    get sessionId() {
        return this._sessionId;
    }
    /**
     * Set event handlers
     */
    on(handlers) {
        this.eventHandlers = { ...this.eventHandlers, ...handlers };
        return this;
    }
    /**
     * Connect and initialize the session (called automatically on first send)
     */
    async ensureConnected() {
        if (this.connected)
            return;
        if (this.connectPromise) {
            return this.connectPromise;
        }
        this.connectPromise = this.connect();
        await this.connectPromise;
    }
    async connect() {
        this._state = 'initializing';
        await this.transport.connect();
        // Send init message
        const initPayload = this.buildInitPayload();
        await this.transport.send(createInitMessage(initPayload));
        // Wait for ready/session_info
        await this.waitForReady();
        this._state = 'ready';
        this.connected = true;
    }
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
    async send(message) {
        await this.ensureConnected();
        if (this._state !== 'ready') {
            throw new Error(`Cannot send: session state is ${this._state}`);
        }
        this._state = 'processing';
        // Send user message in official SDK format
        const userMessage = createUserMessage(message, this._sessionId);
        await this.transport.send(userMessage);
    }
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
    async *stream() {
        while (this._state === 'processing' || this._state === 'waiting_tool') {
            const msg = await this.waitForNextMessage();
            // Handle tool calls internally
            if (isToolCallMessage(msg)) {
                this._state = 'waiting_tool';
                await this.handleToolCall(msg.payload);
                this._state = 'processing';
                continue;
            }
            // Yield SDK messages to caller
            if (isAssistantMessage(msg) || isResultMessage(msg) || isSystemMessage(msg) || isStreamEvent(msg)) {
                yield msg;
            }
            // Check if complete
            if (isResultMessage(msg)) {
                this._state = 'ready';
                break;
            }
            // Handle errors
            if (isErrorMessage(msg)) {
                this._state = 'ready';
                throw new Error(msg.payload.message);
            }
        }
    }
    /**
     * Receive messages (alias for stream for V2 compatibility)
     */
    receive() {
        return this.stream();
    }
    /**
     * Close the session
     */
    close() {
        this.transport.send(createControlMessage('close')).catch(() => { });
        this.transport.disconnect().catch(() => { });
        this._state = 'completed';
    }
    /**
     * Support for `await using` (TypeScript 5.2+)
     */
    async [Symbol.asyncDispose]() {
        this.close();
    }
    /**
     * Build init payload from options
     */
    buildInitPayload() {
        const { mcpServers, ...rest } = this.options;
        // Serialize MCP servers - handle all server types
        const serializedMcpServers = mcpServers?.map((server) => {
            // Client-side tools servers - serialize tools (remove handlers)
            if ('tools' in server) {
                return {
                    name: server.name,
                    version: server.version,
                    tools: server.tools.map((tool) => ({
                        name: tool.name,
                        description: tool.description,
                        inputSchema: tool.inputSchema,
                        // If tool has a handler, it executes on the client (SDK) side
                        executeIn: tool.handler ? 'client' : tool.executeIn,
                    })),
                };
            }
            // Stdio, SSE, HTTP servers pass through as-is
            return server;
        });
        return {
            ...rest,
            // tools is passed through as-is (string[] or preset for allowlisting)
            mcpServers: serializedMcpServers,
        };
    }
    /**
     * Handle incoming message
     */
    handleMessage(message) {
        this.log('Received:', message.type);
        // Handle control messages
        if (isControlMessage(message)) {
            if (message.payload.action === 'session_info') {
                const info = message.payload.data;
                this._sessionId = info.sessionId || this._sessionId;
                this.eventHandlers.onSessionInfo?.(info);
            }
        }
        // Handle system init messages (official SDK format)
        if (isSystemMessage(message) && message.subtype === 'init') {
            this._sessionId = message.session_id || this._sessionId;
            this.eventHandlers.onSessionInfo?.({
                sessionId: message.session_id,
                model: message.model,
                tools: message.tools,
            });
        }
        // Handle errors
        if (isErrorMessage(message)) {
            const error = new Error(message.payload.message);
            this.eventHandlers.onError?.(error);
        }
        // Notify waiting resolvers
        const resolver = this.messageResolvers.shift();
        if (resolver) {
            resolver(message);
        }
        else {
            this.messageBuffer.push(message);
        }
    }
    /**
     * Wait for session to be ready
     */
    async waitForReady() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Session initialization timeout'));
            }, 30000);
            const checkReady = (message) => {
                if (isControlMessage(message)) {
                    if (message.payload.action === 'ready' || message.payload.action === 'session_info') {
                        clearTimeout(timeout);
                        resolve();
                        return true;
                    }
                }
                if (isSystemMessage(message) && message.subtype === 'init') {
                    clearTimeout(timeout);
                    resolve();
                    return true;
                }
                if (isErrorMessage(message)) {
                    clearTimeout(timeout);
                    reject(new Error(message.payload.message));
                    return true;
                }
                return false;
            };
            // Check buffered messages first
            for (let i = 0; i < this.messageBuffer.length; i++) {
                if (checkReady(this.messageBuffer[i])) {
                    this.messageBuffer.splice(i, 1);
                    return;
                }
            }
            // Wait for new message
            this.messageResolvers.push((msg) => {
                checkReady(msg);
            });
        });
    }
    /**
     * Wait for next message
     */
    async waitForNextMessage() {
        if (this.messageBuffer.length > 0) {
            return this.messageBuffer.shift();
        }
        return new Promise((resolve) => {
            this.messageResolvers.push(resolve);
        });
    }
    /**
     * Handle a tool call
     */
    async handleToolCall(toolCall) {
        const handler = this.toolHandlers.get(toolCall.toolName);
        if (!handler) {
            this.log('No local handler for tool:', toolCall.toolName);
            return;
        }
        this.log('Executing tool:', toolCall.toolName);
        try {
            const result = await handler(toolCall.input);
            await this.transport.send(createToolResultMessage(toolCall.callId, result));
        }
        catch (error) {
            const errorResult = {
                content: [{ type: 'text', text: error.message }],
                isError: true,
            };
            await this.transport.send(createToolResultMessage(toolCall.callId, errorResult));
        }
    }
    /**
     * Log debug messages
     */
    log(...args) {
        if (this.config.debug) {
            console.log('[Session]', ...args);
        }
    }
}
/**
 * Extract text from an assistant message
 */
export function getAssistantText(msg) {
    if (msg.type !== 'assistant')
        return null;
    return msg.message.content
        .filter((block) => block.type === 'text')
        .map(block => block.text)
        .join('');
}
/**
 * Extract result from a result message
 */
export function getResultText(msg) {
    if (msg.type !== 'result')
        return null;
    const resultMsg = msg;
    if (resultMsg.subtype === 'success') {
        return resultMsg.result;
    }
    return null;
}
//# sourceMappingURL=Session.js.map