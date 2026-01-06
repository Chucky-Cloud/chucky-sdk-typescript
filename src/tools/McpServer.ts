/**
 * MCP Server Builder
 *
 * Builder pattern for creating MCP server definitions with multiple tools.
 */

import type { ToolDefinition, McpServerDefinition } from '../types/tools.js';
import type { CreateToolOptions } from './tool.js';
import { createTool } from './tool.js';

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
export class McpServerBuilder {
  private name: string;
  private version: string;
  private tools: ToolDefinition[] = [];

  /**
   * Create a new MCP server builder
   *
   * @param name - Server name
   * @param version - Server version (default: '1.0.0')
   */
  constructor(name: string, version: string = '1.0.0') {
    this.name = name;
    this.version = version;
  }

  /**
   * Add a tool to the server
   *
   * @param options - Tool configuration
   * @returns This builder for chaining
   */
  addTool<TInput = Record<string, unknown>>(
    options: CreateToolOptions<TInput>
  ): this {
    this.tools.push(createTool(options) as ToolDefinition);
    return this;
  }

  /**
   * Add an existing tool definition
   *
   * @param tool - Tool definition
   * @returns This builder for chaining
   */
  add(tool: ToolDefinition): this {
    this.tools.push(tool);
    return this;
  }

  /**
   * Add multiple tools at once
   *
   * @param tools - Array of tool definitions
   * @returns This builder for chaining
   */
  addTools(tools: ToolDefinition[]): this {
    this.tools.push(...tools);
    return this;
  }

  /**
   * Build the MCP server definition
   *
   * @returns Complete MCP server definition
   */
  build(): McpServerDefinition {
    return {
      name: this.name,
      version: this.version,
      tools: this.tools,
    };
  }
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
export function createMcpServer(
  name: string,
  tools: ToolDefinition[],
  version: string = '1.0.0'
): McpServerDefinition {
  return {
    name,
    version,
    tools,
  };
}

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
export function mcpServer(name: string, version?: string): McpServerBuilder {
  return new McpServerBuilder(name, version);
}
