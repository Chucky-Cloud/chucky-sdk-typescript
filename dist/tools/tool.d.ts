/**
 * Tool Helper
 *
 * Helper functions for defining tools with type safety.
 * Supports both JSON Schema and Zod for input validation.
 */
import type { ToolDefinition, ToolInputSchema, ToolHandler, ToolResult, ToolExecutionLocation } from '../types/tools.js';
/**
 * Options for creating a tool
 */
export interface CreateToolOptions<TInput = Record<string, unknown>> {
    /** Tool name (must be unique) */
    name: string;
    /** Human-readable description */
    description: string;
    /** Input schema (JSON Schema or Zod schema) */
    inputSchema: ToolInputSchema | ZodLikeSchema;
    /** Where to execute the tool */
    executeIn?: ToolExecutionLocation;
    /** Handler function */
    handler?: ToolHandler<TInput>;
}
/**
 * Zod-like schema interface for compatibility
 */
interface ZodLikeSchema {
    _def?: unknown;
    shape?: unknown;
    safeParse?: (data: unknown) => {
        success: boolean;
        data?: unknown;
        error?: unknown;
    };
}
/**
 * Create a tool definition
 *
 * @param options - Tool configuration
 * @returns Tool definition ready to use
 *
 * @example
 * ```typescript
 * // With JSON Schema
 * const weatherTool = createTool({
 *   name: 'get_weather',
 *   description: 'Get current weather for a city',
 *   inputSchema: {
 *     type: 'object',
 *     properties: {
 *       city: { type: 'string', description: 'City name' },
 *       unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
 *     },
 *     required: ['city'],
 *   },
 *   handler: async ({ city, unit }) => ({
 *     content: [{ type: 'text', text: `Weather in ${city}: Sunny, 72°${unit === 'celsius' ? 'C' : 'F'}` }],
 *   }),
 * });
 *
 * // With Zod (optional peer dependency)
 * import { z } from 'zod';
 *
 * const calculatorTool = createTool({
 *   name: 'calculate',
 *   description: 'Perform a calculation',
 *   inputSchema: z.object({
 *     expression: z.string().describe('Math expression to evaluate'),
 *   }),
 *   handler: async ({ expression }) => ({
 *     content: [{ type: 'text', text: `Result: ${eval(expression)}` }],
 *   }),
 * });
 * ```
 */
export declare function createTool<TInput = Record<string, unknown>>(options: CreateToolOptions<TInput>): ToolDefinition<TInput>;
/**
 * Shorthand for creating a tool
 *
 * @param name - Tool name
 * @param description - Tool description
 * @param inputSchema - Input schema
 * @param handler - Handler function
 * @returns Tool definition
 *
 * @example
 * ```typescript
 * const greetTool = tool(
 *   'greet',
 *   'Greet a person by name',
 *   {
 *     type: 'object',
 *     properties: { name: { type: 'string' } },
 *     required: ['name'],
 *   },
 *   async ({ name }) => ({
 *     content: [{ type: 'text', text: `Hello, ${name}!` }],
 *   })
 * );
 * ```
 */
export declare function tool<TInput = Record<string, unknown>>(name: string, description: string, inputSchema: ToolInputSchema | ZodLikeSchema, handler?: ToolHandler<TInput>): ToolDefinition<TInput>;
/**
 * Create a browser-executed tool
 *
 * @param options - Tool configuration
 * @returns Tool definition that executes in the browser
 *
 * @example
 * ```typescript
 * const alertTool = browserTool({
 *   name: 'show_alert',
 *   description: 'Show an alert dialog',
 *   inputSchema: {
 *     type: 'object',
 *     properties: { message: { type: 'string' } },
 *     required: ['message'],
 *   },
 *   handler: async ({ message }) => {
 *     alert(message);
 *     return { content: [{ type: 'text', text: 'Alert shown' }] };
 *   },
 * });
 * ```
 */
export declare function browserTool<TInput = Record<string, unknown>>(options: Omit<CreateToolOptions<TInput>, 'executeIn'>): ToolDefinition<TInput>;
/**
 * Create a server-executed tool
 *
 * @param options - Tool configuration (handler is optional for server tools)
 * @returns Tool definition that executes on the server
 */
export declare function serverTool<TInput = Record<string, unknown>>(options: Omit<CreateToolOptions<TInput>, 'executeIn' | 'handler'>): ToolDefinition<TInput>;
/**
 * Helper to create text content for tool results
 */
export declare function textResult(text: string): ToolResult;
/**
 * Helper to create error result for tools
 */
export declare function errorResult(message: string): ToolResult;
/**
 * Helper to create image content for tool results
 */
export declare function imageResult(data: string, mimeType: string): ToolResult;
export {};
//# sourceMappingURL=tool.d.ts.map