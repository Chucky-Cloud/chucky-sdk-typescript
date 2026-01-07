/**
 * Tool Definition Types
 *
 * Types for defining tools that can be executed by Claude.
 * Supports both server-side and browser-side execution.
 */
/**
 * Type guard for client-side tools server
 */
export function isClientToolsServer(server) {
    return 'tools' in server;
}
/**
 * Type guard for stdio server
 */
export function isStdioServer(server) {
    return 'command' in server;
}
/**
 * Type guard for SSE server
 */
export function isSSEServer(server) {
    return 'type' in server && server.type === 'sse';
}
/**
 * Type guard for HTTP server
 */
export function isHttpServer(server) {
    return 'type' in server && server.type === 'http';
}
//# sourceMappingURL=tools.js.map