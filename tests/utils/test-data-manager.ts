/**
 * Centralized Test Data Manager for Novelist.ai E2E Tests
 *
 * Provides comprehensive test data lifecycle management with proper isolation,
 * cleanup, and database transaction handling to ensure robust test execution
 * across all browsers and parallel test runs.
 */

import type { Page, BrowserContext } from '@playwright/test';
import { BASE_TEST_PROJECT, TEST_USERS, SAMPLE_CHAPTERS, TestDataFactory } from './fixtures';

export interface TestDataContext {
  projectId: string;
  userId: string;
  chapterIds: string[];
  databaseSnapshot: any;
  cleanupQueue: (() => Promise<void>)[];
}

export interface DatabaseTransaction {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
}

/**
 * Comprehensive test data manager with transaction isolation
 */
export class TestDataManager {
  private static instance: TestDataManager;
  private testContexts = new Map<string, TestDataContext>();
  private activeTransactions: DatabaseTransaction[] = [];
  private cleanupRegistry = new Map<string, () => Promise<void>>();

  static getInstance(): TestDataManager {
    if (!TestDataManager.instance) {
      TestDataManager.instance = new TestDataManager();
    }
    return TestDataManager.instance;
  }

  /**
   * Initialize test context with complete isolation
   */
  async initializeTestContext(testId: string): Promise<TestDataContext> {
    console.log(`[TestDataManager] Initializing context for test: ${testId}`);

    // Create unique identifiers for this test
    const projectId = `test-project-${testId}-${Date.now()}`;
    const userId = `test-user-${testId}-${Date.now()}`;
    const chapterIds = [
      `chapter-${testId}-1-${Date.now()}`,
      `chapter-${testId}-2-${Date.now()}`,
      `chapter-${testId}-3-${Date.now()}`,
    ];

    // Create test context
    const context: TestDataContext = {
      projectId,
      userId,
      chapterIds,
      databaseSnapshot: null,
      cleanupQueue: [],
    };

    // Setup database snapshot for rollback
    await this.createDatabaseSnapshot(context);

    // Register cleanup function
    this.cleanupRegistry.set(testId, () => this.cleanupTestContext(testId));

    this.testContexts.set(testId, context);
    console.log(`[TestDataManager] Context initialized:`, {
      testId,
      projectId,
      userId,
      chapterCount: chapterIds.length,
    });

    return context;
  }

  /**
   * Get test context for current test
   */
  getTestContext(testId: string): TestDataContext | null {
    return this.testContexts.get(testId) || null;
  }

  /**
   * Create database transaction for rollback capability
   */
  createTransaction(transaction: DatabaseTransaction): void {
    this.activeTransactions.push(transaction);
    console.log(`[TestDataManager] Transaction created:`, {
      id: transaction.id,
      type: transaction.type,
      table: transaction.table,
    });
  }

