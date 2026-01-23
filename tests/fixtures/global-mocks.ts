/**
 * Global Mock Fixtures for E2E Tests
 *
 * Provides centralized mock setup with one-time initialization
 * and intelligent mock management across tests
 */

import type { Page } from '@playwright/test';
import { setupAISDKMock } from './mock-ai-sdk';
import { unifiedMockManager, type MockConfig } from './unified-mock-manager';

/**
 * Global mock registry for one-time initialization
 */
export const mockRegistry = new Map<string, any>();

/**
 * Initialize common mocks once for the test suite
 */
export async function setupGlobalMocks(page: Page): Promise<void> {
  if (mockRegistry.has('initialized')) {
    console.log('[GlobalMocks] Already initialized, skipping');
    return;
  }

  console.log('[GlobalMocks] Initializing global mocks...');

  // Initialize AI SDK mock first
  await setupAISDKMock(page);
  console.log('[GlobalMocks] AI SDK mock initialized');

  // Initialize unified mock manager
  await unifiedMockManager.initializePage(page, 'global', {
    enableNetworkErrors: false,
    enableTimeoutErrors: false,
    mockDelay: 0,
    enableDatabaseMocking: true,
    enableCacheClearing: true,
  });

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
 * Get a mock from the registry
 */
export function getMock(key: string): any {
  return mockRegistry.get(key);
}

/**
 * Set a custom mock for a specific test
 */
export function setTestMock(key: string, value: any): void {
  mockRegistry.set(key, value);
}

/**
 * Clear test-specific mocks while preserving common mocks
 */
export function clearTestMocks(): void {
  const commonMocks = new Set([
    'initialized',
    '/api/health',
    'ai-default',
    'db-project',
    'db-chapter',
  ]);

  for (const key of mockRegistry.keys()) {
    if (!commonMocks.has(key)) {
      mockRegistry.delete(key);
    }
  }

  console.log(`[GlobalMocks] Cleared test-specific mocks, kept ${mockRegistry.size} common mocks`);
}

/**
 * Setup mocks for a specific test
 */
export async function setupTestMocks(
  page: Page,
  testId: string,
  config: MockConfig = {},
): Promise<void> {
  console.log(`[GlobalMocks] Setting up mocks for test: ${testId}`);

  // Configure error simulation for this test
  unifiedMockManager.configureErrorSimulation(testId, {
    enableNetworkErrors: config.enableNetworkErrors || false,
    enableTimeoutErrors: config.enableTimeoutErrors || false,
    mockDelay: config.mockDelay || 0,
  });

  // Wait for async operations to complete
  await unifiedMockManager.waitForAsyncOperations(page, testId, 5000);

  console.log(`[GlobalMocks] Test setup complete for: ${testId}`);
}

/**
 * Cleanup mocks after a test
 */
export async function cleanupTestMocks(page: Page, testId: string): Promise<void> {
  console.log(`[GlobalMocks] Cleaning up mocks for test: ${testId}`);

  // Clear test-specific mock configurations
  clearTestMocks();

  // Cleanup page routes
  await unifiedMockManager.cleanupPageRoutes(page, testId);

  console.log(`[GlobalMocks] Test cleanup complete for: ${testId}`);
}

/**
 * Global cleanup for all mocks
 */
export async function globalCleanupMocks(): Promise<void> {
  console.log('[GlobalMocks] Starting global cleanup...');

  mockRegistry.clear();
  await unifiedMockManager.globalCleanup();

  console.log('[GlobalMocks] Global cleanup complete');
}

/**
 * Create a reusable mock factory function
 */
export function createMockFactory<T>(defaults: T) {
  return (overrides?: Partial<T>): T => {
    return { ...defaults, ...overrides };
  };
}

/**
 * Mock factories for common entities
 */
export const mockFactories = {
  project: createMockFactory({
    id: 'test-project',
    title: 'Test Project',
    idea: 'A test project for E2E validation',
    chapters: [],
    createdAt: new Date().toISOString(),
  }),

  chapter: createMockFactory({
    id: 'test-chapter',
    title: 'Test Chapter',
    content: 'This is test chapter content.',
    status: 'draft',
  }),

  character: createMockFactory({
    id: 'test-character',
    name: 'Test Character',
    role: 'Protagonist',
    description: 'A test character for E2E validation',
  }),

  aiResponse: createMockFactory({
    id: 'chatcmpl-test',
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
  }),
};

/**
 * Track mock usage statistics
 */
export const mockStats = {
  totalMocks: 0,
  usedMocks: new Set<string>(),

  recordUsage(key: string): void {
    this.usedMocks.add(key);
    this.totalMocks++;
  },

  getStats() {
    return {
      total: this.totalMocks,
      uniqueUsed: this.usedMocks.size,
      used: Array.from(this.usedMocks),
    };
  },

  reset(): void {
    this.totalMocks = 0;
    this.usedMocks.clear();
  },
};

export default {
  setupGlobalMocks,
  setupTestMocks,
  cleanupTestMocks,
  globalCleanupMocks,
  getMock,
  setTestMock,
  clearTestMocks,
  createMockFactory,
  mockFactories,
  mockStats,
};
