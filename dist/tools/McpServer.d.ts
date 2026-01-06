/**
 * MCP Server Builder
 *
 * Builder pattern for creating MCP server definitions with multiple tools.
 */
import type { ToolDefinition, McpServerDefinition } from '../types/tools.js';
import type { CreateToolOptions } from './tool.js';
/**
 * MCP Server builder for creating server definitions
 *
 * @example
 * ```typescript
 * const myServer = new McpServerBuilder('my-tools', '1.0.0')
 *   .addTool({
 *     name: 'greet',
 *     description: 'Greet someone',
 *     inputSchema: {
 *       type: 'object',
 *       properties: { name: { type: 'string' } },
 *       required: ['name'],
 *     },
 *     handler: async ({ name }) => ({
 *       content: [{ type: 'text', text: `Hello, ${name}!` }],
 *     }),
 *   })
 *   .addTool({
 *     name: 'farewell',
 *     description: 'Say goodbye',
 *     inputSchema: {
 *       type: 'object',
 *       properties: { name: { type: 'string' } },
 *       required: ['name'],
 *     },
 *     handler: async ({ name }) => ({
 *       content: [{ type: 'text', text: `Goodbye, ${name}!` }],
 *     }),
 *   })
 *   .build();
 * ```
 */
export declare class McpServerBuilder {
    private name;
    private version;
    private tools;
    /**
     * Create a new MCP server builder
     *
     * @param name - Server name
     * @param version - Server version (default: '1.0.0')
     */
    constructor(name: string, version?: string);
    /**
     * Add a tool to the server
     *
     * @param options - Tool configuration
     * @returns This builder for chaining
     */
    addTool<TInput = Record<string, unknown>>(options: CreateToolOptions<TInput>): this;
    /**
     * Add an existing tool definition
     *
     * @param tool - Tool definition
     * @returns This builder for chaining
     */
    add(tool: ToolDefinition): this;
    /**
     * Add multiple tools at once
     *
     * @param tools - Array of tool definitions
     * @returns This builder for chaining
     */
    addTools(tools: ToolDefinition[]): this;
    /**
     * Build the MCP server definition
     *
     * @returns Complete MCP server definition
     */
    build(): McpServerDefinition;
}
/**
 * Create an MCP server definition
 *
 * @param name - Server name
 * @param tools - Array of tool definitions
 * @param version - Server version
 * @returns MCP server definition
 *
 * @example
 * ```typescript
 * const server = createMcpServer('my-server', [
 *   tool('greet', 'Greet someone', { type: 'object', properties: { name: { type: 'string' } } }),
 *   tool('farewell', 'Say goodbye', { type: 'object', properties: { name: { type: 'string' } } }),
 * ]);
 * ```
 */
export declare function createMcpServer(name: string, tools: ToolDefinition[], version?: string): McpServerDefinition;
/**
 * Create an MCP server using the builder pattern
 *
 * @param name - Server name
 * @param version - Server version
 * @returns MCP server builder
 *
 * @example
 * ```typescript
 * const server = mcpServer('my-tools')
 *   .addTool({
 *     name: 'hello',
 *     description: 'Say hello',
 *     inputSchema: { type: 'object', properties: {} },
 *     handler: async () => ({ content: [{ type: 'text', text: 'Hello!' }] }),
 *   })
 *   .build();
 * ```
 */
export declare function mcpServer(name: string, version?: string): McpServerBuilder;
//# sourceMappingURL=McpServer.d.ts.map