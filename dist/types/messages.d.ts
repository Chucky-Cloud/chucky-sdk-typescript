/**
 * WebSocket Message Types
 *
 * Defines the envelope format and message types for communication
 * between the SDK client and the Chucky server.
 */
import type { ToolCall, ToolResult } from './tools.js';
import type { SessionOptions, PromptOptions } from './options.js';
/**
 * WebSocket envelope types
 */
export type WsEnvelopeType = 'init' | 'prompt' | 'sdk_message' | 'control' | 'error' | 'ping' | 'pong' | 'tool_call' | 'tool_result' | 'result';
/**
 * Base envelope structure
 */
export interface WsEnvelope<T = unknown> {
    /** Message type */
    type: WsEnvelopeType;
    /** Message payload */
    payload: T;
}
/**
 * Init message payload (session initialization)
 */
export interface InitPayload extends Omit<SessionOptions, 'tools' | 'mcpServers'> {
    /** Serialized tool definitions */
    tools?: unknown[];
    /** Serialized MCP server definitions */
    mcpServers?: unknown[];
}
/**
 * Prompt message payload (one-shot prompt)
 */
export interface PromptPayload extends Omit<PromptOptions, 'tools' | 'mcpServers'> {
    /** Serialized tool definitions */
    tools?: unknown[];
    /** Serialized MCP server definitions */
    mcpServers?: unknown[];
}
/**
 * Control message actions
 */
export type ControlAction = 'ready' | 'session_info' | 'end_input' | 'close';
/**
 * Control message payload
 */
export interface ControlPayload {
    /** Control action */
    action: ControlAction;
    /** Additional data */
    data?: Record<string, unknown>;
}
/**
 * Error message payload
 */
export interface ErrorPayload {
    /** Error message */
    message: string;
    /** Error code */
    code?: string;
    /** Additional error details */
    details?: Record<string, unknown>;
}
/**
 * Ping/Pong message payload
 */
export interface PingPongPayload {
    /** Timestamp */
    timestamp: number;
}
/**
 * Tool call message payload
 */
export interface ToolCallPayload extends ToolCall {
}
/**
 * Tool result message payload
 */
export interface ToolResultPayload {
    /** Call ID */
    callId: string;
    /** Tool result */
    result: ToolResult;
}
/**
 * Result message payload (final response)
 */
export interface ResultPayload {
    /** Result type */
    type: 'result';
    /** Result subtype */
    subtype?: string;
    /** Response text */
    text?: string;
    /** Total cost in USD */
    total_cost_usd?: number;
    /** Duration in seconds */
    duration_secs?: number;
    /** Number of turns */
    turn_count?: number;
    /** Additional result data */
    [key: string]: unknown;
}
/**
 * SDK message payload (native Claude Agent SDK messages)
 */
export interface SdkMessagePayload {
    /** Message type from SDK */
    type: string;
    /** Message data */
    [key: string]: unknown;
}
export interface InitEnvelope extends WsEnvelope<InitPayload> {
    type: 'init';
}
export interface PromptEnvelope extends WsEnvelope<PromptPayload> {
    type: 'prompt';
}
export interface SdkMessageEnvelope extends WsEnvelope<SdkMessagePayload> {
    type: 'sdk_message';
}
export interface ControlEnvelope extends WsEnvelope<ControlPayload> {
    type: 'control';
}
export interface ErrorEnvelope extends WsEnvelope<ErrorPayload> {
    type: 'error';
}
export interface PingEnvelope extends WsEnvelope<PingPongPayload> {
    type: 'ping';
}
export interface PongEnvelope extends WsEnvelope<PingPongPayload> {
    type: 'pong';
}
export interface ToolCallEnvelope extends WsEnvelope<ToolCallPayload> {
    type: 'tool_call';
}
export interface ToolResultEnvelope extends WsEnvelope<ToolResultPayload> {
    type: 'tool_result';
}
export interface ResultEnvelope extends WsEnvelope<ResultPayload> {
    type: 'result';
}
/**
 * Union type for all outgoing messages (client -> server)
 */
export type OutgoingMessage = InitEnvelope | PromptEnvelope | SdkMessageEnvelope | ControlEnvelope | PingEnvelope | ToolResultEnvelope;
/**
 * Union type for all incoming messages (server -> client)
 */
export type IncomingMessage = SdkMessageEnvelope | ControlEnvelope | ErrorEnvelope | PongEnvelope | ToolCallEnvelope | ResultEnvelope;
/**
 * Union type for all messages
 */
export type AnyMessage = OutgoingMessage | IncomingMessage;
/**
 * Create an init message
 */
export declare function createInitMessage(payload: InitPayload): InitEnvelope;
/**
 * Create a prompt message
 */
export declare function createPromptMessage(payload: PromptPayload): PromptEnvelope;
/**
 * Create an SDK message
 */
export declare function createSdkMessage(payload: SdkMessagePayload): SdkMessageEnvelope;
/**
 * Create a control message
 */
export declare function createControlMessage(action: ControlAction, data?: Record<string, unknown>): ControlEnvelope;
/**
 * Create a ping message
 */
export declare function createPingMessage(): PingEnvelope;
/**
 * Create a tool result message
 */
export declare function createToolResultMessage(callId: string, result: ToolResult): ToolResultEnvelope;
/**
 * Check if a message is a result message
 */
export declare function isResultMessage(message: AnyMessage): message is ResultEnvelope;
/**
 * Check if a message is a tool call message
 */
export declare function isToolCallMessage(message: AnyMessage): message is ToolCallEnvelope;
/**
 * Check if a message is a control message
 */
export declare function isControlMessage(message: AnyMessage): message is ControlEnvelope;
/**
 * Check if a message is an error message
 */
export declare function isErrorMessage(message: AnyMessage): message is ErrorEnvelope;
//# sourceMappingURL=messages.d.ts.map