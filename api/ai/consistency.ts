/**
 * API Gateway - Analyze Consistency
 * Serverless function to analyze chapter consistency via OpenRouter
 * Implements rate limiting, cost tracking, and request validation
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'edge' };

interface ConsistencyRequest {
  chapters: Array<{
    orderIndex: number;
    title: string;
    summary: string;
  }>;
  style: string;
  provider?: string;
  systemPrompt?: string;
  userPrompt?: string;
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

  const {
    chapters,
    style,
    provider = 'anthropic',
    systemPrompt,
    userPrompt,
  } = req.body as ConsistencyRequest;

  if (!chapters || !Array.isArray(chapters) || !style) {
    res.status(400).json({ error: 'Missing required fields: chapters (array), style' });
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

    // Use enhanced prompts if provided, otherwise use defaults
    const finalSystemPrompt =
      systemPrompt ||
      `You are an expert story analyst specializing in narrative consistency and continuity. 
Your task is to analyze a series of chapter summaries for consistency issues.

Style: ${style}

Analyze for:
- Plot continuity and logical progression
- Character consistency and development
- Timeline and pacing issues
- Tone and style consistency
- World-building consistency
- Potential plot holes or contradictions

Provide specific, actionable feedback with chapter references.`;

    const chaptersText = chapters
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(ch => `Chapter ${ch.orderIndex}: ${ch.title}\nSummary: ${ch.summary}`)
      .join('\n\n');

    const finalUserPrompt =
      userPrompt ||
      `Please analyze these chapter summaries for consistency issues:

${chaptersText}

Provide a detailed analysis highlighting any inconsistencies, plot holes, or areas that need attention for better narrative flow.`;

    log('info', 'Analyzing consistency', {
      provider,
      style,
      chaptersCount: chapters.length,
      hasEnhancedPrompts: !!(systemPrompt || userPrompt),
    });

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
          { role: 'system', content: finalSystemPrompt },
          { role: 'user', content: finalUserPrompt },
        ],
        temperature: 0.3,
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
    const analysis = data.choices?.[0]?.message?.content || '';

    const usage = data.usage || {};
    log('info', 'Consistency analysis completed', {
      provider,
      model: `${provider}/${model}`,
      chaptersAnalyzed: chapters.length,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
    });

    res.status(200).json({
      analysis,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
    });
  } catch (error) {
    log('error', 'Consistency API error', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  }
}
