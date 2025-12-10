/**
 * Unified Mocking Manager for Novelist.ai E2E Tests
 *
 * Resolves conflicts between MSW, AI Gateway, and browser routing mocking strategies
 * by providing a single, coordinated approach to external service mocking.
 */

import type { Page, Route } from '@playwright/test';
import { setupAISDKMock } from './mock-ai-sdk';
import { randomBytes } from 'crypto';

/**
 * Generate a cryptographically secure random number between 0 and 1
 */
function secureRandom(): number {
  return randomBytes(4).readUInt32BE(0) / 4294967296;
}

export interface MockConfig {
  enableNetworkErrors?: boolean;
  enableTimeoutErrors?: boolean;
  mockDelay?: number;
  enableDatabaseMocking?: boolean;
  enableCacheClearing?: boolean;
}

export interface MockEndpoint {
  pattern: string;
  handler: (route: Route) => Promise<void>;
  priority: number; // Higher priority = more specific match
}

/**
 * Unified Mocking Manager that coordinates all mocking strategies
 */
export class UnifiedMockManager {
  private static instance: UnifiedMockManager;
  private pageRoutes: Map<string, Route[]> = new Map();
  private mockConfigs: Map<string, MockConfig> = new Map();
  private endpoints: MockEndpoint[] = [];
  private isInitialized = false;

  static getInstance(): UnifiedMockManager {
    if (!UnifiedMockManager.instance) {
      UnifiedMockManager.instance = new UnifiedMockManager();
    }
    return UnifiedMockManager.instance;
  }

