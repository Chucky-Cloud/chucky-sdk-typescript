/**
 * WebSocket Message Types
 *
 * Matches the official Claude Agent SDK message format.
 * See: https://platform.claude.com/docs/en/agent-sdk/typescript
 */
import type { ToolCall, ToolResult } from './tools.js';
import type { SessionOptions } from './options.js';
export type UUID = string;
/**
 * Anthropic API message content types
 */
export type TextContent = {
    type: 'text';
    text: string;
};
export type ImageContent = {
    type: 'image';
    source: {
        type: 'base64';
        media_type: string;
        data: string;
    };
};
export type ToolUseContent = {
    type: 'tool_use';
    id: string;
    name: string;
    input: Record<string, unknown>;
};
export type ToolResultContent = {
    type: 'tool_result';
    tool_use_id: string;
    content: string | Array<TextContent | ImageContent>;
    is_error?: boolean;
};
export type ContentBlock = TextContent | ImageContent | ToolUseContent | ToolResultContent;
/**
 * Anthropic API User Message
 */
export interface APIUserMessage {
    role: 'user';
    content: string | ContentBlock[];
}
/**
 * Anthropic API Assistant Message
 */
export interface APIAssistantMessage {
    role: 'assistant';
    content: ContentBlock[];
}
/**
 * User message - sent by the client
 */
export interface SDKUserMessage {
    type: 'user';
    uuid?: UUID;
    session_id: string;
    message: APIUserMessage;
    parent_tool_use_id: string | null;
}
/**
 * Assistant message - response from Claude
 */
export interface SDKAssistantMessage {
    type: 'assistant';
    uuid: UUID;
    session_id: string;
    message: APIAssistantMessage;
    parent_tool_use_id: string | null;
}
/**
 * Result message subtypes
 */
export type ResultSubtype = 'success' | 'error_max_turns' | 'error_during_execution' | 'error_max_budget_usd' | 'error_max_structured_output_retries';
/**
 * Success result message
 */
export interface SDKResultMessageSuccess {
    type: 'result';
    subtype: 'success';
    uuid: UUID;
    session_id: string;
    duration_ms: number;
    duration_api_ms: number;
    is_error: boolean;
    num_turns: number;
    result: string;
    total_cost_usd: number;
    usage: {
        input_tokens: number;
        output_tokens: number;
        cache_creation_input_tokens: number;
        cache_read_input_tokens: number;
    };
    structured_output?: unknown;
}
/**
 * Error result message
 */
export interface SDKResultMessageError {
    type: 'result';
    subtype: Exclude<ResultSubtype, 'success'>;
    uuid: UUID;
    session_id: string;
    duration_ms: number;
    duration_api_ms: number;
    is_error: boolean;
    num_turns: number;
    total_cost_usd: number;
    usage: {
        input_tokens: number;
        output_tokens: number;
        cache_creation_input_tokens: number;
        cache_read_input_tokens: number;
    };
    errors: string[];
}
export type SDKResultMessage = SDKResultMessageSuccess | SDKResultMessageError;
/**
 * System message subtypes
 */
export type SystemSubtype = 'init' | 'compact_boundary';
/**
 * System init message
 */
export interface SDKSystemMessageInit {
    type: 'system';
    subtype: 'init';
    uuid: UUID;
    session_id: string;
    cwd: string;
    tools: string[];
    mcp_servers: Array<{
        name: string;
        status: string;
    }>;
    model: string;
    permissionMode: string;
}
/**
 * System compact boundary message
 */
export interface SDKSystemMessageCompact {
    type: 'system';
    subtype: 'compact_boundary';
    uuid: UUID;
    session_id: string;
    compact_metadata: {
        trigger: 'manual' | 'auto';
        pre_tokens: number;
    };
}
export type SDKSystemMessage = SDKSystemMessageInit | SDKSystemMessageCompact;
/**
 * Partial assistant message (streaming)
 */
export interface SDKPartialAssistantMessage {
    type: 'stream_event';
    event: unknown;
    parent_tool_use_id: string | null;
    uuid: UUID;
    session_id: string;
}
/**
 * All SDK message types (matching official SDK)
 */
