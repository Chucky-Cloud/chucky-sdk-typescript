/**
 * WebSocket Transport
 *
 * WebSocket-based transport that works in both browser and Node.js.
 * Handles connection management, keep-alive, and reconnection.
 */
import { createPingMessage, isErrorMessage } from '../types/messages.js';
import { BaseTransport } from './Transport.js';
/**
 * Get WebSocket implementation (browser or Node.js)
 */
async function getWebSocket() {
    if (typeof WebSocket !== 'undefined') {
        return WebSocket;
    }
    // Node.js: dynamically import ws
    const ws = await import('ws');
    return ws.default;
}
/**
 * WebSocket transport implementation
 */
export class WebSocketTransport extends BaseTransport {
    ws = null;
    keepAliveTimer = null;
    reconnectAttempts = 0;
    reconnectTimer = null;
    readyPromise = null;
    readyResolve = null;
    readyReject = null;
    messageQueue = [];
    constructor(config) {
        super(config);
    }
    /**
     * Build the WebSocket URL with token
     */
    buildUrl() {
        const url = new URL(this.config.url);
        url.searchParams.set('token', this.config.token);
        return url.toString();
    }
    /**
     * Connect to the WebSocket server
     */
    async connect() {
        if (this._status === 'connected' || this._status === 'connecting') {
            return this.waitForReady();
        }
        this.setStatus('connecting');
        this.log('Connecting to', this.config.url);
        // Create ready promise
        this.readyPromise = new Promise((resolve, reject) => {
            this.readyResolve = resolve;
            this.readyReject = reject;
        });
        try {
            const WS = await getWebSocket();
            const wsUrl = this.buildUrl();
            this.ws = new WS(wsUrl);
            // Set up connection timeout
            const timeoutId = setTimeout(() => {
                if (this._status === 'connecting') {
                    this.ws?.close();
                    const error = new Error('Connection timeout');
                    this.readyReject?.(error);
                    this.handlers.onError?.(error);
                    this.setStatus('error');
                }
            }, this.config.timeout);
            this.ws.onopen = () => {
                clearTimeout(timeoutId);
                this.log('Connected');
                this.setStatus('connected');
                this.reconnectAttempts = 0;
                this.startKeepAlive();
                this.readyResolve?.();
                this.flushMessageQueue();
            };
            this.ws.onclose = (event) => {
                clearTimeout(timeoutId);
                this.log('Disconnected:', event.code, event.reason);
                this.stopKeepAlive();
                if (this._status === 'connecting') {
                    const error = new Error(`Connection failed: ${event.reason || 'Unknown'}`);
                    this.readyReject?.(error);
                }
                this.setStatus('disconnected');
                this.handlers.onClose?.(event.code, event.reason);
                // Auto-reconnect if enabled
                if (this.config.autoReconnect && this.reconnectAttempts < (this.config.maxReconnectAttempts || 5)) {
                    this.scheduleReconnect();
                }
            };
            this.ws.onerror = (event) => {
                clearTimeout(timeoutId);
                const error = new Error('WebSocket error');
                this.logError('WebSocket error:', event);
                this.handlers.onError?.(error);
                if (this._status === 'connecting') {
                    this.readyReject?.(error);
                }
                this.setStatus('error');
            };
            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };
            return this.readyPromise;
        }
        catch (error) {
            this.setStatus('error');
            this.readyReject?.(error);
            throw error;
        }
    }
    /**
     * Disconnect from the server
     */
    async disconnect() {
        this.log('Disconnecting');
        this.stopKeepAlive();
        this.clearReconnectTimer();
        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }
        this.setStatus('disconnected');
    }
    /**
     * Send a message to the server
     */
    async send(message) {
        // Don't queue or send if we're closing/closed
        if (this._status === 'disconnected' && !this.config.autoReconnect) {
            this.log('Message dropped (disconnected):', message.type);
            return;
        }
        if (this._status !== 'connected') {
            // Queue message if not connected
            this.messageQueue.push(message);
            this.log('Message queued (not connected):', message.type);
            // Try to connect if disconnected and autoReconnect is enabled
            if (this._status === 'disconnected' && this.config.autoReconnect) {
                await this.connect();
            }
            return;
        }
        this.sendImmediate(message);
    }
    /**
     * Send a message immediately
     */
    sendImmediate(message) {
        if (!this.ws || this.ws.readyState !== 1) {
            this.logError('Cannot send: WebSocket not ready');
            return;
        }
        const data = JSON.stringify(message);
        this.handlers.onRawMessage?.('out', message);
        this.ws.send(data);
        this.log('Sent:', message.type);
    }
    /**
     * Wait for the connection to be ready
     */
    async waitForReady() {
        if (this._status === 'connected') {
            return;
        }
        if (this.readyPromise) {
            return this.readyPromise;
        }
        // Start connection if not already connecting
        return this.connect();
    }
    /**
     * Handle incoming message
     */
    handleMessage(data) {
        try {
            const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
            const message = JSON.parse(text);
            this.handlers.onRawMessage?.('in', message);
            this.log('Received:', message.type);
            // Handle pong (keep-alive response)
            if (message.type === 'pong') {
                return;
            }
            // Handle errors
            if (isErrorMessage(message)) {
                const error = new Error(message.payload.message);
                this.handlers.onError?.(error);
            }
            // Forward to message handler
            this.handlers.onMessage?.(message);
        }
        catch (error) {
            this.logError('Failed to parse message:', error);
        }
    }
    /**
     * Start keep-alive ping
     */
    startKeepAlive() {
        this.stopKeepAlive();
        if (this.config.keepAliveInterval && this.config.keepAliveInterval > 0) {
            this.keepAliveTimer = setInterval(() => {
                if (this._status === 'connected' && this.ws?.readyState === 1) {
                    this.sendImmediate(createPingMessage());
                }
            }, this.config.keepAliveInterval);
        }
    }
    /**
     * Stop keep-alive ping
     */
    stopKeepAlive() {
        if (this.keepAliveTimer) {
            clearInterval(this.keepAliveTimer);
            this.keepAliveTimer = null;
        }
    }
    /**
     * Schedule a reconnection attempt
     */
    scheduleReconnect() {
        this.clearReconnectTimer();
        this.reconnectAttempts++;
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 16000);
        this.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
        this.setStatus('reconnecting');
        this.reconnectTimer = setTimeout(() => {
            this.connect().catch((error) => {
                this.logError('Reconnect failed:', error);
            });
        }, delay);
    }
    /**
     * Clear reconnect timer
     */
    clearReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
    /**
     * Flush queued messages
     */
    flushMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.sendImmediate(message);
        }
    }
}
//# sourceMappingURL=WebSocketTransport.js.map