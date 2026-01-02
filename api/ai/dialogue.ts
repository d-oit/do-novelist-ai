/**
 * API Gateway - Polish Dialogue
 * Serverless function to polish dialogue for better flow via OpenRouter
 * Implements rate limiting, cost tracking, and request validation
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface DialogueRequest {
  content: string;
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
  const RATE_LIMIT = { requestsPerMinute: 60, windowSizeMs: 60 * 1000 };

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

  const { content, style, provider = 'anthropic' } = req.body as DialogueRequest;

  if (!content || !style) {
    res.status(400).json({ error: 'Missing required fields: content, style' });
    return;
  }

  const clientId = getClientId(req);
  const { allowed, remaining } = checkRateLimit(clientId);

  res.setHeader('X-RateLimit-Limit', '60');
  res.setHeader('X-RateLimit-Remaining', remaining.toString());

  if (!allowed) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  try {
    const model = 'claude-3-5-sonnet-20241022';

    const systemPrompt = `You are an expert dialogue editor specializing in ${style} fiction. 
Your task is to polish and improve dialogue to make it more natural, engaging, and character-appropriate.

Focus on:
- Natural speech patterns and rhythm
- Character voice consistency
- Subtext and emotional depth
- Realistic conversation flow
- Appropriate dialogue tags and action beats
- Genre-appropriate language and tone
- Eliminating exposition dumps in dialogue
- Creating distinct voices for different characters

Maintain the original meaning and story beats while improving the dialogue quality.`;

    const userPrompt = `Please polish and improve the dialogue in this ${style} content:

${content}

Enhance the dialogue to be more natural, engaging, and character-appropriate while maintaining the original story and meaning.`;

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
        temperature: 0.4,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log('error', 'OpenRouter API error', { status: response.status, error: errorText });
      res.status(response.status).json({ error: 'Dialogue polishing failed', details: errorText });
      return;
    }

    const data = await response.json();
    const polishedContent = data.choices?.[0]?.message?.content || '';

    const usage = data.usage || {};
    log('info', 'Dialogue polished successfully', {
      provider,
      model: `${provider}/${model}`,
      style,
      originalLength: content.length,
      polishedLength: polishedContent.length,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
    });

    res.status(200).json({
      polishedContent,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
    });
  } catch (error) {
    log('error', 'Dialogue API error', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  }
}
