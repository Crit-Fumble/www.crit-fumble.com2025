/**
 * Redis Client Utilities
 * Handles caching and pub/sub
 */

import { createClient, RedisClientType } from 'redis';

export class RedisManager {
  private client: RedisClientType | null = null;
  private publisher: RedisClientType | null = null;
  private subscriber: RedisClientType | null = null;
  private connected = false;

  constructor(
    private redisUrl: string,
    private options?: {
      password?: string;
      onError?: (error: Error) => void;
    }
  ) {}

  async connect(): Promise<void> {
    if (this.connected) return;

    const clientConfig: any = {
      url: this.redisUrl,
    };

    if (this.options?.password) {
      clientConfig.password = this.options.password;
    }

    // Main client for get/set operations
    this.client = createClient(clientConfig);

    // Publisher for pub/sub
    this.publisher = createClient(clientConfig);

    // Subscriber for pub/sub
    this.subscriber = createClient(clientConfig);

    // Error handlers
    this.client.on('error', (err) => {
      console.error('Redis client error:', err);
      this.options?.onError?.(err);
    });

    this.publisher.on('error', (err) => {
      console.error('Redis publisher error:', err);
      this.options?.onError?.(err);
    });

    this.subscriber.on('error', (err) => {
      console.error('Redis subscriber error:', err);
      this.options?.onError?.(err);
    });

    // Connect all clients
    await Promise.all([
      this.client.connect(),
      this.publisher.connect(),
      this.subscriber.connect(),
    ]);

    this.connected = true;
    console.log('✅ Redis connected');
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;

    await Promise.all([
      this.client?.quit(),
      this.publisher?.quit(),
      this.subscriber?.quit(),
    ]);

    this.connected = false;
    console.log('Redis disconnected');
  }

  /**
   * Cache operations
   */

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.client) throw new Error('Redis not connected');

    const value = await this.client.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async set(key: string, value: any, expirySeconds?: number): Promise<void> {
    if (!this.client) throw new Error('Redis not connected');

    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    if (expirySeconds) {
      await this.client.setEx(key, expirySeconds, stringValue);
    } else {
      await this.client.set(key, stringValue);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.client) throw new Error('Redis not connected');
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) throw new Error('Redis not connected');
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Pub/Sub operations
   */

  async publish(channel: string, message: any): Promise<void> {
    if (!this.publisher) throw new Error('Redis not connected');

    const stringMessage = typeof message === 'string' ? message : JSON.stringify(message);
    await this.publisher.publish(channel, stringMessage);
  }

  async subscribe(channel: string, handler: (message: any, channel: string) => void): Promise<void> {
    if (!this.subscriber) throw new Error('Redis not connected');

    await this.subscriber.subscribe(channel, (message, channelName) => {
      try {
        const parsed = JSON.parse(message);
        handler(parsed, channelName);
      } catch {
        handler(message, channelName);
      }
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    if (!this.subscriber) throw new Error('Redis not connected');
    await this.subscriber.unsubscribe(channel);
  }

  /**
   * List operations
   */

  async lpush(key: string, ...values: any[]): Promise<void> {
    if (!this.client) throw new Error('Redis not connected');
    const stringValues = values.map(v => typeof v === 'string' ? v : JSON.stringify(v));
    await this.client.lPush(key, stringValues);
  }

  async rpush(key: string, ...values: any[]): Promise<void> {
    if (!this.client) throw new Error('Redis not connected');
    const stringValues = values.map(v => typeof v === 'string' ? v : JSON.stringify(v));
    await this.client.rPush(key, stringValues);
  }

  async lrange<T = any>(key: string, start: number, stop: number): Promise<T[]> {
    if (!this.client) throw new Error('Redis not connected');
    const values = await this.client.lRange(key, start, stop);
    return values.map(v => {
      try {
        return JSON.parse(v);
      } catch {
        return v;
      }
    });
  }

  /**
   * Hash operations
   */

  async hset(key: string, field: string, value: any): Promise<void> {
    if (!this.client) throw new Error('Redis not connected');
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await this.client.hSet(key, field, stringValue);
  }

  async hget<T = any>(key: string, field: string): Promise<T | null> {
    if (!this.client) throw new Error('Redis not connected');
    const value = await this.client.hGet(key, field);
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return value as T;
    }
  }

  async hgetall<T = any>(key: string): Promise<Record<string, T>> {
    if (!this.client) throw new Error('Redis not connected');
    const values = await this.client.hGetAll(key);

    const result: Record<string, T> = {};
    for (const [field, value] of Object.entries(values)) {
      try {
        result[field] = JSON.parse(value);
      } catch {
        result[field] = value as T;
      }
    }

    return result;
  }

  /**
   * Utility methods
   */

  isConnected(): boolean {
    return this.connected;
  }

  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  async flushdb(): Promise<void> {
    if (!this.client) throw new Error('Redis not connected');
    await this.client.flushDb();
  }
}
