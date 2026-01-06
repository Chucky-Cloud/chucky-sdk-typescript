/**
 * Session
 *
 * Represents a conversation session with the Chucky sandbox.
 * Supports multi-turn conversations, tool execution, and streaming.
 */

import type { SessionOptions } from '../types/options.js';
import type { SessionResult, SessionInfo, SessionState, Message } from '../types/results.js';
import type { ToolDefinition, ToolResult, ToolCall } from '../types/tools.js';
import type { IncomingMessage, InitPayload } from '../types/messages.js';
import {
  createInitMessage,
  createSdkMessage,
  createControlMessage,
  createToolResultMessage,
  isToolCallMessage,
  isControlMessage,
  isResultMessage,
  isErrorMessage,
} from '../types/messages.js';
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
export class Session {
  private transport: Transport;
  private options: SessionOptions;
  private config: SessionConfig;
  private eventHandlers: SessionEventHandlers = {};
  private toolHandlers: Map<string, ToolDefinition['handler']> = new Map();
  private messageBuffer: IncomingMessage[] = [];
  private currentResult: SessionResult | null = null;
  private _state: SessionState = 'idle';
  private _sessionId: string | null = null;
  private messageResolvers: Array<(message: IncomingMessage) => void> = [];

  constructor(transport: Transport, options: SessionOptions, config: SessionConfig = {}) {
    this.transport = transport;
    this.options = options;
    this.config = config;

    // Extract tool handlers from tool definitions
    if (options.tools) {
      for (const tool of options.tools) {
        if (tool.handler) {
          this.toolHandlers.set(tool.name, tool.handler);
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
   * Get the current session state
   */
  get state(): SessionState {
    return this._state;
  }

  /**
   * Get the session ID
   */
  get sessionId(): string | null {
    return this._sessionId;
  }

  /**
   * Set event handlers
   */
  on(handlers: SessionEventHandlers): this {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
    return this;
  }

  /**
   * Connect and initialize the session
   */
  async connect(): Promise<void> {
    this._state = 'initializing';
    await this.transport.connect();

    // Send init message
    const initPayload = this.buildInitPayload();
    await this.transport.send(createInitMessage(initPayload));

    // Wait for ready/session_info
    await this.waitForReady();
    this._state = 'ready';
  }

  /**
   * Send a message and wait for complete response
   */
  async send(message: string): Promise<SessionResult> {
    if (this._state !== 'ready') {
      throw new Error(`Cannot send: session state is ${this._state}`);
    }

    this._state = 'processing';
    this.currentResult = null;

    // Send user message
    await this.transport.send(createSdkMessage({
      type: 'user_message',
      content: message,
    }));

    // Wait for result
    const result = await this.waitForResult();
    this._state = 'ready';
    return result;
  }

  /**
   * Send a message with streaming
   */
  async *sendStream(message: string): AsyncGenerator<StreamingEvent, void, unknown> {
    if (this._state !== 'ready') {
      throw new Error(`Cannot send: session state is ${this._state}`);
    }

    this._state = 'processing';
    this.currentResult = null;

    // Send user message
    await this.transport.send(createSdkMessage({
      type: 'user_message',
      content: message,
    }));

    // Stream messages
    while (this._state === 'processing' || this._state === 'waiting_tool') {
      const msg = await this.waitForNextMessage();

      // Convert to streaming events
      const events = this.messageToStreamingEvents(msg);
      for (const event of events) {
        yield event;
      }

      // Check if complete
      if (isResultMessage(msg)) {
        this.currentResult = msg.payload as SessionResult;
        this._state = 'completed';
        break;
      }

      // Handle tool calls
      if (isToolCallMessage(msg)) {
        this._state = 'waiting_tool';
        await this.handleToolCall(msg.payload);
        this._state = 'processing';
      }
    }

    this._state = 'ready';
  }

  /**
   * Execute a one-shot prompt
   */
  async prompt(message: string): Promise<SessionResult> {
    return this.send(message);
  }

  /**
   * Get the current/last result
   */
  getResult(): SessionResult | null {
    return this.currentResult;
  }

  /**
   * Close the session
   */
  async close(): Promise<void> {
    await this.transport.send(createControlMessage('close'));
    await this.transport.disconnect();
    this._state = 'completed';
  }

  /**
   * Build init payload from options
   */
  private buildInitPayload(): InitPayload {
    const { tools, mcpServers, ...rest } = this.options;

    // Serialize tools (remove handlers)
    const serializedTools = tools?.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      executeIn: tool.executeIn,
    }));

    // Serialize MCP servers
    const serializedMcpServers = mcpServers?.map((server) => ({
      name: server.name,
      version: server.version,
      tools: server.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        executeIn: tool.executeIn,
      })),
    }));

    return {
      ...rest,
      tools: serializedTools,
      mcpServers: serializedMcpServers,
    };
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: IncomingMessage): void {
    this.log('Received:', message.type);

    // Handle control messages
    if (isControlMessage(message)) {
      if (message.payload.action === 'session_info') {
        const info = message.payload.data as unknown as SessionInfo;
        this._sessionId = info.sessionId;
        this.eventHandlers.onSessionInfo?.(info);
      } else if (message.payload.action === 'ready') {
        // Session is ready
      }
    }

    // Handle errors
    if (isErrorMessage(message)) {
      const error = new Error(message.payload.message);
      this.eventHandlers.onError?.(error);
    }

    // Handle tool calls
    if (isToolCallMessage(message)) {
      // Will be handled by stream/send
    }

    // Handle results
    if (isResultMessage(message)) {
      this.currentResult = message.payload as SessionResult;
      this.eventHandlers.onComplete?.(this.currentResult);
    }

    // Notify waiting resolvers
    const resolver = this.messageResolvers.shift();
    if (resolver) {
      resolver(message);
    } else {
      this.messageBuffer.push(message);
    }
  }

  /**
   * Wait for session to be ready
   */
  private async waitForReady(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Session initialization timeout'));
      }, 30000);

      const checkReady = (message: IncomingMessage) => {
        if (isControlMessage(message)) {
          if (message.payload.action === 'ready' || message.payload.action === 'session_info') {
            clearTimeout(timeout);
            resolve();
            return true;
          }
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
   * Wait for result
   */
  private async waitForResult(): Promise<SessionResult> {
    return new Promise<SessionResult>((resolve, reject) => {
      const processMessage = async (message: IncomingMessage) => {
        if (isResultMessage(message)) {
          this.currentResult = message.payload as SessionResult;
          resolve(this.currentResult);
          return true;
        }

        if (isErrorMessage(message)) {
          reject(new Error(message.payload.message));
          return true;
        }

        if (isToolCallMessage(message)) {
          await this.handleToolCall(message.payload);
          return false;
        }

        return false;
      };

      const processLoop = async () => {
        // Process buffered messages
        while (this.messageBuffer.length > 0) {
          const msg = this.messageBuffer.shift()!;
          if (await processMessage(msg)) {
            return;
          }
        }

        // Wait for new messages
        const waitForNext = () => {
          this.messageResolvers.push(async (msg) => {
            if (await processMessage(msg)) {
              return;
            }
            waitForNext();
          });
        };

        waitForNext();
      };

      processLoop();
    });
  }

  /**
   * Wait for next message
   */
  private async waitForNextMessage(): Promise<IncomingMessage> {
    // Check buffer first
    if (this.messageBuffer.length > 0) {
      return this.messageBuffer.shift()!;
    }

    // Wait for new message
    return new Promise<IncomingMessage>((resolve) => {
      this.messageResolvers.push(resolve);
    });
  }

  /**
   * Handle a tool call
   */
  private async handleToolCall(toolCall: ToolCall): Promise<void> {
    const handler = this.toolHandlers.get(toolCall.toolName);

    if (!handler) {
      // No local handler - server will execute it
      this.log('No local handler for tool:', toolCall.toolName);
      return;
    }

    this.log('Executing tool:', toolCall.toolName);
    this.eventHandlers.onToolUse?.(toolCall);

    try {
      const result = await handler(toolCall.input);
      this.eventHandlers.onToolResult?.(toolCall.callId, result);

      // Send result back
      await this.transport.send(createToolResultMessage(toolCall.callId, result));
    } catch (error) {
      const errorResult: ToolResult = {
        content: [{ type: 'text', text: (error as Error).message }],
        isError: true,
      };
      await this.transport.send(createToolResultMessage(toolCall.callId, errorResult));
    }
  }

  /**
   * Convert message to streaming events
   */
  private messageToStreamingEvents(message: IncomingMessage): StreamingEvent[] {
    const events: StreamingEvent[] = [];

    if (message.type === 'sdk_message') {
      const payload = message.payload as Record<string, unknown>;

      // Handle different SDK message types
      if (payload.type === 'assistant_message' || payload.type === 'content_block_delta') {
        const delta = payload.delta as { type: string; text?: string; thinking?: string } | undefined;
        if (delta?.type === 'text_delta' && delta.text) {
          events.push({ type: 'text', text: delta.text });
          this.eventHandlers.onText?.(delta.text);
        } else if (delta?.type === 'thinking_delta' && delta.thinking) {
          events.push({ type: 'thinking', thinking: delta.thinking });
          this.eventHandlers.onThinking?.(delta.thinking);
        }
      }
    }

    if (isToolCallMessage(message)) {
      events.push({
        type: 'tool_use',
        id: message.payload.callId,
        name: message.payload.toolName,
        input: message.payload.input,
      });
    }

    if (isErrorMessage(message)) {
      events.push({
        type: 'error',
        error: new Error(message.payload.message),
      });
    }

    return events;
  }

  /**
   * Log debug messages
   */
  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[ChuckySession]', ...args);
    }
  }
}
