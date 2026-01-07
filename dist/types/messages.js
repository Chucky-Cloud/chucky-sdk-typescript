/**
 * WebSocket Message Types
 *
 * Matches the official Claude Agent SDK message format.
 * See: https://platform.claude.com/docs/en/agent-sdk/typescript
 */
// ============================================================================
// Message Helpers
// ============================================================================
/**
 * Create an init message
 */
export function createInitMessage(payload) {
    return { type: 'init', payload };
}
/**
 * Create a user message (official SDK format)
 */
export function createUserMessage(content, sessionId, options = {}) {
    const messageContent = typeof content === 'string'
        ? content
        : content;
    return {
        type: 'user',
        uuid: options.uuid,
        session_id: sessionId,
        message: {
            role: 'user',
            content: messageContent,
        },
        parent_tool_use_id: options.parentToolUseId ?? null,
    };
}
/**
 * Create a control message
 */
export function createControlMessage(action, data) {
    return { type: 'control', payload: { action, data } };
}
/**
 * Create a ping message
 */
export function createPingMessage() {
    return { type: 'ping', payload: { timestamp: Date.now() } };
}
/**
 * Create a tool result message
 */
export function createToolResultMessage(callId, result) {
    return { type: 'tool_result', payload: { callId, result } };
}
// ============================================================================
// Type Guards
// ============================================================================
/**
 * Check if message is a user message
 */
export function isUserMessage(message) {
    return message.type === 'user';
}
/**
 * Check if message is an assistant message
 */
export function isAssistantMessage(message) {
    return message.type === 'assistant';
}
/**
 * Check if message is a result message
 */
export function isResultMessage(message) {
    return message.type === 'result';
}
/**
 * Check if message is a success result
 */
export function isSuccessResult(message) {
    return message.type === 'result' && message.subtype === 'success';
}
/**
 * Check if message is an error result
 */
export function isErrorResult(message) {
    return message.type === 'result' && message.subtype !== 'success';
}
/**
 * Check if message is a system message
 */
export function isSystemMessage(message) {
    return message.type === 'system';
}
/**
 * Check if message is a stream event
 */
export function isStreamEvent(message) {
    return message.type === 'stream_event';
}
/**
 * Check if message is a tool call
 */
export function isToolCallMessage(message) {
    return message.type === 'tool_call';
}
/**
 * Check if message is a control message
 */
export function isControlMessage(message) {
    return message.type === 'control';
}
/**
 * Check if message is an error message
 */
export function isErrorMessage(message) {
    return message.type === 'error';
}
/**
 * Extract text from result message
 */
export function getResultText(message) {
    if (message.subtype === 'success') {
        return message.result;
    }
    return null;
}
/**
 * Extract text from assistant message content
 */
export function getAssistantText(message) {
    return message.message.content
        .filter((block) => block.type === 'text')
        .map(block => block.text)
        .join('');
}
//# sourceMappingURL=messages.js.map