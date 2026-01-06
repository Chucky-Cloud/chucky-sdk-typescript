/**
 * WebSocket Transport
 *
 * WebSocket-based transport that works in both browser and Node.js.
 * Handles connection management, keep-alive, and reconnection.
 */
import type { OutgoingMessage } from '../types/messages.js';
import { BaseTransport, type TransportConfig } from './Transport.js';
/**
 * WebSocket transport configuration
 */
export interface WebSocketTransportConfig extends TransportConfig {
    /** Protocol to use (default: determined from URL) */
    protocol?: 'ws' | 'wss';
}
/**
 * WebSocket transport implementation
 */
export declare class WebSocketTransport extends BaseTransport {
    private ws;
    private keepAliveTimer;
    private reconnectAttempts;
    private reconnectTimer;
    private readyPromise;
    private readyResolve;
    private readyReject;
    private messageQueue;
    constructor(config: WebSocketTransportConfig);
    /**
     * Build the WebSocket URL with token
     */
    private buildUrl;
    /**
     * Connect to the WebSocket server
     */
    connect(): Promise<void>;
    /**
     * Disconnect from the server
     */
    disconnect(): Promise<void>;
    /**
     * Send a message to the server
     */
    send(message: OutgoingMessage): Promise<void>;
    /**
     * Send a message immediately
     */
    private sendImmediate;
    /**
     * Wait for the connection to be ready
     */
    waitForReady(): Promise<void>;
    /**
     * Handle incoming message
     */
    private handleMessage;
    /**
     * Start keep-alive ping
     */
    private startKeepAlive;
    /**
     * Stop keep-alive ping
     */
    private stopKeepAlive;
    /**
     * Schedule a reconnection attempt
     */
    private scheduleReconnect;
    /**
     * Clear reconnect timer
     */
    private clearReconnectTimer;
    /**
     * Flush queued messages
     */
    private flushMessageQueue;
}
//# sourceMappingURL=WebSocketTransport.d.ts.map