/**
 * Database Transaction Manager for Test Data Isolation
 *
 * Provides transaction-based database isolation for E2E tests to ensure
 * complete data separation between test runs and prevent interference.
 */

import type { Page } from '@playwright/test';
import { randomBytes } from 'crypto';

/**
 * Generate a cryptographically secure random string
 */
function generateSecureId(): string {
  return randomBytes(4).toString('hex');
}

export interface DatabaseTransaction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ';
  table: string;
  query: string;
  parameters?: any[];
  result?: any;
  timestamp: number;
  rollbackData?: any;
}

export interface DatabaseState {
  timestamp: number;
  tables: Map<string, any[]>;
  indexes: Map<string, any>;
  constraints: Map<string, any>;
}

export interface TransactionContext {
  id: string;
  transactions: DatabaseTransaction[];
  state: DatabaseState;
  rollbackStack: DatabaseTransaction[];
}

/**
 * Database Transaction Manager for E2E Test Isolation
 */
export class DatabaseTransactionManager {
  private static instance: DatabaseTransactionManager;
  private contexts = new Map<string, TransactionContext>();
  private isInitialized = false;

  static getInstance(): DatabaseTransactionManager {
    if (!DatabaseTransactionManager.instance) {
      DatabaseTransactionManager.instance = new DatabaseTransactionManager();
    }
    return DatabaseTransactionManager.instance;
  }

  /**
   * Initialize transaction manager
   */
  async initialize(page: Page): Promise<void> {
    if (this.isInitialized) {
      console.log('[DBTransaction] Already initialized');
      return;
    }

    console.log('[DBTransaction] Initializing database transaction manager...');

    // Setup database mocking and transaction tracking
    await page.addInitScript(() => {
      // Setup global database transaction tracking
      (window as any).__DB_TRANSACTIONS__ = [];
      (window as any).__DB_CURRENT_CONTEXT__ = null;
      (window as any).__DB_MOCK_ENABLED__ = true;

      // Override IndexedDB operations for transaction tracking
      const originalOpen = indexedDB.open.bind(indexedDB);
      indexedDB.open = function (name: string, version?: number) {
        const request = originalOpen(name, version);

        request.addEventListener('success', () => {
          const db = request.result;
          const originalTransaction = db.transaction.bind(db);

          db.transaction = function (stores: string | string[], mode?: IDBTransactionMode) {
            const transaction = originalTransaction(stores, mode);

            // Track transaction start
            (window as any).__DB_TRANSACTIONS__.push({
              id: `txn-${Date.now()}-${generateSecureId()}`,
              type: 'TRANSACTION_START',
              stores: Array.isArray(stores) ? stores : [stores],
              mode: mode || 'readonly',
              timestamp: Date.now(),
            });

            return transaction;
          };

          return db;
        });

        return request;
      };

      console.log('[DBTransaction] Database transaction tracking enabled');
    });

    this.isInitialized = true;
    console.log('[DBTransaction] Initialization complete');
  }

  /**
   * Begin transaction context for a test
   */
  async beginTransactionContext(testId: string): Promise<void> {
    console.log(`[DBTransaction] Beginning transaction context for: ${testId}`);

    const context: TransactionContext = {
      id: testId,
      transactions: [],
      state: {
        timestamp: Date.now(),
        tables: new Map(),
        indexes: new Map(),
        constraints: new Map(),
      },
      rollbackStack: [],
    };

    this.contexts.set(testId, context);
    console.log(`[DBTransaction] Transaction context created: ${testId}`);
  }

  /**
   * Record database transaction
   */
  recordTransaction(testId: string, transaction: Omit<DatabaseTransaction, 'timestamp'>): void {
    const context = this.contexts.get(testId);
    if (!context) {
      console.warn(`[DBTransaction] No context found for test: ${testId}`);
      return;
    }

    const fullTransaction: DatabaseTransaction = {
      ...transaction,
      timestamp: Date.now(),
    };

    context.transactions.push(fullTransaction);
    console.log(`[DBTransaction] Transaction recorded:`, {
      testId,
      id: fullTransaction.id,
      type: fullTransaction.type,
      table: fullTransaction.table,
    });
  }

