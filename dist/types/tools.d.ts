/**
 * Tool Definition Types
 *
 * Types for defining tools that can be executed by Claude.
 * Supports both server-side and browser-side execution.
 */
/**
 * JSON Schema property types
 */
export type JsonSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';
/**
 * JSON Schema property definition
 */
export interface JsonSchemaProperty {
    /** Property type */
    type: JsonSchemaType;
    /** Human-readable description */
    description?: string;
    /** Enumeration of allowed values */
    enum?: string[];
    /** Default value */
    default?: unknown;
    /** For arrays: schema of array items */
    items?: JsonSchemaProperty;
    /** For objects: nested properties */
    properties?: Record<string, JsonSchemaProperty>;
    /** For objects: required property names */
    required?: string[];
    /** Minimum value (for numbers) */
    minimum?: number;
    /** Maximum value (for numbers) */
    maximum?: number;
    /** Minimum length (for strings/arrays) */
    minLength?: number;
    /** Maximum length (for strings/arrays) */
    maxLength?: number;
    /** Pattern (for strings) */
    pattern?: string;
}
/**
 * JSON Schema for tool input
 */
export interface ToolInputSchema {
    /** Always 'object' for tool inputs */
    type: 'object';
    /** Property definitions */
    properties: Record<string, JsonSchemaProperty>;
    /** Required property names */
    required?: string[];
    /** Allow additional properties */
    additionalProperties?: boolean;
}
/**
 * Tool content types for results
 */
export type ToolContentType = 'text' | 'image' | 'resource';
/**
 * Text content in tool result (MCP format)
 */
export interface ToolTextContent {
    type: 'text';
    text: string;
}
/**
 * Image content in tool result (MCP format)
 */
export interface ToolImageContent {
    type: 'image';
    /** Base64-encoded image data */
    data: string;
    /** MIME type (e.g., 'image/png') */
    mimeType: string;
}
/**
 * Resource content in tool result
 */
export interface ResourceContent {
    type: 'resource';
    /** Resource URI */
    uri: string;
    /** MIME type */
    mimeType?: string;
    /** Resource text content */
    text?: string;
    /** Resource binary data (base64) */
    blob?: string;
}
/**
 * Union type for all tool content
 */
export type ToolContent = ToolTextContent | ToolImageContent | ResourceContent;
/**
 * Tool execution result
 */
export interface ToolResult {
    /** Result content */
    content: ToolContent[];
    /** Whether this is an error result */
    isError?: boolean;
}
/**
 * Where the tool should be executed
 */
export type ToolExecutionLocation = 'server' | 'browser';
/**
 * Tool handler function type
 */
export type ToolHandler<TInput = Record<string, unknown>> = (input: TInput) => ToolResult | Promise<ToolResult>;
/**
 * Tool definition
 */
export interface ToolDefinition<TInput = Record<string, unknown>> {
    /** Unique tool name */
    name: string;
    /** Human-readable description of what the tool does */
    description: string;
    /** JSON Schema defining the input parameters */
    inputSchema: ToolInputSchema;
    /**
     * Where the tool should be executed
     * @default 'server'
     */
    executeIn?: ToolExecutionLocation;
    /**
     * Handler function (required for browser tools, optional for server tools)
     */
    handler?: ToolHandler<TInput>;
}
/**
 * MCP Server with client-side tools (handlers run in your app)
 * This is our custom format - bridge converts to SDK format
 */
export interface McpClientToolsServer {
    /** Server name */
    name: string;
    /** Server version */
    version?: string;
    /** Tools with handlers that execute client-side */
    tools: ToolDefinition[];
}
/**
 * MCP Stdio server configuration
 */
export interface McpStdioServerConfig {
    /** Server name */
    name: string;
    /** Server type */
    type?: 'stdio';
    /** Command to run */
    command: string;
    /** Command arguments */
    args?: string[];
    /** Environment variables */
    env?: Record<string, string>;
}
/**
 * MCP SSE server configuration
 */
export interface McpSSEServerConfig {
    /** Server name */
    name: string;
    /** Server type */
    type: 'sse';
    /** SSE endpoint URL */
    url: string;
    /** Request headers */
    headers?: Record<string, string>;
}
/**
 * MCP HTTP server configuration
 */
export interface McpHttpServerConfig {
    /** Server name */
    name: string;
    /** Server type */
    type: 'http';
    /** HTTP endpoint URL */
    url: string;
    /** Request headers */
    headers?: Record<string, string>;
}
/**
 * MCP Server definition - all supported server types
 * Array format - bridge converts to Record<string, config> for official SDK
 */
export type McpServerDefinition = McpClientToolsServer | McpStdioServerConfig | McpSSEServerConfig | McpHttpServerConfig;
/**
 * Type guard for client-side tools server
 */
export declare function isClientToolsServer(server: McpServerDefinition): server is McpClientToolsServer;
/**
 * Type guard for stdio server
 */
export declare function isStdioServer(server: McpServerDefinition): server is McpStdioServerConfig;
/**
 * Type guard for SSE server
 */
export declare function isSSEServer(server: McpServerDefinition): server is McpSSEServerConfig;
/**
 * Type guard for HTTP server
 */
export declare function isHttpServer(server: McpServerDefinition): server is McpHttpServerConfig;
/**
 * Tool preset configuration
 */
export interface ToolPreset {
    type: 'preset';
    preset: 'claude_code';
}
/**
 * Tools configuration - either allowlist of names or preset
 */
export type ToolsConfig = string[] | ToolPreset;
/**
 * Tool call from the model
 */
export interface ToolCall {
    /** Unique call ID */
    callId: string;
    /** Tool name */
    toolName: string;
    /** Input arguments */
    input: Record<string, unknown>;
}
/**
 * Tool call response
 */
export interface ToolCallResponse {
    /** Call ID (must match the tool call) */
    callId: string;
    /** Tool execution result */
    result: ToolResult;
}
//# sourceMappingURL=tools.d.ts.map