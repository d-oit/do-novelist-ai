/**
 * Global Mock Fixtures for E2E Tests
 *
 * Provides centralized mock setup with one-time initialization
 * and intelligent mock management across tests
 */

/**
 * Global mock registry for one-time initialization
 */
export const mockRegistry = new Map<string, any>();

/**
 * Initialize common mocks once for test suite
 */
export async function setupGlobalMocks(): Promise<void> {
  if (mockRegistry.has('initialized')) {
    console.log('[GlobalMocks] Already initialized, skipping');
    return;
  }

  console.log('[GlobalMocks] Initializing global mocks...');

  // Register common mock responses
  registerCommonMocks();

  mockRegistry.set('initialized', true);
  console.log('[GlobalMocks] Global initialization complete');
}

/**
 * Register common mock responses that are reused across tests
 */
function registerCommonMocks(): void {
  // Health check endpoint
  mockRegistry.set('/api/health', {
    status: 200,
    body: { status: 'ok', timestamp: Date.now() },
  });

  // Common AI responses
  mockRegistry.set('ai-default', {
    id: `chatcmpl-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'mistral-medium-latest',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: 'Mock AI response for testing purposes.',
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 50,
      completion_tokens: 100,
      total_tokens: 150,
    },
  });

  // Common database responses
  mockRegistry.set('db-project', {
    id: 'test-project',
    title: 'Test Project',
    idea: 'A test project for E2E validation',
    chapters: [],
    createdAt: new Date().toISOString(),
  });

  mockRegistry.set('db-chapter', {
    id: 'test-chapter',
    title: 'Test Chapter',
    content: 'This is test chapter content.',
    status: 'draft',
  });

  console.log(`[GlobalMocks] Registered ${mockRegistry.size} common mock responses`);
}

/**
 * Get mock response from registry
 */
export function getMockResponse(key: string): any {
  return mockRegistry.get(key);
}

/**
 * Reset mock registry for clean state
 */
export function resetMockRegistry(): void {
  mockRegistry.clear();
}
