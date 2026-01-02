/**
 * API Gateway - Generate Images
 * Serverless function to generate book covers and illustrations via OpenRouter
 * Implements rate limiting, cost tracking, and request validation
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'edge' };

interface ImageRequest {
  type: 'cover' | 'illustration';
  title: string;
  description: string;
  style: string;
  provider?: string;
}

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
  const RATE_LIMIT = { requestsPerMinute: 20, windowSizeMs: 60 * 1000 }; // Lower limit for image generation

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
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    log('error', 'OpenRouter API key not configured');
    res.status(500).json({ error: 'API configuration error' });
    return;
  }

  const { type, title, description, style } = req.body as ImageRequest;

  if (!type || !title || !description || !style) {
    res.status(400).json({ error: 'Missing required fields: type, title, description, style' });
    return;
  }

  if (!['cover', 'illustration'].includes(type)) {
    res.status(400).json({ error: 'Invalid type. Must be "cover" or "illustration"' });
    return;
  }

  const clientId = getClientId(req);
  const { allowed, remaining } = checkRateLimit(clientId);

  res.setHeader('X-RateLimit-Limit', '20');
  res.setHeader('X-RateLimit-Remaining', remaining.toString());

  if (!allowed) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  try {
    let prompt: string;

    if (type === 'cover') {
      prompt = `Create a professional book cover for "${title}". 
Style: ${style}
Description: ${description}

The cover should be:
- Professional and marketable
- Genre-appropriate for ${style}
- Eye-catching and readable
- Suitable for both print and digital formats
- High quality, detailed artwork`;
    } else {
      prompt = `Create an illustration for a ${style} story titled "${title}".
Scene description: ${description}

The illustration should be:
- Detailed and atmospheric
- Consistent with ${style} genre conventions
- Visually engaging and immersive
- High quality artwork suitable for publication`;
    }

    // Use DALL-E 3 for image generation
    const model = 'openai/dall-e-3';

    const response = await fetch(`${OPENROUTER_API_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://novelist.ai',
        'X-Title': 'Novelist.ai',
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size: type === 'cover' ? '1024x1792' : '1024x1024', // Portrait for covers, square for illustrations
        quality: 'standard',
        style: 'vivid',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log('error', 'OpenRouter API error', { status: response.status, error: errorText });
      res.status(response.status).json({ error: 'Image generation failed', details: errorText });
      return;
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      log('error', 'No image URL in response', { response: data });
      res.status(500).json({ error: 'Image generation failed - no URL returned' });
      return;
    }

    log('info', 'Image generated successfully', {
      type,
      title,
      model,
      imageUrl: imageUrl.substring(0, 50) + '...',
    });

    res.status(200).json({
      imageUrl,
      usage: {
        model,
        type,
        size: type === 'cover' ? '1024x1792' : '1024x1024',
      },
    });
  } catch (error) {
    log('error', 'Image API error', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  }
}
