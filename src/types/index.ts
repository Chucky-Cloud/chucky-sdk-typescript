/**
 * Types Index
 *
 * Re-exports all types for convenient importing.
 */

// Options types
export type {
  Model,
  SystemPrompt,
  OutputFormat,
  AgentDefinition,
  BaseOptions,
  SessionOptions,
  PromptOptions,
  ClientOptions,
  ConnectionStatus,
  ClientEventHandlers,
} from './options.js';

// Tool types
export type {
  JsonSchemaType,
  JsonSchemaProperty,
  ToolInputSchema,
  ToolContentType,
  TextContent,
  ImageContent,
  ResourceContent,
  ToolContent,
  ToolResult,
  ToolExecutionLocation,
  ToolHandler,
  ToolDefinition,
  McpServerDefinition,
  ToolCall,
  ToolCallResponse,
} from './tools.js';

// Message types
export type {
  WsEnvelopeType,
  WsEnvelope,
  InitPayload,
  PromptPayload,
  ControlAction,
  ControlPayload,
  ErrorPayload,
  PingPongPayload,
  ToolCallPayload,
  ToolResultPayload,
  ResultPayload,
  SdkMessagePayload,
  InitEnvelope,
  PromptEnvelope,
  SdkMessageEnvelope,
  ControlEnvelope,
  ErrorEnvelope,
  PingEnvelope,
  PongEnvelope,
  ToolCallEnvelope,
  ToolResultEnvelope,
  ResultEnvelope,
  OutgoingMessage,
  IncomingMessage,
  AnyMessage,
} from './messages.js';

// Message helpers
export {
  createInitMessage,
  createPromptMessage,
  createSdkMessage,
  createControlMessage,
  createPingMessage,
  createToolResultMessage,
  isResultMessage,
  isToolCallMessage,
  isControlMessage,
  isErrorMessage,
} from './messages.js';

// Token types
export type {
  BudgetWindow,
  TokenBudget,
  TokenPermissions,
  TokenSdkConfig,
  BudgetTokenPayload,
  CreateTokenOptions,
  DecodedToken,
} from './token.js';

// Result types
export type {
  MessageRole,
  ContentBlockType,
  TextBlock,
  ToolUseBlock,
  ToolResultBlock,
  ThinkingBlock,
  ImageBlock,
  ContentBlock,
  Message,
  Usage,
  CostBreakdown,
  SessionResult,
  PromptResult,
  StreamEvent,
  PartialMessage,
  SessionState,
  SessionInfo,
} from './results.js';
