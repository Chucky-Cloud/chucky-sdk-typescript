/**
 * Transport Interface
 *
 * Abstract interface for communication between the SDK and Chucky server.
 * Implementations can use WebSocket (browser/Node.js) or other protocols.
 */
import type { ConnectionStatus, ClientEventHandlers } from '../types/options.js';
import type { OutgoingMessage, IncomingMessage } from '../types/messages.js';
/**
 * Transport event types
 */
export interface TransportEvents extends ClientEventHandlers {
    /** Called when a message is received */
    onMessage?: (message: IncomingMessage) => void;
    /** Called when the transport is closed */
    onClose?: (code?: number, reason?: string) => void;
}
/**
 * Transport configuration
 */
export interface TransportConfig {
    /** Server URL */
    url: string;
    /** Authentication token */
    token: string;
    /** Connection timeout in milliseconds */
    timeout?: number;
    /** Keep-alive interval in milliseconds */
    keepAliveInterval?: number;
    /** Auto-reconnect on disconnect */
    autoReconnect?: boolean;
    /** Maximum reconnect attempts */
    maxReconnectAttempts?: number;
    /** Debug mode */
    debug?: boolean;
}
/**
 * Abstract transport interface
 */
export interface Transport {
    /** Current connection status */
    readonly status: ConnectionStatus;
    /**
     * Connect to the server
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
     * Set event handlers
     */
    setEventHandlers(handlers: TransportEvents): void;
    /**
     * Wait for connection to be ready
     */
    waitForReady(): Promise<void>;
}
/**
 * Base transport class with common functionality
 */
export declare abstract class BaseTransport implements Transport {
    protected _status: ConnectionStatus;
    protected handlers: TransportEvents;
    protected config: TransportConfig;
    constructor(config: TransportConfig);
    get status(): ConnectionStatus;
    protected setStatus(status: ConnectionStatus): void;
    protected log(...args: unknown[]): void;
    protected logError(...args: unknown[]): void;
    setEventHandlers(handlers: TransportEvents): void;
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract send(message: OutgoingMessage): Promise<void>;
    abstract waitForReady(): Promise<void>;
}
//# sourceMappingURL=Transport.d.ts.map