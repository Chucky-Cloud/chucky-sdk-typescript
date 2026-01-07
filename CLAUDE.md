# CLAUDE.md - Chucky SDK

This file provides guidance to Claude Code when working with the chucky-sdk package.

## Package Overview

Universal TypeScript SDK for the Chucky AI platform. Provides WebSocket-based communication with the Chucky sandbox, tool definitions, token management, and both browser and Node.js support.

## Directory Structure

```
chucky-sdk/
├── src/
│   ├── index.ts              # Main exports (full SDK)
│   ├── browser.ts            # Browser-optimized exports
│   ├── node.ts               # Node.js-optimized exports
│   ├── client/
│   │   ├── ChuckyClient.ts   # Main client class
│   │   ├── Session.ts        # Session management
│   │   └── index.ts          # Client exports
│   ├── transport/
│   │   ├── Transport.ts      # Abstract transport interface
│   │   ├── WebSocketTransport.ts  # WebSocket implementation
│   │   └── index.ts          # Transport exports
│   ├── tools/
│   │   ├── tool.ts           # Tool creation helpers
│   │   ├── McpServer.ts      # MCP server builder
│   │   └── index.ts          # Tools exports
│   ├── types/
│   │   ├── options.ts        # Configuration types
│   │   ├── tools.ts          # Tool definition types
│   │   ├── messages.ts       # WebSocket message types
│   │   ├── token.ts          # JWT token types
│   │   ├── results.ts        # Response types
│   │   └── index.ts          # Types re-exports
│   └── utils/
│       ├── token.ts          # Token creation/verification
│       ├── errors.ts         # Error classes
│       └── index.ts          # Utils exports
└── dist/                     # Compiled output
```

## Build Commands

```bash
npm run build      # Compile TypeScript (tsc)
npm run dev        # Watch mode (tsc --watch)
npm run typecheck  # Type check only
npm run clean      # Remove dist/
```

## Architecture

```
ChuckyClient
    │
    ├── createSession() → Session
    │                        │
    │                        ├── WebSocketTransport
    │                        │        │
    │                        │        └── WebSocket → Chucky Sandbox
    │                        │
    │                        └── Tool Execution (browser/server)
    │
    └── prompt() / promptStream() → One-shot execution
```

## Key Classes

### ChuckyClient (`src/client/ChuckyClient.ts`)

Main entry point. Manages sessions and provides one-shot methods.

```typescript
// Key methods
createSession(options: SessionOptions): Promise<Session>
resumeSession(sessionId: string, options: SessionOptions): Promise<Session>
prompt(options: PromptOptions): Promise<PromptResult>
promptStream(options: PromptOptions): AsyncGenerator<StreamingEvent>
close(): Promise<void>
```

### Session (`src/client/Session.ts`)

Manages multi-turn conversations with state persistence.

```typescript
// State machine: idle → initializing → ready → processing → waiting_tool → completed
connect(): Promise<void>
send(message: string): Promise<SessionResult>
sendStream(message: string): AsyncGenerator<StreamingEvent>
prompt(message: string): Promise<PromptResult>
close(): Promise<void>
```

### WebSocketTransport (`src/transport/WebSocketTransport.ts`)

Handles WebSocket communication with automatic reconnection.

```typescript
// Features:
// - Exponential backoff reconnection (1s → 2s → 4s → 8s → 16s)
// - Keep-alive pings (default 5 min)
// - Message queuing for offline scenarios
// - Cross-platform (browser native + Node.js ws)
```

## Tool System

### Creating Tools

```typescript
// Simple tool
import { tool } from './tools'
const myTool = tool(name, description, schema, handler?)

// Browser-executed tool (always has handler)
import { browserTool } from './tools'
const browserOnlyTool = browserTool({ name, description, inputSchema, handler })

// Server-executed tool (handler optional)
import { serverTool } from './tools'
const serverOnlyTool = serverTool({ name, description, inputSchema })
```

### Tool Result Helpers

```typescript
import { textResult, errorResult, imageResult } from './tools'

textResult('Hello')                          // { content: [{ type: 'text', text: 'Hello' }] }
errorResult('Something went wrong')          // { content: [...], isError: true }
imageResult(base64Data, 'image/png')        // { content: [{ type: 'image', ... }] }
```

### Zod Schema Support

```typescript
// Zod schemas auto-convert to JSON Schema
import { z } from 'zod'

const myTool = tool(
  'my_tool',
  'Description',
  z.object({ name: z.string() }),  // Zod schema
  handler
)
// Internally converted via zodToJsonSchema()
```

### MCP Server Builder

```typescript
import { mcpServer, McpServerBuilder } from './tools'

const server = mcpServer('name', '1.0.0')
  .addTool({ name, description, inputSchema, handler })
  .addTool({ name, description, inputSchema })
  .build()
// Returns: McpServerDefinition { name, version, tools: [...] }
```

## Token Management

### Token Creation (`src/utils/token.ts`)

