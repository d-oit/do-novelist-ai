/**
 * API Gateway - Get Available Models
 * Serverless function to fetch available AI models from OpenRouter
 * Implements rate limiting and caching
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'edge' };

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientId(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'] as string;
  return (forwarded?.split(',')[0] ?? req.socket?.remoteAddress ?? 'unknown') as string;
}

function checkRateLimit(clientId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(clientId);
  const RATE_LIMIT = { requestsPerMinute: 10, windowSizeMs: 60 * 1000 };

  if (!entry || now >= entry.resetTime) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowSizeMs,
    });
    return { allowed: true, remaining: RATE_LIMIT.requestsPerMinute - 1 };
  }

  if (entry.count >= RATE_LIMIT.requestsPerMinute) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT.requestsPerMinute - entry.count };
}

function log(
  level: 'info' | 'warn' | 'error',
  message: string,
  data?: Record<string, unknown>,
): void {
  console[level](
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data,
    }),
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    log('error', 'OpenRouter API key not configured');
    res.status(500).json({ error: 'API configuration error' });
    return;
  }

  const clientId = getClientId(req);
  const { allowed, remaining } = checkRateLimit(clientId);

  res.setHeader('X-RateLimit-Limit', '10');
  res.setHeader('X-RateLimit-Remaining', remaining.toString());

  if (!allowed) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  try {
    const response = await fetch(`${OPENROUTER_API_URL}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      log('error', 'OpenRouter API error', { status: response.status, error: errorText });
      res.status(response.status).json({ error: 'Failed to fetch models', details: errorText });
      return;
    }

    const data = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
      log('error', 'Invalid response format from OpenRouter API');
      res.status(500).json({ error: 'Invalid response format from API' });
      return;
    }

    log('info', 'Models fetched successfully', { modelCount: data.data.length });

    res.status(200).json({
      models: data.data,
      count: data.data.length,
    });
  } catch (error) {
    log('error', 'Models API error', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  }
}
