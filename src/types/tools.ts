/**
 * Tool Definition Types
 *
 * Types for defining tools that can be executed by Claude.
 * Supports both server-side and browser-side execution.
 */

/**
 * JSON Schema property types
 */
export type JsonSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'array'
  | 'object'
  | 'null';

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
 * Text content in tool result
 */
export interface TextContent {
  type: 'text';
  text: string;
}

/**
 * Image content in tool result
 */
export interface ImageContent {
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
export type ToolContent = TextContent | ImageContent | ResourceContent;

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
export type ToolHandler<TInput = Record<string, unknown>> = (
  input: TInput
) => ToolResult | Promise<ToolResult>;

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
 * MCP Server definition
 */
export interface McpServerDefinition {
  /** Server name */
  name: string;
  /** Server version */
  version?: string;
  /** Tools provided by this server */
  tools: ToolDefinition[];
}

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
