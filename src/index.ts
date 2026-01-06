/**
 * @chucky.cloud/sdk
 *
 * SDK for interacting with Chucky sandbox - supports both browser and Node.js.
 *
 * @example
 * ```typescript
 * import { ChuckyClient, tool, createBudget, createToken } from '@chucky.cloud/sdk';
 *
 * // Server-side: Create a token for your user
 * const token = await createToken({
 *   userId: 'user-123',
 *   projectId: 'your-project-uuid',
 *   secret: 'your-hmac-secret',
 *   budget: createBudget({
 *     aiDollars: 1.00,
 *     computeHours: 1,
 *     window: 'day',
 *   }),
 * });
 *
 * // Create client with the token
 * const client = new ChuckyClient({ token });
 *
 * // Create a session with tools
 * const session = await client.createSession({
 *   model: 'claude-sonnet-4-5-20250929',
 *   tools: [
 *     tool('greet', 'Greet someone', {
 *       type: 'object',
 *       properties: { name: { type: 'string' } },
 *       required: ['name'],
 *     }, async ({ name }) => ({
 *       content: [{ type: 'text', text: `Hello, ${name}!` }],
 *     })),
 *   ],
 * });
 *
 * // Send a message
 * const result = await session.send('Greet the world!');
 * console.log(result.text);
 *
 * // Or stream the response
 * for await (const event of session.sendStream('Tell me a story')) {
 *   if (event.type === 'text') {
 *     process.stdout.write(event.text);
 *   }
 * }
 * ```
 *
 * @packageDocumentation
 */

// ============================================================================
// Client
// ============================================================================

export { ChuckyClient, createClient } from './client/index.js';
export type {
  StreamingEvent,
  StreamingTextEvent,
  StreamingToolUseEvent,
  StreamingToolResultEvent,
  StreamingThinkingEvent,
  StreamingErrorEvent,
} from './client/index.js';

export { Session } from './client/index.js';
export type { SessionEventHandlers } from './client/index.js';

// ============================================================================
// Tools
// ============================================================================

export {
  createTool,
  tool,
  browserTool,
  serverTool,
  textResult,
  errorResult,
  imageResult,
  McpServerBuilder,
  createMcpServer,
  mcpServer,
} from './tools/index.js';
export type { CreateToolOptions } from './tools/index.js';

// ============================================================================
// Utils
// ============================================================================

export {
  createToken,
  decodeToken,
  verifyToken,
  isTokenExpired,
  extractProjectId,
  createBudget,
} from './utils/index.js';

export {
  ChuckyError,
  ConnectionError,
  AuthenticationError,
  BudgetExceededError,
  ConcurrencyLimitError,
  RateLimitError,
  SessionError,
  ToolExecutionError,
  TimeoutError,
  ValidationError,
  createError,
} from './utils/index.js';

// ============================================================================
// Transport (advanced usage)
// ============================================================================

export { WebSocketTransport } from './transport/index.js';
export type { Transport, TransportConfig, TransportEvents } from './transport/index.js';

// ============================================================================
// Types
// ============================================================================

// Options
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
} from './types/index.js';

// Tools
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
} from './types/index.js';

// Messages
export type {
  WsEnvelopeType,
  WsEnvelope,
  InitPayload,
  PromptPayload,
  ControlAction,
  ControlPayload,
  ErrorPayload,
  OutgoingMessage,
  IncomingMessage,
} from './types/index.js';

// Token
export type {
  BudgetWindow,
  TokenBudget,
  TokenPermissions,
  TokenSdkConfig,
  BudgetTokenPayload,
  CreateTokenOptions,
  DecodedToken,
} from './types/index.js';

// Results
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
} from './types/index.js';

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
} from './types/index.js';
