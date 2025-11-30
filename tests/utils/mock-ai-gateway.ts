import { Page } from '@playwright/test';

/**
 * Sets up network interception for Vercel AI Gateway API calls.
 * Returns realistic mock responses for all supported providers.
 *
 * Supports: OpenAI, Anthropic, Google Gemini, Mistral, MiniMax, and Moonshot via Vercel AI Gateway
 */
export const setupAIGatewayMock = async (page: Page) => {
  // Add debug logging for Gateway requests
  await page.route('**/*', async route => {
    const url = route.request().url();
    if (url.includes('gateway.vercel.ai')) {
      console.log(`[Mock-Gateway] ${route.request().method()} ${url}`);
    }
  });

  // Mock Vercel AI Gateway - OpenAI endpoint
  await page.route('**/gateway.vercel.ai/v1/openai/**', async route => {
    const request = route.request();
    const url = request.url();
    console.log(`[Mock-Gateway-OpenAI] ${request.method()} ${url}`);

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'mock-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'The Quantum Paradox' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 50, completion_tokens: 30, total_tokens: 80 },
      }),
    });
  });

  // Mock Vercel AI Gateway - Anthropic endpoint
  await page.route('**/gateway.vercel.ai/v1/anthropic/**', async route => {
    const request = route.request();
    const url = request.url();
    console.log(`[Mock-Gateway-Anthropic] ${request.method()} ${url}`);

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'mock-id',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'The Quantum Paradox' }],
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: 'end_turn',
        usage: { input_tokens: 50, output_tokens: 30 },
      }),
    });
  });

  // Mock Vercel AI Gateway - Google endpoint
  await page.route('**/gateway.vercel.ai/v1/google/**', async route => {
    const request = route.request();
    const url = request.url();
    console.log(`[Mock-Gateway-Google] ${request.method()} ${url}`);

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'The Quantum Paradox' }] } }],
      }),
    });
  });

  // Mock Vercel AI Gateway - Mistral endpoint
  await page.route('**/gateway.vercel.ai/v1/mistral/**', async route => {
    const request = route.request();
    const url = request.url();
    console.log(`[Mock-Gateway-Mistral] ${request.method()} ${url}`);

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'mock-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'mistral-medium-latest',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'The Quantum Paradox' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 50, completion_tokens: 30, total_tokens: 80 },
      }),
    });
  });

  console.log('[Mock-Setup] Vercel AI Gateway routes mocked for all providers');
};

// Backward compatibility - export as default
export const setupGeminiMock = setupAIGatewayMock;
