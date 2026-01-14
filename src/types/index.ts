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
  ToolTextContent,
  ToolImageContent,
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

// SDK Message types (official format)
export type {
  UUID,
  TextContent as SDKTextContent,
  ImageContent as SDKImageContent,
  DocumentContent as SDKDocumentContent,
  TextContent,
  ImageContent,
  DocumentContent,
  ContentBlock,
  ToolUseContent,
  ToolResultContent,
  APIUserMessage,
  APIAssistantMessage,
  SDKUserMessage,
  SDKAssistantMessage,
  SDKResultMessage,
  SDKResultMessageSuccess,
  SDKResultMessageError,
  ResultSubtype,
  SDKSystemMessage,
  SDKSystemMessageInit,
  SDKSystemMessageCompact,
  SystemSubtype,
  SDKPartialAssistantMessage,
  SDKMessage,
  // Transport envelope types
  WsEnvelopeType,
  InitPayload,
  ControlAction,
  ControlPayload,
  ErrorPayload,
  PingPongPayload,
  ToolCallPayload,
  ToolResultPayload,
  InitEnvelope,
  ControlEnvelope,
  ErrorEnvelope,
  PingEnvelope,
  PongEnvelope,
  ToolCallEnvelope,
  ToolResultEnvelope,
  OutgoingMessage,
  IncomingMessage,
  AnyMessage,
} from './messages.js';

// Message helpers
export {
  createInitMessage,
  createUserMessage,
  createControlMessage,
  createPingMessage,
  createToolResultMessage,
  isUserMessage,
  isAssistantMessage,
  isResultMessage,
  isSuccessResult,
  isErrorResult,
  isSystemMessage,
  isStreamEvent,
  isToolCallMessage,
  isControlMessage,
  isErrorMessage,
  getResultText,
  getAssistantText,
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
  ContentBlock as ResultContentBlock,
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