```typescript
import { createToken, createBudget } from './utils'

const token = createToken({
  userId: 'user-123',
  hmacKey: 'hk_live_xxx_uuid',
  budget: createBudget({
    aiDollars: 5,        // Converted to microdollars (* 1,000,000)
    computeHours: 100,   // Converted to seconds (* 3,600)
    window: 'day'
  }),
  expiresIn: 3600,       // Seconds
  permissions: { ... }   // Optional
})
```

### Token Payload Structure

```typescript
{
  sub: string           // User ID
  iss: string           // Project UUID (extracted from HMAC key)
  exp: number           // Expiration timestamp (seconds)
  iat: number           // Issued at (seconds)
  budget: {
    ai: number          // Microdollars
    compute: number     // Seconds
    window: 'hour' | 'day' | 'week' | 'month'
    windowStart: string // ISO timestamp
  }
  permissions?: {       // Optional restrictions
    allowedTools?: string[]
    maxTurns?: number
  }
  sdkConfig?: object    // Optional SDK overrides
}
```

### Token Utilities

```typescript
verifyToken(token, secret)      // Verify HS256 signature
decodeToken(token)              // Decode without verification
isTokenExpired(token)           // Check exp claim
extractProjectId(hmacKey)       // 'hk_live_xxx_uuid' → 'uuid'
```

## Message Protocol

### Outgoing Messages (`src/types/messages.ts`)

```typescript
// Types: init, prompt, sdk_message, control, ping, tool_result

createInitMessage(options)        // Session initialization
createSdkMessage(options)         // User message
createToolResultMessage(callId, result)  // Tool execution result
```

### Incoming Messages

```typescript
// Types: sdk_message, control, error, pong, tool_call, result

// Type guards
isResultMessage(msg)
isToolCallMessage(msg)
isControlMessage(msg)
isErrorMessage(msg)
```

## Error Classes (`src/utils/errors.ts`)

```typescript
ChuckyError              // Base error with code + details
ConnectionError          // WebSocket connection failures
AuthenticationError      // Token/auth issues
BudgetExceededError      // Budget limit reached
ConcurrencyLimitError    // Too many concurrent sessions
RateLimitError           // API rate limits
SessionError             // Session-specific errors
ToolExecutionError       // Tool execution failures
TimeoutError             // Operation timeouts
ValidationError          // Input validation errors

// Factory
createError(message, code?)  // Returns appropriate error type
```

## Type Definitions

### Options (`src/types/options.ts`)

```typescript
Model = 'claude-sonnet-4-5-20241022' | 'claude-opus-4-5-20251101' | ...
SystemPrompt = string | 'claude_code' | ...
OutputFormat = { type: 'json_schema', schema: object }

ClientOptions { token, baseUrl?, debug?, ... }
SessionOptions extends ClientOptions { sessionId?, systemPrompt?, model?, tools?, mcpServers? }
PromptOptions { message, model?, systemPrompt?, outputFormat?, ... }
```

### Results (`src/types/results.ts`)

```typescript
SessionResult {
  messages: Message[]
  usage: Usage
  cost: CostBreakdown
  sessionId: string
  stopReason: string
}

PromptResult {
  text: string
  structured?: object
  usage: Usage
  cost: CostBreakdown
}

ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock | ThinkingBlock | ImageBlock
```

## Common Modifications

### Adding New Tool Type

1. Add type to `src/types/tools.ts`:
```typescript
export type ToolExecutionLocation = 'server' | 'browser' | 'new_location'
```

2. Add creator in `src/tools/tool.ts`:
```typescript
export function newLocationTool(options: ToolOptions): ToolDefinition {
  return {
    ...options,
    executionLocation: 'new_location'
  }
}
```

3. Export from `src/tools/index.ts`

### Adding New Message Type

1. Add to `src/types/messages.ts`:
```typescript
export interface NewMessage {
  type: 'new_type'
  payload: { ... }
}

export function createNewMessage(payload): NewMessage {
  return { type: 'new_type', payload }
}
```

2. Add type guard if needed:
```typescript
export function isNewMessage(msg: any): msg is NewMessage {
  return msg?.type === 'new_type'
}
```

### Adding New Error Type

1. Add class to `src/utils/errors.ts`:
```typescript
export class NewError extends ChuckyError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NEW_ERROR', details)
    this.name = 'NewError'
  }
}
```

2. Add to `createError` factory if it can be parsed from error messages.

## Package Exports

```json
// package.json exports field
{
  ".": "./dist/index.js",      // Full SDK
  "./browser": "./dist/browser.js",  // Browser-optimized
  "./node": "./dist/node.js"   // Node.js-optimized
}
```

All three entry points export the same API, but browser/node optimize for their runtime environment.

## Dependencies

| Package | Purpose |
|---------|---------|
| ws | WebSocket for Node.js (browser uses native) |
| zod (peer) | Optional Zod schema support |

## Testing Locally

```typescript
// Quick test script
import { ChuckyClient, createToken, createBudget } from './dist'

const token = createToken({
  userId: 'test',
  hmacKey: 'hk_live_test_00000000-0000-0000-0000-000000000000',
  budget: createBudget({ aiDollars: 1, computeHours: 1, window: 'hour' }),
  expiresIn: 3600
})

const client = new ChuckyClient({ token, debug: true })
const result = await client.prompt({ message: 'Hello' })
console.log(result)
```
