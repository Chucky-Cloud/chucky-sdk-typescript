/**
 * WebSocket Transport
 *
 * WebSocket-based transport that works in both browser and Node.js.
 * Handles connection management, keep-alive, and reconnection.
 */

import type { OutgoingMessage, IncomingMessage } from '../types/messages.js';
import { createPingMessage, isErrorMessage } from '../types/messages.js';
import { BaseTransport, type TransportConfig } from './Transport.js';

/**
 * WebSocket transport configuration
 */
export interface WebSocketTransportConfig extends TransportConfig {
  /** Protocol to use (default: determined from URL) */
  protocol?: 'ws' | 'wss';
}

/**
 * Get WebSocket implementation (browser or Node.js)
 */
async function getWebSocket(): Promise<typeof WebSocket> {
  if (typeof WebSocket !== 'undefined') {
    return WebSocket;
  }
  // Node.js: dynamically import ws
  const ws = await import('ws');
  return ws.default as unknown as typeof WebSocket;
}

/**
 * WebSocket transport implementation
 */
export class WebSocketTransport extends BaseTransport {
  private ws: WebSocket | null = null;
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readyPromise: Promise<void> | null = null;
  private readyResolve: (() => void) | null = null;
  private readyReject: ((error: Error) => void) | null = null;
  private messageQueue: OutgoingMessage[] = [];

  constructor(config: WebSocketTransportConfig) {
    super(config);
  }

  /**
   * Build the WebSocket URL with token
   */
  private buildUrl(): string {
    const url = new URL(this.config.url);
    url.searchParams.set('token', this.config.token);
    return url.toString();
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    if (this._status === 'connected' || this._status === 'connecting') {
      return this.waitForReady();
    }

    this.setStatus('connecting');
    this.log('Connecting to', this.config.url);

    // Create ready promise
    this.readyPromise = new Promise<void>((resolve, reject) => {
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
    } catch (error) {
      this.setStatus('error');
      this.readyReject?.(error as Error);
      throw error;
    }
  }

  /**
   * Disconnect from the server
   */
  async disconnect(): Promise<void> {
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
  async send(message: OutgoingMessage): Promise<void> {
    if (this._status !== 'connected') {
      // Queue message if not connected
      this.messageQueue.push(message);
      this.log('Message queued (not connected):', message.type);

      // Try to connect if disconnected
      if (this._status === 'disconnected') {
        await this.connect();
      }
      return;
    }

    this.sendImmediate(message);
  }

  /**
   * Send a message immediately
   */
  private sendImmediate(message: OutgoingMessage): void {
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
  async waitForReady(): Promise<void> {
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
  private handleMessage(data: string | Buffer | ArrayBuffer): void {
    try {
      const text = typeof data === 'string' ? data : new TextDecoder().decode(data as ArrayBuffer);
      const message = JSON.parse(text) as IncomingMessage;

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
    } catch (error) {
      this.logError('Failed to parse message:', error);
    }
  }

  /**
   * Start keep-alive ping
   */
  private startKeepAlive(): void {
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
  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
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
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      this.sendImmediate(message);
    }
  }
}
