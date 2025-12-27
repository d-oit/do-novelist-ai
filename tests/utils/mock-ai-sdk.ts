import type { Page } from '@playwright/test';

/**
 * Mock setup for OpenRouter SDK
 * Ensures proper initialization in browser context for E2E tests
 */
export const setupAISDKMock = async (page: Page): Promise<void> => {
  // Initialize mock OpenRouter SDK in browser context
  await page.addInitScript(() => {
    // Mock OpenRouter SDK for E2E tests
    (window as any).__MOCK_OPENROUTER__ = {
      chat: {
        send: async () => ({
          choices: [{ message: { content: 'Mock AI response for E2E test' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        }),
      },
    };
  });

  console.log('[mock-ai-sdk] OpenRouter SDK mock initialized in browser context');
};