  /**
   * Create test data with transaction tracking
   */
  async createTestData(testId: string, table: string, data: any[]): Promise<string[]> {
    const context = this.contexts.get(testId);
    if (!context) {
      throw new Error(`No transaction context found for test: ${testId}`);
    }

    console.log(`[DBTransaction] Creating test data:`, {
      testId,
      table,
      recordCount: data.length,
    });

    const ids: string[] = [];

    for (const record of data) {
      const id = `${table}-${testId}-${Date.now()}-${generateSecureId()}`;

      // Record CREATE transaction
      this.recordTransaction(testId, {
        id,
        type: 'CREATE',
        table,
        query: `INSERT INTO ${table} (id, data) VALUES (?, ?)`,
        parameters: [id, JSON.stringify(record)],
        rollbackData: { id, table, action: 'DELETE' },
      });

      // Store in mock database state
      if (!context.state.tables.has(table)) {
        context.state.tables.set(table, []);
      }
      context.state.tables.get(table)!.push({ id, ...record });

      ids.push(id);
    }

    console.log(`[DBTransaction] Test data created:`, {
      testId,
      table,
      createdIds: ids.length,
    });

    return ids;
  }

  /**
   * Read test data with transaction tracking
   */
  async readTestData(
    testId: string,
    table: string,
    filter?: { field: string; value: any },
  ): Promise<any[]> {
    const context = this.contexts.get(testId);
    if (!context) {
      throw new Error(`No transaction context found for test: ${testId}`);
    }

    // Record READ transaction
    this.recordTransaction(testId, {
      id: `read-${Date.now()}-${generateSecureId()}`,
      type: 'READ',
      table,
      query: filter ? `SELECT * FROM ${table} WHERE ${filter.field} = ?` : `SELECT * FROM ${table}`,
      parameters: filter ? [filter.value] : [],
    });

    // Retrieve from mock database state
    const tableData = context.state.tables.get(table) || [];

    if (filter) {
      return tableData.filter(record => record[filter.field] === filter.value);
    }

    return [...tableData]; // Return copy to prevent mutation
  }

  /**
   * Update test data with transaction tracking
   */
  async updateTestData(testId: string, table: string, id: string, updates: any): Promise<void> {
    const context = this.contexts.get(testId);
    if (!context) {
      throw new Error(`No transaction context found for test: ${testId}`);
    }

    const tableData = context.state.tables.get(table) || [];
    const record = tableData.find(r => r.id === id);

    if (!record) {
      throw new Error(`Record not found: ${table}.${id}`);
    }

    // Store original data for rollback
    const originalData = { ...record };

    // Apply updates
    Object.assign(record, updates);

    // Record UPDATE transaction
    this.recordTransaction(testId, {
      id: `update-${Date.now()}-${generateSecureId()}`,
      type: 'UPDATE',
      table,
      query: `UPDATE ${table} SET data = ? WHERE id = ?`,
      parameters: [JSON.stringify(record), id],
      rollbackData: { id, table, originalData, action: 'RESTORE' },
    });

    console.log(`[DBTransaction] Test data updated:`, {
      testId,
      table,
      id,
      updates,
    });
  }

  /**
   * Delete test data with transaction tracking
   */
  async deleteTestData(testId: string, table: string, id: string): Promise<void> {
    const context = this.contexts.get(testId);
    if (!context) {
      throw new Error(`No transaction context found for test: ${testId}`);
    }

    const tableData = context.state.tables.get(table) || [];
    const recordIndex = tableData.findIndex(r => r.id === id);

    if (recordIndex === -1) {
      console.warn(`[DBTransaction] Record not found for deletion: ${table}.${id}`);
      return;
    }

    const [deletedRecord] = tableData.splice(recordIndex, 1);

    // Record DELETE transaction
    this.recordTransaction(testId, {
      id: `delete-${Date.now()}-${generateSecureId()}`,
      type: 'DELETE',
      table,
      query: `DELETE FROM ${table} WHERE id = ?`,
      parameters: [id],
      rollbackData: { id, table, deletedRecord, action: 'RESTORE' },
    });

    console.log(`[DBTransaction] Test data deleted:`, {
      testId,
      table,
      id,
    });
  }

