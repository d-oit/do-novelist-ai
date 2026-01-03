/**
 * API Gateway - Generate Images
 * Serverless function to generate book covers and illustrations via OpenRouter
 * Implements rate limiting, cost tracking, and request validation
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'edge' };

interface ImageRequest {
  type: 'cover' | 'illustration' | 'character' | 'custom';
  title?: string;
  description?: string;
  style?: string;
  provider?: string;
  prompt?: string;
  aspectRatio?: '1:1' | '2:3' | '3:2' | '4:3' | '4:5' | '9:16' | '16:9';
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

  const { type, title, description, style, provider, prompt } = req.body as ImageRequest;

  if (!type) {
    res.status(400).json({ error: 'Missing required field: type' });
    return;
  }

  if (!['cover', 'illustration', 'character', 'custom'].includes(type)) {
    res.status(400).json({
      error: 'Invalid type. Must be "cover", "illustration", "character", or "custom"',
    });
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
    let finalPrompt: string;
    let model = 'black-forest-labs/flux-1.1-pro';

    if (provider === 'openai') model = 'openai/dall-e-3';
    if (provider === 'google') model = 'google/gemini-2.0-flash-exp';

    if (type === 'custom' && prompt) {
      finalPrompt = style ? `${prompt} in the style of ${style}` : prompt;
    } else if (type === 'character' && title && description && style) {
      finalPrompt = `A detailed character portrait of ${title}.
Description: ${description}.
The style should be: ${style}.
Focus on facial features and personality.
Professional character concept art.`;
    } else if (type === 'cover' && title && description && style) {
      finalPrompt = `A professional book cover for a novel titled "${title}".
The book's premise is: ${description}.
The style should be: ${style}.
High quality, cinematic lighting, book cover design.
NO TEXT on the image unless it's artistically integrated.`;
    } else if (type === 'illustration' && title && description && style) {
      finalPrompt = `An atmospheric illustration for a book chapter titled "${title}".
Scene summary: ${description}.
The style should be: ${style}.
High quality, evocative digital art.
NO TEXT on the image.`;
    } else {
      res.status(400).json({
        error: 'Missing required fields for type',
      });
      return;
    }

    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://novelist.ai',
        'X-Title': 'Novelist.ai',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: finalPrompt,
              },
            ],
          },
        ],
        modalities: ['image'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log('error', 'OpenRouter API error', { status: response.status, error: errorText });
      res.status(response.status).json({ error: 'Image generation failed', details: errorText });
      return;
    }

    const data = await response.json();

    const images: Array<{ url: string; revisedPrompt?: string }> = [];

    if (data.choices && data.choices[0]?.message?.content) {
      const content = data.choices[0].message.content;

      if (Array.isArray(content)) {
        for (const item of content) {
          if (item.type === 'image' || item.image_url) {
            images.push({
              url: item.image_url?.url || item.image || '',
              revisedPrompt: item.revised_prompt,
            });
          }
        }
      } else if (typeof content === 'string' && content.startsWith('data:image')) {
        images.push({ url: content });
      }
    }

    if (images.length === 0 && data.images) {
      for (const img of data.images) {
        images.push({ url: typeof img === 'string' ? img : img.url });
      }
    }

    if (images.length === 0) {
      log('error', 'No images found in response', { data });
      res.status(500).json({ error: 'Image generation failed - no images returned' });
      return;
    }

    log('info', 'Image generated successfully', {
      type,
      model,
      imageCount: images.length,
    });

    res.status(200).json({
      images,
      usage: {
        model,
        type,
      },
    });
  } catch (error) {
    log('error', 'Image API error', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  }
}
