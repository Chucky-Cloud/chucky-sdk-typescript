/**
 * Tool Helper
 *
 * Helper functions for defining tools with type safety.
 * Supports both JSON Schema and Zod for input validation.
 */

import type {
  ToolDefinition,
  ToolInputSchema,
  ToolHandler,
  ToolResult,
  ToolExecutionLocation,
  JsonSchemaProperty,
} from '../types/tools.js';

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
  safeParse?: (data: unknown) => { success: boolean; data?: unknown; error?: unknown };
}

/**
 * Check if a schema is a Zod schema
 */
function isZodSchema(schema: unknown): schema is ZodLikeSchema {
  return (
    typeof schema === 'object' &&
    schema !== null &&
    ('_def' in schema || 'shape' in schema)
  );
}

/**
 * Convert Zod schema to JSON Schema (basic conversion)
 */
function zodToJsonSchema(zodSchema: ZodLikeSchema): ToolInputSchema {
  // This is a simplified conversion - for full support, use zod-to-json-schema
  const def = (zodSchema as { _def?: { typeName?: string; shape?: () => Record<string, unknown> } })._def;

  if (!def) {
    return {
      type: 'object',
      properties: {},
    };
  }

  const typeName = def.typeName;

  if (typeName === 'ZodObject') {
    const shape = def.shape?.() || {};
    const properties: Record<string, JsonSchemaProperty> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const valueDef = (value as { _def?: { typeName?: string; description?: string; checks?: Array<{ kind: string }> } })._def;

      if (valueDef) {
        const prop = zodDefToJsonSchema(valueDef);
        if (prop) {
          properties[key] = prop;

          // Check if required (not optional)
          if (valueDef.typeName !== 'ZodOptional') {
            required.push(key);
          }
        }
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  return {
    type: 'object',
    properties: {},
  };
}

/**
 * Convert a Zod definition to JSON Schema property
 */
function zodDefToJsonSchema(def: {
  typeName?: string;
  description?: string;
  checks?: Array<{ kind: string; value?: unknown }>;
  innerType?: { _def?: unknown };
  values?: string[];
}): JsonSchemaProperty | null {
  const typeName = def.typeName;

  switch (typeName) {
    case 'ZodString':
      return { type: 'string', description: def.description };

    case 'ZodNumber':
      return { type: 'number', description: def.description };

    case 'ZodBoolean':
      return { type: 'boolean', description: def.description };

    case 'ZodArray':
      const innerDef = def.innerType?._def as { typeName?: string; description?: string } | undefined;
      return {
        type: 'array',
        description: def.description,
        items: innerDef ? zodDefToJsonSchema(innerDef) || { type: 'string' } : { type: 'string' },
      };

    case 'ZodEnum':
      return {
        type: 'string',
        description: def.description,
        enum: def.values,
      };

    case 'ZodOptional':
      const innerOptDef = def.innerType?._def as { typeName?: string; description?: string } | undefined;
      return innerOptDef ? zodDefToJsonSchema(innerOptDef) : null;

    default:
      return { type: 'string' };
  }
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
export function createTool<TInput = Record<string, unknown>>(
  options: CreateToolOptions<TInput>
): ToolDefinition<TInput> {
  let inputSchema: ToolInputSchema;

  if (isZodSchema(options.inputSchema)) {
    inputSchema = zodToJsonSchema(options.inputSchema);
  } else {
    inputSchema = options.inputSchema as ToolInputSchema;
  }

  return {
    name: options.name,
    description: options.description,
    inputSchema,
    executeIn: options.executeIn ?? 'server',
    handler: options.handler,
  };
}

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
export function tool<TInput = Record<string, unknown>>(
  name: string,
  description: string,
  inputSchema: ToolInputSchema | ZodLikeSchema,
  handler?: ToolHandler<TInput>
): ToolDefinition<TInput> {
  return createTool({ name, description, inputSchema, handler });
}

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
export function browserTool<TInput = Record<string, unknown>>(
  options: Omit<CreateToolOptions<TInput>, 'executeIn'>
): ToolDefinition<TInput> {
  return createTool({ ...options, executeIn: 'browser' });
}

/**
 * Create a server-executed tool
 *
 * @param options - Tool configuration (handler is optional for server tools)
 * @returns Tool definition that executes on the server
 */
export function serverTool<TInput = Record<string, unknown>>(
  options: Omit<CreateToolOptions<TInput>, 'executeIn' | 'handler'>
): ToolDefinition<TInput> {
  return createTool({ ...options, executeIn: 'server' });
}

/**
 * Helper to create text content for tool results
 */
export function textResult(text: string): ToolResult {
  return {
    content: [{ type: 'text', text }],
  };
}

/**
 * Helper to create error result for tools
 */
export function errorResult(message: string): ToolResult {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

/**
 * Helper to create image content for tool results
 */
export function imageResult(data: string, mimeType: string): ToolResult {
  return {
    content: [{ type: 'image', data, mimeType }],
  };
}
