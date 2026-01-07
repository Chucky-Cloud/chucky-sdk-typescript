/**
 * WebSocket Message Types
 *
 * Matches the official Claude Agent SDK message format.
 * See: https://platform.claude.com/docs/en/agent-sdk/typescript
 */

import type { ToolCall, ToolResult } from './tools.js';
import type { SessionOptions } from './options.js';

// ============================================================================
// Core Types (matching official SDK)
// ============================================================================

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

// ============================================================================
// SDK Message Types (matching official SDK)
// ============================================================================

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
export type ResultSubtype =
  | 'success'
  | 'error_max_turns'
  | 'error_during_execution'
  | 'error_max_budget_usd'
  | 'error_max_structured_output_retries';

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
  event: unknown; // RawMessageStreamEvent from Anthropic SDK
  parent_tool_use_id: string | null;
  uuid: UUID;
  session_id: string;
}

// ============================================================================
// Union Types
// ============================================================================

/**
 * All SDK message types (matching official SDK)
 */
export type SDKMessage =
  | SDKUserMessage
  | SDKAssistantMessage
  | SDKResultMessage
  | SDKSystemMessage
  | SDKPartialAssistantMessage;

// ============================================================================
// WebSocket Envelope Types (for our transport layer)
// ============================================================================

/**
 * WebSocket envelope types for our transport
 */
export type WsEnvelopeType =
  | 'init'           // Session initialization
  | 'user'           // User message (matches SDK)
  | 'assistant'      // Assistant message (matches SDK)
  | 'result'         // Result message (matches SDK)
  | 'system'         // System message (matches SDK)
  | 'stream_event'   // Partial message (matches SDK)
  | 'control'        // Control messages (ready, close, etc.)
  | 'error'          // Error message
  | 'ping'           // Keep-alive ping
  | 'pong'           // Keep-alive pong
  | 'tool_call'      // Tool call from server
  | 'tool_result';   // Tool result from client

/**
 * Init message payload (session initialization)
 */
export interface InitPayload extends Omit<SessionOptions, 'mcpServers'> {
  // tools is passed through as-is (string[] for allowlist or preset)
  mcpServers?: unknown[];
}

/**
 * Control message actions
 */
export type ControlAction =
  | 'ready'
  | 'session_info'
  | 'end_input'
  | 'close';

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
export interface ToolCallPayload extends ToolCall {}

/**
 * Tool result payload (client -> server)
 */
export interface ToolResultPayload {
  callId: string;
  result: ToolResult;
}

// ============================================================================
// Envelope Interfaces
// ============================================================================

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
export type OutgoingMessage =
  | InitEnvelope
  | SDKUserMessage
  | ControlEnvelope
  | PingEnvelope
  | ToolResultEnvelope;

/**
 * Incoming messages (server -> client)
 */
export type IncomingMessage =
  | SDKAssistantMessage
  | SDKResultMessage
  | SDKSystemMessage
  | SDKPartialAssistantMessage
  | ControlEnvelope
  | ErrorEnvelope
  | PongEnvelope
  | ToolCallEnvelope;

/**
 * All messages
 */
export type AnyMessage = OutgoingMessage | IncomingMessage;

// ============================================================================
// Message Helpers
// ============================================================================

/**
 * Create an init message
 */
export function createInitMessage(payload: InitPayload): InitEnvelope {
  return { type: 'init', payload };
}

/**
 * Create a user message (official SDK format)
 */
export function createUserMessage(
  content: string | ContentBlock[],
  sessionId: string,
  options: {
    uuid?: UUID;
    parentToolUseId?: string | null;
  } = {}
): SDKUserMessage {
  const messageContent = typeof content === 'string'
    ? content
    : content;

  return {
    type: 'user',
    uuid: options.uuid,
    session_id: sessionId,
    message: {
      role: 'user',
      content: messageContent,
    },
    parent_tool_use_id: options.parentToolUseId ?? null,
  };
}

/**
 * Create a control message
 */
export function createControlMessage(
  action: ControlAction,
  data?: Record<string, unknown>
): ControlEnvelope {
  return { type: 'control', payload: { action, data } };
}

/**
 * Create a ping message
 */
export function createPingMessage(): PingEnvelope {
  return { type: 'ping', payload: { timestamp: Date.now() } };
}

/**
 * Create a tool result message
 */
export function createToolResultMessage(
  callId: string,
  result: ToolResult
): ToolResultEnvelope {
  return { type: 'tool_result', payload: { callId, result } };
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if message is a user message
 */
export function isUserMessage(message: AnyMessage): message is SDKUserMessage {
  return message.type === 'user';
}

/**
 * Check if message is an assistant message
 */
export function isAssistantMessage(message: AnyMessage): message is SDKAssistantMessage {
  return message.type === 'assistant';
}

/**
 * Check if message is a result message
 */
export function isResultMessage(message: AnyMessage): message is SDKResultMessage {
  return message.type === 'result';
}

/**
 * Check if message is a success result
 */
export function isSuccessResult(message: AnyMessage): message is SDKResultMessageSuccess {
  return message.type === 'result' && (message as SDKResultMessage).subtype === 'success';
}

/**
 * Check if message is an error result
 */
export function isErrorResult(message: AnyMessage): message is SDKResultMessageError {
  return message.type === 'result' && (message as SDKResultMessage).subtype !== 'success';
}

/**
 * Check if message is a system message
 */
export function isSystemMessage(message: AnyMessage): message is SDKSystemMessage {
  return message.type === 'system';
}

/**
 * Check if message is a stream event
 */
export function isStreamEvent(message: AnyMessage): message is SDKPartialAssistantMessage {
  return message.type === 'stream_event';
}

/**
 * Check if message is a tool call
 */
export function isToolCallMessage(message: AnyMessage): message is ToolCallEnvelope {
  return message.type === 'tool_call';
}

/**
 * Check if message is a control message
 */
export function isControlMessage(message: AnyMessage): message is ControlEnvelope {
  return message.type === 'control';
}

/**
 * Check if message is an error message
 */
export function isErrorMessage(message: AnyMessage): message is ErrorEnvelope {
  return message.type === 'error';
}

/**
 * Extract text from result message
 */
export function getResultText(message: SDKResultMessage): string | null {
  if (message.subtype === 'success') {
    return message.result;
  }
  return null;
}

/**
 * Extract text from assistant message content
 */
export function getAssistantText(message: SDKAssistantMessage): string {
  return message.message.content
    .filter((block): block is TextContent => block.type === 'text')
    .map(block => block.text)
    .join('');
}