  /**
   * Rollback all transactions in context
   */
  async rollbackTransactions(testId: string): Promise<void> {
    const context = this.contexts.get(testId);
    if (!context) {
      console.warn(`[DBTransaction] No context found for rollback: ${testId}`);
      return;
    }

    console.log(`[DBTransaction] Rolling back transactions:`, {
      testId,
      transactionCount: context.transactions.length,
    });

    // Rollback in reverse order
    const transactions = [...context.transactions].reverse();

    for (const transaction of transactions) {
      try {
        await this.rollbackSingleTransaction(testId, transaction);
      } catch (error) {
        console.error(`[DBTransaction] Failed to rollback transaction ${transaction.id}:`, error);
      }
    }

    console.log(`[DBTransaction] Rollback completed: ${testId}`);
  }

  /**
   * Rollback single transaction
   */
  private async rollbackSingleTransaction(
    testId: string,
    transaction: DatabaseTransaction,
  ): Promise<void> {
    const context = this.contexts.get(testId);
    if (!context || !transaction.rollbackData) {
      return;
    }

    const { action } = transaction.rollbackData;

    switch (action) {
      case 'DELETE':
        // Restore deleted record
        if (transaction.rollbackData.deletedRecord) {
          if (!context.state.tables.has(transaction.table)) {
            context.state.tables.set(transaction.table, []);
          }
          context.state.tables.get(transaction.table)!.push(transaction.rollbackData.deletedRecord);
        }
        break;

      case 'RESTORE':
        // Restore original data for UPDATE/DELETE
        if (transaction.rollbackData.originalData || transaction.rollbackData.deletedRecord) {
          const data =
            transaction.rollbackData.originalData || transaction.rollbackData.deletedRecord;
          if (!context.state.tables.has(transaction.table)) {
            context.state.tables.set(transaction.table, []);
          }

          const tableData = context.state.tables.get(transaction.table)!;
          const existingIndex = tableData.findIndex(r => r.id === transaction.rollbackData.id);

          if (existingIndex >= 0) {
            tableData[existingIndex] = data;
          } else {
            tableData.push(data);
          }
        }
        break;
    }

    console.log(`[DBTransaction] Transaction rolled back:`, {
      testId,
      transactionId: transaction.id,
      action,
    });
  }

  /**
   * End transaction context and cleanup
   */
  async endTransactionContext(testId: string): Promise<void> {
    console.log(`[DBTransaction] Ending transaction context: ${testId}`);

    const context = this.contexts.get(testId);
    if (!context) {
      console.warn(`[DBTransaction] No context found for cleanup: ${testId}`);
      return;
    }

    try {
      // Rollback all transactions
      await this.rollbackTransactions(testId);

      // Clear context
      this.contexts.delete(testId);

      console.log(`[DBTransaction] Transaction context ended: ${testId}`);
    } catch (error) {
      console.error(`[DBTransaction] Failed to end transaction context ${testId}:`, error);
      throw error;
    }
  }

  /**
   * Get transaction statistics
   */
  getTransactionStatistics(testId?: string): {
    contextCount: number;
    totalTransactions: number;
    contextDetails?: any;
  } {
    if (testId) {
      const context = this.contexts.get(testId);
      return {
        contextCount: this.contexts.size,
        totalTransactions: context?.transactions.length || 0,
        contextDetails: context
          ? {
              id: context.id,
              transactionCount: context.transactions.length,
              tableCount: context.state.tables.size,
              startTime: context.state.timestamp,
            }
          : null,
      };
    }

    return {
      contextCount: this.contexts.size,
      totalTransactions: Array.from(this.contexts.values()).reduce(
        (sum, ctx) => sum + ctx.transactions.length,
        0,
      ),
    };
  }

  /**
   * Global cleanup for all contexts
   */
  async globalCleanup(): Promise<void> {
    console.log('[DBTransaction] Starting global cleanup...');

    const cleanupPromises = Array.from(this.contexts.keys()).map(testId =>
      this.endTransactionContext(testId).catch(error => {
        console.error(`[DBTransaction] Global cleanup error for ${testId}:`, error);
      }),
    );

    await Promise.all(cleanupPromises);
    this.contexts.clear();

    console.log('[DBTransaction] Global cleanup completed');
  }
}

// Export singleton instance
export const dbTransactionManager = DatabaseTransactionManager.getInstance();
