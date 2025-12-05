import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel AI Gateway Proxy - Brainstorm
 * Quick generation for titles, styles, and ideas
 */

const AI_GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1';

interface BrainstormRequest {
  context: string;
  field: 'title' | 'style' | 'idea';
  provider?: 'openai' | 'anthropic' | 'google' | 'mistral';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VITE_AI_GATEWAY_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'AI Gateway API key not configured' });
  }

  try {
    const { context, field, provider = 'mistral' } = req.body as BrainstormRequest;

    if (!context || !field) {
      return res.status(400).json({ error: 'Missing required fields: context, field' });
    }

    // Build prompt based on field type
    let prompt = '';
    if (field === 'title') {
      prompt = `Generate a catchy book title for: "${context.substring(0, 500)}". Output ONLY the title, nothing else.`;
    } else if (field === 'style') {
      prompt = `Suggest a genre/style for: "${context.substring(0, 500)}". Output ONLY the style/genre, nothing else.`;
    } else if (field === 'idea') {
      prompt = `Enhance this book concept into a detailed paragraph: "${context.substring(0, 1000)}"`;
    }

    // Choose model based on provider
    const modelMap: Record<string, string> = {
      mistral: 'mistral-small-latest',
      openai: 'gpt-4o-mini',
      anthropic: 'claude-3-5-haiku-20241022',
      google: 'gemini-2.0-flash-exp',
    };

    const response = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: `${provider}/${modelMap[provider] || modelMap.mistral}`,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Brainstorm API error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'AI Gateway request failed',
        details: errorText,
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim().replace(/^"|"$/g, '') || '';

    return res.status(200).json({ text });
  } catch (error) {
    console.error('Brainstorm API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
