# @chucky.cloud/sdk

[![npm version](https://img.shields.io/npm/v/@chucky.cloud/sdk.svg)](https://www.npmjs.com/package/@chucky.cloud/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)

Universal TypeScript SDK for [Chucky](https://chucky.cloud) - build Claude-powered AI assistants for browser and Node.js.

## Installation

```bash
npm install @chucky.cloud/sdk
```

## Quick Start

```typescript
import { ChuckyClient, tool, createBudget, createToken } from '@chucky.cloud/sdk';

// Server-side: Create a token for your user
const token = await createToken({
  userId: 'user-123',
  projectId: 'your-project-uuid',
  secret: 'your-hmac-secret',
  budget: createBudget({
    aiDollars: 1.00,
    computeHours: 1,
    window: 'day',
  }),
});

// Create client with the token
const client = new ChuckyClient({ token });

// Create a session
const session = await client.createSession({
  model: 'claude-sonnet-4-5-20250929',
});

// Send a message and get response
const result = await session.send('Hello, world!');
console.log(result.text);
```

## Features

- **Browser & Node.js Support**: Same API works in both environments
- **Sessions**: Multi-turn conversations with state persistence
- **One-shot Prompts**: Stateless prompt execution
- **Tools**: Define custom tools with full type safety
- **Streaming**: Real-time response streaming
- **Token Management**: Create and verify JWT tokens

## Sessions

### Creating a Session

```typescript
const session = await client.createSession({
  model: 'claude-sonnet-4-5-20250929',
  systemPrompt: 'You are a helpful assistant.',
  maxTurns: 10,
});

const result = await session.send('What is 2 + 2?');
console.log(result.text); // "4"

// Multi-turn conversation
const followUp = await session.send('And what is that times 3?');
console.log(followUp.text); // "12"
```

### Resuming a Session

```typescript
const session = await client.resumeSession('session-123', {
  continue: true,
});
```

### Streaming Responses

```typescript
for await (const event of session.sendStream('Tell me a story')) {
  if (event.type === 'text') {
    process.stdout.write(event.text);
  } else if (event.type === 'tool_use') {
    console.log('Using tool:', event.name);
  }
}
```

## Tools

### Defining Tools

```typescript
import { tool, textResult } from '@chucky.cloud/sdk';

const weatherTool = tool(
  'get_weather',
  'Get current weather for a city',
  {
    type: 'object',
    properties: {
      city: { type: 'string', description: 'City name' },
      unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
    },
    required: ['city'],
  },
  async ({ city, unit }) => textResult(`Weather in ${city}: Sunny, 72°${unit === 'celsius' ? 'C' : 'F'}`)
);

const session = await client.createSession({
  tools: [weatherTool],
});
```

### Browser Tools

Tools that execute in the browser:

```typescript
import { browserTool } from '@chucky.cloud/sdk';

const alertTool = browserTool({
  name: 'show_alert',
  description: 'Show an alert dialog',
  inputSchema: {
    type: 'object',
    properties: { message: { type: 'string' } },
    required: ['message'],
  },
  handler: async ({ message }) => {
    alert(message);
    return { content: [{ type: 'text', text: 'Alert shown' }] };
  },
});
```

### MCP Server Builder

```typescript
import { mcpServer, tool } from '@chucky.cloud/sdk';

const myTools = mcpServer('my-tools', '1.0.0')
  .addTool({
    name: 'greet',
    description: 'Greet someone',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    },
    handler: async ({ name }) => ({
      content: [{ type: 'text', text: `Hello, ${name}!` }],
    }),
  })
  .build();

const session = await client.createSession({
  mcpServers: [myTools],
});
```

## Token Management

### Creating Tokens (Server-side)

```typescript
import { createToken, createBudget } from '@chucky.cloud/sdk';

const token = await createToken({
  userId: 'user-123',
  projectId: 'your-project-uuid',
  secret: 'your-hmac-secret',
  expiresIn: 3600, // 1 hour
  budget: createBudget({
    aiDollars: 5.00,
    computeHours: 2,
    window: 'day',
  }),
  permissions: {
    tools: ['get_weather', 'search'],
    maxTurns: 20,
  },
});
```

### Verifying Tokens

```typescript
import { verifyToken, decodeToken, isTokenExpired } from '@chucky.cloud/sdk';

// Verify signature
const isValid = await verifyToken(token, 'your-hmac-secret');

// Decode without verification
const decoded = decodeToken(token);
console.log(decoded.payload.sub); // User ID
console.log(decoded.payload.budget); // Budget limits

// Check expiration
if (isTokenExpired(token)) {
  console.log('Token has expired');
}
```

## Client Options

```typescript
const client = new ChuckyClient({
  // Required
  token: 'your-jwt-token',

  // Optional
  baseUrl: 'wss://conjure.chucky.cloud/ws', // Custom endpoint
  debug: false,                          // Enable debug logging
  timeout: 30000,                        // Connection timeout (ms)
  keepAliveInterval: 300000,             // Keep-alive interval (ms)
  autoReconnect: true,                   // Auto-reconnect on disconnect
  maxReconnectAttempts: 5,               // Max reconnect attempts
});
```

## Session Options

```typescript
const session = await client.createSession({
  // Model
  model: 'claude-sonnet-4-5-20250929',
  fallbackModel: 'claude-3-5-haiku-20241022',

  // Limits
  maxTurns: 10,
  maxBudgetUsd: 1.00,
  maxThinkingTokens: 10000,

  // System prompt
  systemPrompt: 'You are a helpful assistant.',
  // Or use preset:
  // systemPrompt: { type: 'preset', preset: 'claude_code', append: 'Be concise.' },

  // Tools
  tools: [myTool],
  allowedTools: ['get_weather'],
  disallowedTools: ['dangerous_tool'],

  // MCP servers
  mcpServers: [myServer],

  // Sub-agents
  agents: {
    researcher: {
      name: 'Researcher',
      model: 'claude-sonnet-4-5-20250929',
      tools: ['search'],
    },
  },

  // Session management
  sessionId: 'session-123',    // Resume existing session
  forkSession: true,           // Fork instead of resume
  continue: true,              // Continue from where left off

  // Output
  includePartialMessages: true,
  outputFormat: {
    type: 'json_schema',
    schema: { /* your schema */ },
  },
});
```

## Error Handling

```typescript
import {
  ChuckyError,
  ConnectionError,
  AuthenticationError,
  BudgetExceededError,
  ConcurrencyLimitError,
} from '@chucky.cloud/sdk';

try {
  await session.send('Hello');
} catch (error) {
  if (error instanceof BudgetExceededError) {
    console.log('Budget exceeded:', error.message);
  } else if (error instanceof ConcurrencyLimitError) {
    console.log('Too many concurrent sessions');
  } else if (error instanceof AuthenticationError) {
    console.log('Invalid token');
  } else if (error instanceof ConnectionError) {
    console.log('Connection failed');
  }
}
```

## TypeScript

The SDK is fully typed. All types are exported:

```typescript
import type {
  // Options
  ClientOptions,
  SessionOptions,
  PromptOptions,

  // Tools
  ToolDefinition,
  ToolResult,
  ToolInputSchema,
  McpServerDefinition,

  // Results
  SessionResult,
  PromptResult,
  Message,

  // Token
  BudgetTokenPayload,
  TokenBudget,

  // Streaming
  StreamingEvent,
} from '@chucky.cloud/sdk';
```

## License

MIT
