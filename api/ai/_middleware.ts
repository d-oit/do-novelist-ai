/**
 * Rate limiting middleware for AI API endpoints
 * Implements token bucket algorithm to prevent abuse
 * Supports both in-memory (dev) and Vercel KV (production) storage
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

import { createRateLimitStore } from './_rate-limit-store';
import type { RateLimitStore } from './_rate-limit-store';

/**
 * Singleton rate limit store instance
 */
let rateLimitStore: RateLimitStore | null = null;

function getRateLimitStore(): RateLimitStore {
  if (!rateLimitStore) {
    rateLimitStore = createRateLimitStore();
  }
  return rateLimitStore;
}

/**
 * Rate limit configuration
 */
const RATE_LIMIT_CONFIG = {
  maxTokens: 60, // Max requests per hour
  refillRate: 1, // Tokens added per minute
  refillInterval: 60000, // 1 minute in milliseconds
};

/**
 * Get user identifier from request
 * Priority: x-user-id header > x-forwarded-for > 'anonymous'
 */
function getUserIdentifier(req: VercelRequest): string {
  const userId = req.headers['x-user-id'] as string;
  if (userId) {
    return `user:${userId}`;
  }

  const forwardedFor = req.headers['x-forwarded-for'] as string;
  if (forwardedFor) {
    // Take first IP if comma-separated
    const ip = forwardedFor.split(',')[0]?.trim();
    return `ip:${ip}`;
  }

  return 'anonymous';
}

/**
 * Rate limiting middleware using token bucket algorithm
 */
export async function rateLimitMiddleware(
  req: VercelRequest,
  res: VercelResponse,
  next: () => void,
): Promise<void> {
  const store = getRateLimitStore();
  const identifier = getUserIdentifier(req);
  const now = Date.now();

  let entry = await store.get(identifier);

  if (!entry) {
    // First request from this identifier
    entry = {
      tokens: RATE_LIMIT_CONFIG.maxTokens - 1, // Consume 1 token immediately
      lastRefill: now,
    };
    await store.set(identifier, entry);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_CONFIG.maxTokens.toString());
    res.setHeader('X-RateLimit-Remaining', entry.tokens.toString());

    next();
    return;
  }

  // Refill tokens based on time elapsed
  const timeSinceRefill = now - entry.lastRefill;
  const tokensToAdd =
    Math.floor(timeSinceRefill / RATE_LIMIT_CONFIG.refillInterval) * RATE_LIMIT_CONFIG.refillRate;

  if (tokensToAdd > 0) {
    entry.tokens = Math.min(RATE_LIMIT_CONFIG.maxTokens, entry.tokens + tokensToAdd);
    entry.lastRefill = now;
  }

  // Check if request allowed
  if (entry.tokens < 1) {
    const retryAfter = Math.ceil(RATE_LIMIT_CONFIG.refillInterval / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_CONFIG.maxTokens.toString());
    res.setHeader('X-RateLimit-Remaining', '0');

    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: `${retryAfter} seconds`,
      limit: RATE_LIMIT_CONFIG.maxTokens,
    });
    return;
  }

  // Consume token
  entry.tokens -= 1;
  await store.set(identifier, entry);

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_CONFIG.maxTokens.toString());
  res.setHeader('X-RateLimit-Remaining', entry.tokens.toString());

  next();
}

/**
 * Cleanup old entries (run periodically to prevent memory leaks)
 * Call this from a cron job or serverless function
 */
export async function cleanupRateLimitStore(): Promise<void> {
  const store = getRateLimitStore();
  await store.cleanup();
}
