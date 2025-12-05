import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel AI Gateway Proxy - Generate Text
 * Proxies AI generation requests to Vercel AI Gateway server-side
 * to avoid CORS issues and protect API keys
 */

const AI_GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1';

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
  const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VITE_AI_GATEWAY_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'AI Gateway API key not configured' });
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

    // Call Vercel AI Gateway
    const response = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
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
      console.error('AI Gateway error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'AI Gateway request failed',
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
