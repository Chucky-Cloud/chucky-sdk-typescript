/**
 * WebSocket Message Types
 *
 * Defines the envelope format and message types for communication
 * between the SDK client and the Chucky server.
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
 * Create a prompt message
 */
export function createPromptMessage(payload) {
    return { type: 'prompt', payload };
}
/**
 * Create an SDK message
 */
export function createSdkMessage(payload) {
    return { type: 'sdk_message', payload };
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
/**
 * Check if a message is a result message
 */
export function isResultMessage(message) {
    return message.type === 'result';
}
/**
 * Check if a message is a tool call message
 */
export function isToolCallMessage(message) {
    return message.type === 'tool_call';
}
/**
 * Check if a message is a control message
 */
export function isControlMessage(message) {
    return message.type === 'control';
}
/**
 * Check if a message is an error message
 */
export function isErrorMessage(message) {
    return message.type === 'error';
}
//# sourceMappingURL=messages.js.map