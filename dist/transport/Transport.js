/**
 * Transport Interface
 *
 * Abstract interface for communication between the SDK and Chucky server.
 * Implementations can use WebSocket (browser/Node.js) or other protocols.
 */
/**
 * Base transport class with common functionality
 */
export class BaseTransport {
    _status = 'disconnected';
    handlers = {};
    config;
    constructor(config) {
        // Filter out undefined values to prevent them from overwriting defaults
        const cleanConfig = Object.fromEntries(Object.entries(config).filter(([_, v]) => v !== undefined));
        this.config = {
            timeout: 60000, // 60s - container startup can take time
            keepAliveInterval: 300000, // 5 minutes
            autoReconnect: false, // Disabled - server doesn't support reconnect
            maxReconnectAttempts: 0,
            debug: false,
            ...cleanConfig,
        };
    }
    get status() {
        return this._status;
    }
    setStatus(status) {
        if (this._status !== status) {
            this._status = status;
            this.handlers.onStatusChange?.(status);
        }
    }
    log(...args) {
        if (this.config.debug) {
            console.log('[ChuckySDK]', ...args);
        }
    }
    logError(...args) {
        console.error('[ChuckySDK]', ...args);
    }
    setEventHandlers(handlers) {
        this.handlers = { ...this.handlers, ...handlers };
    }
}
//# sourceMappingURL=Transport.js.map