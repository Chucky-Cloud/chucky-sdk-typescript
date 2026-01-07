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
// Client (V2 Interface)
// ============================================================================
export { ChuckyClient, createClient, getAssistantText, getResultText } from './client/index.js';
export { Session } from './client/index.js';
// ============================================================================
// Tools
// ============================================================================
export { createTool, tool, browserTool, serverTool, textResult, errorResult, imageResult, McpServerBuilder, createMcpServer, mcpServer, } from './tools/index.js';
// ============================================================================
// Utils
// ============================================================================
export { createToken, decodeToken, verifyToken, isTokenExpired, extractProjectId, createBudget, } from './utils/index.js';
export { ChuckyError, ConnectionError, AuthenticationError, BudgetExceededError, ConcurrencyLimitError, RateLimitError, SessionError, ToolExecutionError, TimeoutError, ValidationError, createError, } from './utils/index.js';
// ============================================================================
// Transport (advanced usage)
// ============================================================================
export { WebSocketTransport } from './transport/index.js';
// Message helpers
export { createInitMessage, createUserMessage, createControlMessage, createPingMessage, createToolResultMessage, isUserMessage, isAssistantMessage, isResultMessage, isSuccessResult, isErrorResult, isSystemMessage, isStreamEvent, isToolCallMessage, isControlMessage, isErrorMessage, } from './types/index.js';
//# sourceMappingURL=index.js.map