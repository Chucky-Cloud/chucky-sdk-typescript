/**
 * Result Types
 *
 * Types for responses from sessions and prompts.
 */
/**
 * Message role
 */
export type MessageRole = 'user' | 'assistant' | 'system';
/**
 * Content block types
 */
export type ContentBlockType = 'text' | 'tool_use' | 'tool_result' | 'thinking' | 'image';
/**
 * Text content block
 */
export interface TextBlock {
    type: 'text';
    text: string;
}
/**
 * Tool use content block
 */
export interface ToolUseBlock {
    type: 'tool_use';
    id: string;
    name: string;
    input: Record<string, unknown>;
}
/**
 * Tool result content block
 */
export interface ToolResultBlock {
    type: 'tool_result';
    tool_use_id: string;
    content: string | Array<{
        type: 'text';
        text: string;
    }>;
    is_error?: boolean;
}
/**
 * Thinking content block (extended thinking)
 */
export interface ThinkingBlock {
    type: 'thinking';
    thinking: string;
}
/**
 * Image content block
 */
export interface ImageBlock {
    type: 'image';
    source: {
        type: 'base64';
        media_type: string;
        data: string;
    };
}
/**
 * Union type for all content blocks
 */
export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock | ThinkingBlock | ImageBlock;
/**
 * A message in the conversation
 */
export interface Message {
    /** Message role */
    role: MessageRole;
    /** Message content */
    content: ContentBlock[] | string;
}
/**
 * Usage statistics
 */
export interface Usage {
    /** Input tokens used */
    input_tokens: number;
    /** Output tokens generated */
    output_tokens: number;
    /** Cache creation input tokens */
    cache_creation_input_tokens?: number;
    /** Cache read input tokens */
    cache_read_input_tokens?: number;
}
/**
 * Cost breakdown
 */
export interface CostBreakdown {
    /** Input cost in USD */
    input_cost_usd: number;
    /** Output cost in USD */
    output_cost_usd: number;
    /** Total cost in USD */
    total_cost_usd: number;
}
/**
 * Session result (returned when session completes)
 */
export interface SessionResult {
    /** Result type */
    type: 'result';
    /** Result subtype */
    subtype?: 'success' | 'error' | 'interrupted';
    /** Final response text */
    text?: string;
    /** Conversation messages */
    messages?: Message[];
    /** Total cost in USD */
    total_cost_usd?: number;
    /** Session duration in seconds */
    duration_secs?: number;
    /** Number of conversation turns */
    turn_count?: number;
    /** Usage statistics */
    usage?: Usage;
    /** Session ID (for resuming) */
    session_id?: string;
    /** Error message (if subtype is 'error') */
    error?: string;
}
/**
 * Prompt result (returned from one-shot prompts)
 */
export interface PromptResult {
    /** Result type */
    type: 'result';
    /** Result subtype */
    subtype?: 'success' | 'error';
    /** Response text */
    text?: string;
    /** Structured output (if outputFormat was specified) */
    output?: unknown;
    /** Total cost in USD */
    total_cost_usd?: number;
    /** Duration in seconds */
    duration_secs?: number;
    /** Usage statistics */
    usage?: Usage;
    /** Error message (if subtype is 'error') */
    error?: string;
}
/**
 * Streaming message event
 */
export interface StreamEvent {
    /** Event type */
    type: 'message_start' | 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_delta' | 'message_stop' | 'tool_use' | 'tool_result' | 'error';
    /** Event data */
    data: unknown;
}
/**
 * Partial message (during streaming)
 */
export interface PartialMessage {
    /** Message role */
    role: MessageRole;
    /** Partial content accumulated so far */
    content: ContentBlock[];
    /** Whether the message is complete */
    complete: boolean;
}
/**
 * Session state
 */
export type SessionState = 'idle' | 'initializing' | 'ready' | 'processing' | 'waiting_tool' | 'completed' | 'error';
/**
 * Session info (returned when connecting/resuming)
 */
export interface SessionInfo {
    /** Session ID */
    sessionId?: string;
    /** Current state */
    state?: SessionState;
    /** Number of messages in conversation */
    messageCount?: number;
    /** Session creation time (ISO 8601) */
    createdAt?: string;
    /** Last activity time (ISO 8601) */
    lastActivityAt?: string;
    /** Model being used */
    model?: string;
    /** Available tools */
    tools?: string[];
}
//# sourceMappingURL=results.d.ts.map