export type SDKMessage = SDKUserMessage | SDKAssistantMessage | SDKResultMessage | SDKSystemMessage | SDKPartialAssistantMessage;
/**
 * WebSocket envelope types for our transport
 */
export type WsEnvelopeType = 'init' | 'user' | 'assistant' | 'result' | 'system' | 'stream_event' | 'control' | 'error' | 'ping' | 'pong' | 'tool_call' | 'tool_result';
/**
 * Init message payload (session initialization)
 */
export interface InitPayload extends Omit<SessionOptions, 'mcpServers'> {
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
    action: ControlAction;
    data?: Record<string, unknown>;
}
/**
 * Error message payload
 */
export interface ErrorPayload {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
}
/**
 * Ping/Pong payload
 */
export interface PingPongPayload {
    timestamp: number;
}
/**
 * Tool call payload (server -> client)
 */
export interface ToolCallPayload extends ToolCall {
}
/**
 * Tool result payload (client -> server)
 */
export interface ToolResultPayload {
    callId: string;
    result: ToolResult;
}
export interface InitEnvelope {
    type: 'init';
    payload: InitPayload;
}
export interface ControlEnvelope {
    type: 'control';
    payload: ControlPayload;
}
export interface ErrorEnvelope {
    type: 'error';
    payload: ErrorPayload;
}
export interface PingEnvelope {
    type: 'ping';
    payload: PingPongPayload;
}
export interface PongEnvelope {
    type: 'pong';
    payload: PingPongPayload;
}
export interface ToolCallEnvelope {
    type: 'tool_call';
    payload: ToolCallPayload;
}
export interface ToolResultEnvelope {
    type: 'tool_result';
    payload: ToolResultPayload;
}
/**
 * Outgoing messages (client -> server)
 */
export type OutgoingMessage = InitEnvelope | SDKUserMessage | ControlEnvelope | PingEnvelope | ToolResultEnvelope;
/**
 * Incoming messages (server -> client)
 */
export type IncomingMessage = SDKAssistantMessage | SDKResultMessage | SDKSystemMessage | SDKPartialAssistantMessage | ControlEnvelope | ErrorEnvelope | PongEnvelope | ToolCallEnvelope;
/**
 * All messages
 */
export type AnyMessage = OutgoingMessage | IncomingMessage;
/**
 * Create an init message
 */
export declare function createInitMessage(payload: InitPayload): InitEnvelope;
/**
 * Create a user message (official SDK format)
 */
export declare function createUserMessage(content: string | ContentBlock[], sessionId: string, options?: {
    uuid?: UUID;
    parentToolUseId?: string | null;
}): SDKUserMessage;
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
 * Check if message is a user message
 */
export declare function isUserMessage(message: AnyMessage): message is SDKUserMessage;
/**
 * Check if message is an assistant message
 */
export declare function isAssistantMessage(message: AnyMessage): message is SDKAssistantMessage;
/**
 * Check if message is a result message
 */
export declare function isResultMessage(message: AnyMessage): message is SDKResultMessage;
/**
 * Check if message is a success result
 */
export declare function isSuccessResult(message: AnyMessage): message is SDKResultMessageSuccess;
/**
 * Check if message is an error result
 */
export declare function isErrorResult(message: AnyMessage): message is SDKResultMessageError;
/**
 * Check if message is a system message
 */
export declare function isSystemMessage(message: AnyMessage): message is SDKSystemMessage;
/**
 * Check if message is a stream event
 */
export declare function isStreamEvent(message: AnyMessage): message is SDKPartialAssistantMessage;
/**
 * Check if message is a tool call
 */
export declare function isToolCallMessage(message: AnyMessage): message is ToolCallEnvelope;
/**
 * Check if message is a control message
 */
export declare function isControlMessage(message: AnyMessage): message is ControlEnvelope;
/**
 * Check if message is an error message
 */
export declare function isErrorMessage(message: AnyMessage): message is ErrorEnvelope;
/**
 * Extract text from result message
 */
export declare function getResultText(message: SDKResultMessage): string | null;
/**
 * Extract text from assistant message content
 */
export declare function getAssistantText(message: SDKAssistantMessage): string;
//# sourceMappingURL=messages.d.ts.map