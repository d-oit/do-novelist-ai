/**
 * API Gateway - Translate Content
 * Serverless function to translate content to target language via OpenRouter
 * Implements rate limiting, cost tracking, and request validation
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'edge' };

interface TranslateRequest {
  content: string;
  targetLanguage: string;
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
  const RATE_LIMIT = { requestsPerMinute: 30, windowSizeMs: 60 * 1000 }; // Lower limit for translation

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

  const { content, targetLanguage, provider = 'anthropic' } = req.body as TranslateRequest;

  if (!content || !targetLanguage) {
    res.status(400).json({ error: 'Missing required fields: content, targetLanguage' });
    return;
  }

  const clientId = getClientId(req);
  const { allowed, remaining } = checkRateLimit(clientId);

  res.setHeader('X-RateLimit-Limit', '30');
  res.setHeader('X-RateLimit-Remaining', remaining.toString());

  if (!allowed) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  try {
    const model = 'claude-3-5-sonnet-20241022';

    const systemPrompt = `You are an expert translator specializing in literary translation. 
Your task is to translate creative writing content while preserving:

- The author's voice and style
- Literary devices and figurative language
- Cultural context and nuances
- Emotional tone and atmosphere
- Character personality through dialogue

Provide a natural, fluent translation that reads as if originally written in the target language.`;

    const userPrompt = `Please translate the following content to ${targetLanguage}:

${content}

Maintain the literary quality, style, and emotional impact of the original text.`;

    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://novelist.ai',
        'X-Title': 'Novelist.ai',
      },
      body: JSON.stringify({
        model: `${provider}/${model}`,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log('error', 'OpenRouter API error', { status: response.status, error: errorText });
      res.status(response.status).json({ error: 'Translation failed', details: errorText });
      return;
    }

    const data = await response.json();
    const translatedContent = data.choices?.[0]?.message?.content || '';

    const usage = data.usage || {};
    log('info', 'Translation completed', {
      provider,
      model: `${provider}/${model}`,
      targetLanguage,
      originalLength: content.length,
      translatedLength: translatedContent.length,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
    });

    res.status(200).json({
      translatedContent,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
    });
  } catch (error) {
    log('error', 'Translation API error', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  }
}