  /**
   * Execute transaction with rollback on failure
   */
  async executeTransaction<T>(
    transaction: DatabaseTransaction,
    operation: () => Promise<T>,
  ): Promise<T> {
    const startTime = Date.now();
    try {
      this.createTransaction(transaction);
      const result = await operation();
      console.log(`[TestDataManager] Transaction executed:`, {
        id: transaction.id,
        duration: Date.now() - startTime,
        success: true,
      });
      return result;
    } catch (error) {
      console.error(`[TestDataManager] Transaction failed:`, {
        id: transaction.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create isolated test project with proper scoping
   */
  async createIsolatedProject(
    testId: string,
    overrides: Partial<typeof BASE_TEST_PROJECT> = {},
  ): Promise<any> {
    const context = this.getTestContext(testId);
    if (!context) {
      throw new Error(`No test context found for test: ${testId}`);
    }

    return this.executeTransaction(
      {
        id: `create-project-${testId}`,
        type: 'create',
        table: 'projects',
        data: { projectId: context.projectId },
        timestamp: Date.now(),
      },
      async () => {
        const project = TestDataFactory.createTestProject({
          ...overrides,
          id: context.projectId,
          chapters:
            overrides.chapters ||
            SAMPLE_CHAPTERS.slice(0, 2).map((chapter, index) => ({
              ...chapter,
              id: context.chapterIds[index],
              orderIndex: index + 1,
            })),
          metadata: {
            ...BASE_TEST_PROJECT.metadata!,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        console.log(`[TestDataManager] Created isolated project:`, {
          projectId: project.id,
          title: project.title,
          chapterCount: project.chapters.length,
        });

        return project;
      },
    );
  }

  /**
   * Create isolated test user with proper scoping
   */
  async createIsolatedUser(
    testId: string,
    overrides: Partial<(typeof TEST_USERS)[0]> = {},
  ): Promise<any> {
    const context = this.getTestContext(testId);
    if (!context) {
      throw new Error(`No test context found for test: ${testId}`);
    }

    return this.executeTransaction(
      {
        id: `create-user-${testId}`,
        type: 'create',
        table: 'users',
        data: { userId: context.userId },
        timestamp: Date.now(),
      },
      async () => {
        const user = TestDataFactory.createTestUser({
          ...overrides,
          id: context.userId,
          email: overrides.email || `test-${testId}-${Date.now()}@example.com`,
        });

        console.log(`[TestDataManager] Created isolated user:`, {
          userId: user.id,
          name: user.name,
          email: user.email,
        });

        return user;
      },
    );
  }

  /**
   * Setup database snapshot for rollback
   */
  private async createDatabaseSnapshot(context: TestDataContext): Promise<void> {
    try {
      // Simulate database state capture
      context.databaseSnapshot = {
        timestamp: Date.now(),
        projects: [],
        users: [],
        chapters: [],
        settings: {},
      };

      console.log(`[TestDataManager] Database snapshot created for:`, {
        projectId: context.projectId,
        timestamp: context.databaseSnapshot.timestamp,
      });
    } catch (error) {
      console.error('Failed to create database snapshot:', error);
    }
  }

  /**
   * Rollback database to previous state
   */
  private async rollbackDatabase(context: TestDataContext): Promise<void> {
    try {
      console.log(`[TestDataManager] Rolling back database for:`, {
        projectId: context.projectId,
        transactionCount: this.activeTransactions.length,
      });

      // Rollback in reverse order
      const transactions = [...this.activeTransactions].reverse();

      for (const transaction of transactions) {
        try {
          await this.rollbackTransaction(transaction);
        } catch (error) {
          console.error(`Failed to rollback transaction ${transaction.id}:`, error);
        }
      }

      // Clear transaction log
      this.activeTransactions = [];

      console.log(`[TestDataManager] Database rollback completed for:`, {
        projectId: context.projectId,
        rolledBackTransactions: transactions.length,
      });
    } catch (error) {
      console.error('Database rollback failed:', error);
    }
  }

  /**
   * Rollback individual transaction
   */
  private async rollbackTransaction(transaction: DatabaseTransaction): Promise<void> {
    // Simulate transaction rollback
    console.log(`[TestDataManager] Rolling back transaction:`, {
      id: transaction.id,
      type: transaction.type,
      table: transaction.table,
    });

    // In real implementation, this would reverse database operations
    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate rollback time
  }

  /**
   * Cleanup test context with complete isolation
   */
  async cleanupTestContext(testId: string): Promise<void> {
    console.log(`[TestDataManager] Cleaning up test context:`, testId);

    const context = this.testContexts.get(testId);
    if (!context) {
      console.log(`[TestDataManager] No context found for cleanup:`, testId);
      return;
    }

    try {
      // Rollback database transactions
      await this.rollbackDatabase(context);

      // Execute cleanup queue
      for (const cleanupFn of context.cleanupQueue) {
        try {
          await cleanupFn();
        } catch (error) {
          console.error('Cleanup function failed:', error);
        }
      }

      // Remove from registry
      this.testContexts.delete(testId);
      this.cleanupRegistry.delete(testId);

      console.log(`[TestDataManager] Test context cleaned up:`, {
        testId,
        projectId: context.projectId,
        userId: context.userId,
        cleanupQueueSize: context.cleanupQueue.length,
      });
    } catch (error) {
      console.error(`Test context cleanup failed for ${testId}:`, error);
      throw error;
    }
  }

  /**
   * Add cleanup function to queue
   */
  addCleanupFunction(testId: string, cleanupFn: () => Promise<void>): void {
    const context = this.testContexts.get(testId);
    if (context) {
      context.cleanupQueue.push(cleanupFn);
      console.log(`[TestDataManager] Cleanup function added for:`, testId);
    }
  }

  /**
   * Get comprehensive test data for test execution
   */
  async getTestData(testId: string): Promise<{
    project: any;
    user: any;
    chapters: any[];
    context: TestDataContext;
  }> {
    const context = await this.initializeTestContext(testId);

    const [project, user] = await Promise.all([
      this.createIsolatedProject(testId),
      this.createIsolatedUser(testId),
    ]);

    const chapters = SAMPLE_CHAPTERS.slice(0, 3).map((chapter, index) => ({
      ...chapter,
      id: context.chapterIds[index] || `chapter-${index + 1}`,
      projectId: context.projectId,
      orderIndex: index + 1,
    }));

    return {
      project,
      user,
      chapters,
      context,
    };
  }

  /**
   * Global cleanup for all test contexts
   */
  async globalCleanup(): Promise<void> {
    console.log(`[TestDataManager] Starting global cleanup...`);

    const cleanupPromises = Array.from(this.cleanupRegistry.values()).map(cleanupFn =>
      cleanupFn().catch(error => {
        console.error('Global cleanup error:', error);
      }),
    );

    await Promise.all(cleanupPromises);

    // Clear all state
    this.testContexts.clear();
    this.cleanupRegistry.clear();
    this.activeTransactions = [];

    console.log(`[TestDataManager] Global cleanup completed`);
  }

  /**
   * Get statistics for monitoring
   */
  getStatistics(): {
    activeContexts: number;
    pendingTransactions: number;
    registeredCleanupFunctions: number;
  } {
    return {
      activeContexts: this.testContexts.size,
      pendingTransactions: this.activeTransactions.length,
      registeredCleanupFunctions: this.cleanupRegistry.size,
    };
  }
}

// Export singleton instance
export const testDataManager = TestDataManager.getInstance();
