import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * OpenRouter API Proxy - Generate Text
 * Proxies AI generation requests to OpenRouter server-side
 * to avoid CORS issues and protect API keys
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

interface GenerateRequest {
  provider: 'openai' | 'anthropic' | 'google' | 'mistral';
  model: string;
  prompt: string;
  system?: string;
  temperature?: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from server environment (not VITE_ prefixed)
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'OpenRouter API key not configured' });
  }

  try {
    const { provider, model, prompt, system, temperature = 0.7 } = req.body as GenerateRequest;

    if (!provider || !model || !prompt) {
      return res.status(400).json({ error: 'Missing required fields: provider, model, prompt' });
    }

    // Build the messages array
    const messages: Array<{ role: string; content: string }> = [];
    if (system) {
      messages.push({ role: 'system', content: system });
    }
    messages.push({ role: 'user', content: prompt });

    // Call OpenRouter API
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
        messages,
        temperature,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'OpenRouter request failed',
        details: errorText,
      });
    }

    const data = await response.json();

    // Extract the text from the response
    const text = data.choices?.[0]?.message?.content || '';

    return res.status(200).json({ text });
  } catch (error) {
    console.error('Generate API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
