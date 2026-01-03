/**
 * Rate limit store abstraction
 * Supports both in-memory (development/Hobby plan) and Vercel KV (Pro/Enterprise)
 *
 * Note: Vercel KV requires Pro or Enterprise plan. Hobby plan users will
 * automatically use the in-memory store, which works fine for most use cases.
 */

/**
 * Rate limit entry for token bucket
 */
export interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

/**
 * Rate limit store interface
 */
export interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | null>;
  set(key: string, entry: RateLimitEntry): Promise<void>;
  delete(key: string): Promise<void>;
  cleanup(): Promise<void>;
}

/**
 * In-memory rate limit store (development/Hobby plan/fallback)
 * Works well for single-region deployments and moderate traffic
 */
class InMemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, RateLimitEntry>();

  async get(key: string): Promise<RateLimitEntry | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    this.store.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [key, entry] of this.store.entries()) {
      if (now - entry.lastRefill > maxAge) {
        this.store.delete(key);
      }
    }

    console.log(`[Rate Limit] Cleaned up old entries. Current size: ${this.store.size}`);
  }
}

/**
 * Vercel KV rate limit store (Pro/Enterprise plans only)
 * Provides distributed rate limiting across serverless functions
 */
class VercelKVRateLimitStore implements RateLimitStore {
  private kv: {
    get: <T>(key: string) => Promise<T | null>;
    set: (key: string, value: unknown, options?: { ex: number }) => Promise<void>;
    del: (key: string) => Promise<void>;
  };

  constructor(kv: {
    get: <T>(key: string) => Promise<T | null>;
    set: (key: string, value: unknown, options?: { ex: number }) => Promise<void>;
    del: (key: string) => Promise<void>;
  }) {
    this.kv = kv;
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    try {
      const data = await this.kv.get<RateLimitEntry>(key);
      return data;
    } catch (error) {
      console.error('[Rate Limit] KV get error:', error);
      return null;
    }
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    try {
      // Set with 24h expiration
      await this.kv.set(key, entry, { ex: 24 * 60 * 60 });
    } catch (error) {
      console.error('[Rate Limit] KV set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.kv.del(key);
    } catch (error) {
      console.error('[Rate Limit] KV delete error:', error);
    }
  }

  async cleanup(): Promise<void> {
    // Vercel KV handles expiration automatically, no cleanup needed
    console.log('[Rate Limit] KV cleanup skipped (automatic expiration)');
  }
}

/**
 * Create rate limit store based on environment
 */
export function createRateLimitStore(): RateLimitStore {
  // Check if Vercel KV is available
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      // Lazy load @vercel/kv only in production
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const vercelKV = require('@vercel/kv') as {
        createClient: (config: { url: string; token: string }) => {
          get: <T>(key: string) => Promise<T | null>;
          set: (key: string, value: unknown, options?: { ex: number }) => Promise<void>;
          del: (key: string) => Promise<void>;
        };
      };
      const kv = vercelKV.createClient({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      });
      console.log('[Rate Limit] Using Vercel KV store');
      return new VercelKVRateLimitStore(kv);
    } catch (error) {
      console.warn(
        '[Rate Limit] Failed to initialize Vercel KV, falling back to in-memory:',
        error,
      );
    }
  }

  console.log('[Rate Limit] Using in-memory store');
  return new InMemoryRateLimitStore();
}
