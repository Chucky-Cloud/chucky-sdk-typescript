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
        this.config = {
            timeout: 30000,
            keepAliveInterval: 300000, // 5 minutes
            autoReconnect: true,
            maxReconnectAttempts: 5,
            debug: false,
            ...config,
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