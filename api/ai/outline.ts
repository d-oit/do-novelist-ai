/**
 * API Gateway - Generate Outline
 * POST /api/ai/outline
 * Generates book outline from idea and style
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface OutlineRequest {
  idea: string;
  style: string;
  provider?: string;
}

interface Chapter {
  orderIndex: number;
  title: string;
  summary: string;
}

interface OutlineResponse {
  title: string;
  chapters: Chapter[];
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

  const { idea, style, provider = DEFAULT_PROVIDER } = req.body as OutlineRequest;

  if (!idea || !style) {
    res.status(400).json({ error: 'Missing required fields: idea, style' });
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

  log('info', 'Generating outline', { provider, style, ideaLength: idea.length });

  try {
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
            content: `You are an expert Novel Architect.
Your goal is to take a vague book idea and structurize it into a compelling chapter outline.
The style of the book is: ${style}.
Adhere to the "Hero's Journey" or "Save the Cat" beat sheets if applicable to the genre.`,
          },
          {
            role: 'user',
            content: `Create a title and a chapter outline for this idea: "${idea}"

Return a JSON object with this structure:
{
  "title": "Book Title",
  "chapters": [
    {
      "orderIndex": 1,
      "title": "Chapter Title",
      "summary": "Detailed paragraph summary of what happens in this chapter"
    }
  ]
}`,
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
    const responseText = data.choices?.[0]?.message?.content || '';

    // Parse JSON response
    let parsed: OutlineResponse;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Try to extract JSON from response
      const jsonMatch = /\{[\s\S]*\}/.exec(responseText);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse outline response as JSON');
      }
    }

    // Validate structure
    if (!parsed.title || !Array.isArray(parsed.chapters)) {
      throw new Error('Invalid outline structure');
    }

    log('info', 'Outline generated', { title: parsed.title, chapters: parsed.chapters.length });

    res.status(200).json(parsed);
  } catch (error) {
    log('error', 'Outline generation failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to generate outline',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
