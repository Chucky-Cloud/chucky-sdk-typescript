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
  /** Persistent sandbox name (vessel) */
  vessel?: string;
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
export abstract class BaseTransport implements Transport {
  protected _status: ConnectionStatus = 'disconnected';
  protected handlers: TransportEvents = {};
  protected config: TransportConfig;

  constructor(config: TransportConfig) {
    // Filter out undefined values to prevent them from overwriting defaults
    const cleanConfig = Object.fromEntries(
      Object.entries(config).filter(([_, v]) => v !== undefined)
    ) as TransportConfig;

    this.config = {
      timeout: 60000, // 60s - container startup can take time
      keepAliveInterval: 300000, // 5 minutes
      autoReconnect: false, // Disabled - server doesn't support reconnect
      maxReconnectAttempts: 0,
      debug: false,
      ...cleanConfig,
    };
  }

  get status(): ConnectionStatus {
    return this._status;
  }

  protected setStatus(status: ConnectionStatus): void {
    if (this._status !== status) {
      this._status = status;
      this.handlers.onStatusChange?.(status);
    }
  }

  protected log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[ChuckySDK]', ...args);
    }
  }

  protected logError(...args: unknown[]): void {
    console.error('[ChuckySDK]', ...args);
  }

  setEventHandlers(handlers: TransportEvents): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract send(message: OutgoingMessage): Promise<void>;
  abstract waitForReady(): Promise<void>;
}
