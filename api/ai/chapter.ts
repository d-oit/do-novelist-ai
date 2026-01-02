/**
 * API Gateway - Write Chapter
 * POST /api/ai/chapter
 * Writes full chapter content
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'edge' };

interface ChapterRequest {
  chapterTitle: string;
  chapterSummary: string;
  style: string;
  previousChapterSummary?: string;
  provider?: string;
  systemPrompt?: string;
  userPrompt?: string;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_PROVIDER = 'nvidia';
const DEFAULT_MODEL = 'nemotron-3-nano-30b-a3b:free';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT = {
  requestsPerMinute: 60,
  windowSizeMs: 60 * 1000,
};

function getClientId(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'] as string;
  return (forwarded?.split(',')[0] ?? req.socket?.remoteAddress ?? 'unknown') as string;
}

function checkRateLimit(clientId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(clientId);

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
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  };
  console[level](JSON.stringify(logEntry));
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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

  const {
    chapterTitle,
    chapterSummary,
    style,
    previousChapterSummary,
    provider = DEFAULT_PROVIDER,
    systemPrompt,
    userPrompt,
  } = req.body as ChapterRequest;

  if (!chapterTitle || !chapterSummary || !style) {
    res.status(400).json({
      error: 'Missing required fields: chapterTitle, chapterSummary, style',
    });
    return;
  }

  const clientId = getClientId(req);
  const { allowed, remaining } = checkRateLimit(clientId);

  res.setHeader('X-RateLimit-Limit', '60');
  res.setHeader('X-RateLimit-Remaining', remaining.toString());

  if (!allowed) {
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: 60,
    });
    return;
  }

  log('info', 'Writing chapter', {
    provider,
    style,
    title: chapterTitle,
    hasEnhancedPrompts: !!(systemPrompt || userPrompt),
  });

  try {
    // Use enhanced prompts if provided, otherwise use defaults
    const finalSystemPrompt =
      systemPrompt ||
      `You are a skilled ${style} writer. Write engaging, well-paced chapter content that advances the story and develops characters naturally.`;

    const finalUserPrompt =
      userPrompt ||
      `Write the full content for the chapter: "${chapterTitle}".
Context / Summary: ${chapterSummary}
${previousChapterSummary ? `Previously: ${previousChapterSummary}` : ''}
Style: ${style}.
Write in Markdown. Focus on "Show, Don't Tell". Use sensory details.
Output only the chapter content.`;

    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://novelist.ai',
        'X-Title': 'Novelist.ai',
      },
      body: JSON.stringify({
        model: `${provider}/${DEFAULT_MODEL}`,
        messages: [
          {
            role: 'system',
            content: finalSystemPrompt,
          },
          {
            role: 'user',
            content: finalUserPrompt,
          },
        ],
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log('error', 'OpenRouter API error', { status: response.status, error: errorText });
      res.status(response.status).json({ error: 'OpenRouter request failed', details: errorText });
      return;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    log('info', 'Chapter written', { title: chapterTitle, length: content.length });

    res.status(200).json({ content });
  } catch (error) {
    log('error', 'Chapter writing failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to write chapter',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
