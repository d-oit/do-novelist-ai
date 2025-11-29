import { Page } from '@playwright/test';

/**
 * Sets up network interception for AI Gateway API calls across multiple providers.
 * Returns realistic mock responses based on the prompt context.
 *
 * Supports: OpenAI, Anthropic, Google Gemini, Mistral, MiniMax, and Moonshot via Vercel AI SDK
 */
export const setupAIGatewayMock = async (page: Page) => {
  // Add debug logging to track all network requests
  await page.route('**/*', async route => {
    const url = route.request().url();
    if (
      url.includes('openai.com') ||
      url.includes('anthropic.com') ||
      url.includes('google') ||
      url.includes('mistral') ||
      url.includes('minimax') ||
      url.includes('moonshot')
    ) {
      console.log(`[Mock-Intercept] ${route.request().method()} ${url}`);
    }
  });

  // Mock OpenAI API with wildcard for any endpoint
  await page.route('**/api.openai.com/**', async route => {
    const request = route.request();
    const url = request.url();
    console.log(`[Mock-OpenAI] ${request.method()} ${url}`);

    // Always return mock for OpenAI
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

  // Mock Anthropic API with wildcard
  await page.route('**/api.anthropic.com/**', async route => {
    const request = route.request();
    const url = request.url();
    console.log(`[Mock-Anthropic] ${request.method()} ${url}`);

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'mock-id',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'The Quantum Paradox' }],
        model: 'claude-3-5-sonnet',
        stop_reason: 'end_turn',
        usage: { input_tokens: 50, output_tokens: 30 },
      }),
    });
  });

  // Mock Google Gemini API with wildcard
  await page.route('**/generativelanguage.googleapis.com/**', async route => {
    const request = route.request();
    const url = request.url();
    console.log(`[Mock-Gemini] ${request.method()} ${url}`);

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'The Quantum Paradox' }] } }],
      }),
    });
  });

  // Mock Mistral API with wildcard
  await page.route('**/api.mistral.ai/**', async route => {
    const request = route.request();
    const url = request.url();
    console.log(`[Mock-Mistral] ${request.method()} ${url}`);

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'mock-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'mistral-large',
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

  // Mock MiniMax API with wildcard
  await page.route('**/api.minimax.chat/**', async route => {
    const request = route.request();
    const url = request.url();
    console.log(`[Mock-MiniMax] ${request.method()} ${url}`);

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'mock-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'abab6.5s-chat',
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

  // Mock Moonshot API with wildcard
  await page.route('**/api.moonshot.cn/**', async route => {
    const request = route.request();
    const url = request.url();
    console.log(`[Mock-Moonshot] ${request.method()} ${url}`);

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'mock-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'moonshot-v1-8k',
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

  console.log('[Mock-Setup] All AI provider routes mocked');
};

// Backward compatibility - export as default
export const setupGeminiMock = setupAIGatewayMock;