  /**
   * Initialize unified mocking for a page
   */
  async initializePage(page: Page, testId: string, config: MockConfig = {}): Promise<void> {
    if (this.isInitialized) {
      console.log('[UnifiedMock] Already initialized, skipping');
      return;
    }

    console.log(`[UnifiedMock] Initializing for test: ${testId}`);

    // Store config for this test
    this.mockConfigs.set(testId, {
      enableNetworkErrors: false,
      enableTimeoutErrors: false,
      mockDelay: 0,
      enableDatabaseMocking: true,
      enableCacheClearing: true,
      ...config,
    });

    try {
      // Step 1: Initialize AI SDK logger FIRST (prevents logger errors)
      await setupAISDKMock(page);
      console.log('[UnifiedMock] AI SDK mock initialized');

      // Step 2: Setup unified endpoint routing
      await this.setupUnifiedRouting(page, testId);

      // Step 3: Configure browser-specific optimizations
      await this.configureBrowserOptimization(page);

      // Step 4: Setup async operation handling
      await this.setupAsyncHandling(page);

      this.isInitialized = true;
      console.log('[UnifiedMock] Initialization complete');
    } catch (error) {
      console.error('[UnifiedMock] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup unified routing that handles all external service calls
   */
  private async setupUnifiedRouting(page: Page, testId: string): Promise<void> {
    const config = this.mockConfigs.get(testId);
    if (!config) throw new Error(`No config found for test: ${testId}`);

    // Define all endpoints in priority order (most specific first)
    this.endpoints = [
      // AI Gateway endpoints (highest priority)
      {
        pattern: '**/v1/chat/completions',
        priority: 100,
        handler: this.handleAIChatCompletions.bind(this, testId),
      },
      {
        pattern: '**/v1/images/generations',
        priority: 90,
        handler: this.handleImageGeneration.bind(this, testId),
      },

      // Database/API endpoints
      {
        pattern: '**/api/ai/brainstorm',
        priority: 80,
        handler: this.handleBrainstormAPI.bind(this, testId),
      },
      {
        pattern: '**/api/ai/generate',
        priority: 70,
        handler: this.handleGenerateAPI.bind(this, testId),
      },

      // Mock database endpoints
      {
        pattern: '**/api/db/projects/**',
        priority: 60,
        handler: this.handleDatabaseOperations.bind(this, testId),
      },
      {
        pattern: '**/api/db/chapters/**',
        priority: 50,
        handler: this.handleDatabaseOperations.bind(this, testId),
      },

      // Static asset endpoints (lowest priority)
      {
        pattern: '**/*.js',
        priority: 10,
        handler: this.handleStaticAssets.bind(this, testId),
      },
      {
        pattern: '**/*.css',
        priority: 10,
        handler: this.handleStaticAssets.bind(this, testId),
      },
    ];

    // Register all endpoints with Playwright
    for (const endpoint of this.endpoints.sort((a, b) => b.priority - a.priority)) {
      await page.route(endpoint.pattern, endpoint.handler);
      console.log(
        `[UnifiedMock] Route registered: ${endpoint.pattern} (priority: ${endpoint.priority})`,
      );
    }
  }

  /**
   * Handle AI chat completions with intelligent response matching
   */
  private async handleAIChatCompletions(testId: string, route: Route): Promise<void> {
    const config = this.mockConfigs.get(testId);
    const request = route.request();
    const postData = request.postDataJSON();
    const userMessage = postData?.messages?.[postData.messages.length - 1]?.content || '';

    let mockContent = 'This is a unified mock response for testing purposes.';

    // Intelligent content matching for different AI operations
    if (userMessage.toLowerCase().includes('character')) {
      mockContent = `Character Development Analysis:

**Name:** Test Character
**Role:** Protagonist
**Background:** Test character for E2E validation
**Traits:** 
- Analytical thinking
- Strong moral compass
- Hidden vulnerabilities

**Character Arc:**
The character grows from uncertainty to confidence through trials and challenges.`;
    } else if (
      userMessage.toLowerCase().includes('dialogue') ||
      userMessage.toLowerCase().includes('polish')
    ) {
      mockContent = `"I understand your concern," she said thoughtfully.

"Every story needs conflict to be meaningful," he replied.

"Then let's create a story worth telling."`;
    } else if (
      userMessage.toLowerCase().includes('draft') ||
      userMessage.toLowerCase().includes('write') ||
      userMessage.toLowerCase().includes('story')
    ) {
      mockContent = `Chapter: The Beginning

The morning sun cast long shadows across the cobblestone streets as Elena walked toward the library. Today marked the start of her greatest adventure yet - the research that would either confirm her theories or shatter them completely.

As she pushed through the heavy wooden doors, the familiar scent of old books and knowledge embraced her. The librarian nodded in greeting, unaware that Elena was about to uncover secrets that would change everything.`;
    }

    // Apply delay if configured
    if (config?.mockDelay) {
      await new Promise(resolve => setTimeout(resolve, config.mockDelay));
    }

    // Simulate network error if enabled
    if (config?.enableNetworkErrors && secureRandom() < 0.1) {
      await route.abort('internetdisconnected');
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: `chatcmpl-unified-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'mistral-medium-latest',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: mockContent,
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 200,
          total_tokens: 250,
        },
      }),
    });
  }

  /**
   * Handle image generation requests
   */
  private async handleImageGeneration(testId: string, route: Route): Promise<void> {
    const config = this.mockConfigs.get(testId);

    // Use 1x1 transparent PNG for fast mock
    const transparentPNG =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    if (config?.mockDelay) {
      await new Promise(resolve => setTimeout(resolve, config.mockDelay));
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        created: Math.floor(Date.now() / 1000),
        data: [
          {
            url: transparentPNG,
          },
        ],
      }),
    });
  }

  /**
   * Handle brainstorm API requests
   */
  private async handleBrainstormAPI(_testId: string, route: Route): Promise<void> {
    const request = route.request();
    const postData = request.postDataJSON();
    const { context, field } = postData || {};

    let mockContent = 'Mock brainstorming response for testing purposes.';

    if (field === 'title') {
      mockContent = 'Test Novel Title - A Story Worth Telling';
    } else if (field === 'style') {
      mockContent = 'Literary Fiction with elements of mystery';
    } else if (context) {
      mockContent = `Enhanced concept based on: ${context.substring(0, 100)}...`;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ text: mockContent }),
    });
  }

  /**
   * Handle generate API requests
   */
  private async handleGenerateAPI(_testId: string, route: Route): Promise<void> {
    const request = route.request();
    const postData = request.postDataJSON();

    const mockResponse = {
      id: `gen-unified-${Date.now()}`,
      object: 'text_completion',
      created: Math.floor(Date.now() / 1000),
      model: postData?.model || 'mistral-medium-latest',
      choices: [
        {
          index: 0,
          text: 'Mocked AI generation response for testing purposes.',
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 25,
        completion_tokens: 100,
        total_tokens: 125,
      },
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockResponse),
    });
  }

  /**
   * Handle database operations with transaction isolation
   */
  private async handleDatabaseOperations(_testId: string, route: Route): Promise<void> {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    // Mock database responses based on operation type
    let responseData: any = {};
    let statusCode = 200;

    try {
      if (method === 'GET') {
        // Mock GET operations
        if (url.pathname.includes('/projects/')) {
          responseData = {
            id: 'project-test',
            title: 'Test Project',
            idea: 'A test project for E2E validation',
            chapters: [],
            createdAt: new Date().toISOString(),
          };
        } else if (url.pathname.includes('/chapters/')) {
          responseData = {
            id: 'chapter-test',
            title: 'Test Chapter',
            content: 'This is test chapter content.',
            status: 'draft',
          };
        }
      } else if (method === 'POST') {
        // Mock POST operations
        const postData = request.postDataJSON();
        responseData = {
          id: `post-${Date.now()}`,
          ...postData,
          createdAt: new Date().toISOString(),
        };
      } else if (method === 'PUT') {
        // Mock PUT operations
        const postData = request.postDataJSON();
        responseData = {
          ...postData,
          updatedAt: new Date().toISOString(),
        };
      } else if (method === 'DELETE') {
        // Mock DELETE operations
        statusCode = 204;
        responseData = null;
      }

      // Add simulated delay for realistic behavior
      await new Promise(resolve => setTimeout(resolve, 50));

      if (statusCode === 204) {
        await route.fulfill({ status: statusCode });
      } else {
        await route.fulfill({
          status: statusCode,
          contentType: 'application/json',
          body: JSON.stringify(responseData),
        });
      }

      console.log(`[UnifiedMock] Database operation: ${method} ${url.pathname} (${statusCode})`);
    } catch (error) {
      console.error('[UnifiedMock] Database operation failed:', error);
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Mock database error' }),
      });
    }
  }

  /**
   * Handle static assets (pass through)
   */
  private async handleStaticAssets(_testId: string, route: Route): Promise<void> {
    // Let static assets pass through to real server
    await route.fulfill();
  }

  /**
   * Configure browser-specific optimizations
   */
  private async configureBrowserOptimization(page: Page): Promise<void> {
    const browserName = page.context().browser()?.browserType().name() || 'chromium';

    // Browser-specific configurations
    switch (browserName.toLowerCase()) {
      case 'firefox':
        await page.context().addInitScript(() => {
          // Firefox-specific optimizations
          (window as any).browserName = 'firefox';
          // Disable Firefox features that might interfere with tests
          document.documentElement.style.setProperty('--firefox-timeout-multiplier', '1.5');
        });
        break;
      case 'webkit':
        await page.context().addInitScript(() => {
          // WebKit-specific optimizations
          (window as any).browserName = 'webkit';
        });
        break;
      default:
        // Chromium optimizations
        await page.context().addInitScript(() => {
          (window as any).browserName = 'chromium';
        });
    }

    console.log(`[UnifiedMock] Browser optimization applied for: ${browserName}`);
  }

  /**
   * Setup async operation handling to prevent race conditions
   */
  private async setupAsyncHandling(page: Page): Promise<void> {
    await page.addInitScript(() => {
      // Setup async operation tracking
      (window as any).__testAsyncOperations = new Set<string>();
      (window as any).__testOperationCounter = 0;

      // Override fetch to track async operations
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const operationId = `op-${++(window as any).__testOperationCounter}`;
        (window as any).__testAsyncOperations.add(operationId);

        try {
          const response = await originalFetch(...args);
          return response;
        } finally {
          // Clean up after a short delay
          setTimeout(() => {
            (window as any).__testAsyncOperations.delete(operationId);
          }, 100);
        }
      };

      console.log('[UnifiedMock] Async operation tracking enabled');
    });
  }

  /**
   * Wait for all async operations to complete
   */
  async waitForAsyncOperations(page: Page, _testId: string, timeout: number = 5000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const asyncOps = await page.evaluate(() => {
        return (window as any).__testAsyncOperations?.size || 0;
      });

      if (asyncOps === 0) {
        console.log('[UnifiedMock] All async operations completed');
        return;
      }

      await page.waitForTimeout(100);
    }

    console.warn(
      `[UnifiedMock] Timeout waiting for async operations. Remaining: ${await page.evaluate(() => (window as any).__testAsyncOperations?.size || 0)}`,
    );
  }

  /**
   * Configure error simulation for testing error handling
   */
  configureErrorSimulation(testId: string, config: Partial<MockConfig>): void {
    const currentConfig = this.mockConfigs.get(testId) || {};
    this.mockConfigs.set(testId, { ...currentConfig, ...config });
    console.log(`[UnifiedMock] Error simulation configured for ${testId}:`, config);
  }

  /**
   * Cleanup all routes for a page
   */
  async cleanupPageRoutes(page: Page, testId: string): Promise<void> {
    try {
      // Remove all registered routes
      await page.unroute('**/*');

      // Clear configuration
      this.mockConfigs.delete(testId);
      this.endpoints = [];

      console.log(`[UnifiedMock] Routes cleaned up for test: ${testId}`);
    } catch (error) {
      console.error('[UnifiedMock] Cleanup failed:', error);
    }
  }

  /**
   * Global cleanup for all mocks
   */
  async globalCleanup(): Promise<void> {
    console.log('[UnifiedMock] Starting global cleanup...');

    this.mockConfigs.clear();
    this.endpoints = [];
    this.pageRoutes.clear();
    this.isInitialized = false;

    console.log('[UnifiedMock] Global cleanup completed');
  }

  /**
   * Get mock statistics for monitoring
   */
  getStatistics(): {
    initializedTests: number;
    configuredEndpoints: number;
    activeConfigs: number;
  } {
    return {
      initializedTests: this.mockConfigs.size,
      configuredEndpoints: this.endpoints.length,
      activeConfigs: Array.from(this.mockConfigs.values()).length,
    };
  }
}

// Export singleton instance
export const unifiedMockManager = UnifiedMockManager.getInstance();
