/**
 * Publishing Analytics Service for Turso Database
 * Handles publishing metrics, platform status, and export history using Drizzle ORM
 */
import { eq, desc, and } from 'drizzle-orm';

import { getDrizzleClient } from '@/lib/database/drizzle';
import { 
  publishingMetrics, 
  platformStatus, 
  exportHistory,
  type PublishingMetricRow,
  type PlatformStatusRow,
  type ExportHistoryRow
} from '@/lib/database/schemas';
import { logger } from '@/lib/logging/logger';
import { generateSecureId } from '@/lib/secure-random';

class PublishingService {
  public async init(): Promise<void> {
    logger.info('Publishing service initialized', { component: 'PublishingService' });
  }

  // ==================== Publishing Metrics ====================

  public async recordMetric(
    projectId: string,
    platform: string,
    metricType: string,
    value: number,
    unit?: string,
    period?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const db = getDrizzleClient();
    if (!db) throw new Error('Database not configured');

    try {
      const id = generateSecureId();
      const now = new Date().toISOString();

      await db.insert(publishingMetrics).values({
        id,
        projectId,
        platform,
        metricType,
        value,
        unit: unit || null,
        period: period || null,
        metadata: metadata || null,
        recordedAt: now,
        createdAt: now,
      });

      logger.info('Metric recorded', { component: 'PublishingService', projectId, metricType });
    } catch (error) {
      logger.error('Failed to record metric', { component: 'PublishingService' }, error as Error);
      throw error;
    }
  }

  public async getMetrics(
    projectId: string,
    platform?: string,
    metricType?: string,
  ): Promise<PublishingMetricRow[]> {
    const db = getDrizzleClient();
    if (!db) return [];

    try {
      const query = db
        .select()
        .from(publishingMetrics)
        .where(eq(publishingMetrics.projectId, projectId));

      const rows = await query.orderBy(desc(publishingMetrics.recordedAt));

      // Filter in memory if needed
      let filtered = rows;
      if (platform) {
        filtered = filtered.filter(row => row.platform === platform);
      }
      if (metricType) {
        filtered = filtered.filter(row => row.metricType === metricType);
      }

      return filtered;
    } catch (error) {
      logger.error('Failed to get metrics', { component: 'PublishingService' }, error as Error);
      return [];
    }
  }

  // ==================== Platform Status ====================

  public async updatePlatformStatus(
    projectId: string,
    platform: string,
    status: string,
    publishedUrl?: string,
    errorMessage?: string,
    configuration?: Record<string, unknown>,
    metrics?: { views?: number; downloads?: number; revenue?: number; rating?: number },
  ): Promise<void> {
    const db = getDrizzleClient();
    if (!db) throw new Error('Database not configured');

    try {
      const now = new Date().toISOString();

      // Check if platform status exists
      const existing = await db
        .select()
        .from(platformStatus)
        .where(and(eq(platformStatus.projectId, projectId), eq(platformStatus.platform, platform)));

      const firstExisting = existing[0];
      if (firstExisting) {
        // Update existing
        await db
          .update(platformStatus)
          .set({
            status,
            publishedUrl: publishedUrl || null,
            lastSyncedAt: now,
            errorMessage: errorMessage || null,
            configuration: configuration || null,
            metrics: metrics || null,
            updatedAt: now,
          })
          .where(eq(platformStatus.id, firstExisting.id));
      } else {
        // Create new
        const id = generateSecureId();
        await db.insert(platformStatus).values({
          id,
          projectId,
          platform,
          status,
          publishedUrl: publishedUrl || null,
          lastSyncedAt: now,
          errorMessage: errorMessage || null,
          configuration: configuration || null,
          metrics: metrics || null,
          createdAt: now,
          updatedAt: now,
        });
      }

      logger.info('Platform status updated', {
        component: 'PublishingService',
        projectId,
        platform,
      });
    } catch (error) {
      logger.error(
        'Failed to update platform status',
        { component: 'PublishingService' },
        error as Error,
      );
      throw error;
    }
  }

  public async getPlatformStatus(projectId: string, platform?: string): Promise<PlatformStatusRow[]> {
    const db = getDrizzleClient();
    if (!db) return [];

    try {
      let rows;
      if (platform) {
        rows = await db
          .select()
          .from(platformStatus)
          .where(
            and(eq(platformStatus.projectId, projectId), eq(platformStatus.platform, platform)),
          );
      } else {
        rows = await db
          .select()
          .from(platformStatus)
          .where(eq(platformStatus.projectId, projectId));
      }

      return rows;
    } catch (error) {
      logger.error(
        'Failed to get platform status',
        { component: 'PublishingService' },
        error as Error,
      );
      return [];
    }
  }

  // ==================== Export History ====================

  public async createExport(
    projectId: string,
    format: string,
    metadata?: Record<string, unknown>,
  ): Promise<string> {
    const db = getDrizzleClient();
    if (!db) throw new Error('Database not configured');

    try {
      const id = generateSecureId();
      const now = new Date().toISOString();

      await db.insert(exportHistory).values({
        id,
        projectId,
        format,
        status: 'pending',
        fileUrl: null,
        fileSize: null,
        errorMessage: null,
        metadata: metadata || null,
        createdAt: now,
        completedAt: null,
      });

      logger.info('Export created', { component: 'PublishingService', projectId, format });
      return id;
    } catch (error) {
      logger.error('Failed to create export', { component: 'PublishingService' }, error as Error);
      throw error;
    }
  }

  public async updateExport(
    exportId: string,
    status: string,
    fileUrl?: string,
    fileSize?: number,
    errorMessage?: string,
  ): Promise<void> {
    const db = getDrizzleClient();
    if (!db) throw new Error('Database not configured');

    try {
      const updates = { 
        status,
        fileUrl: fileUrl || undefined,
        fileSize: fileSize || undefined,
        errorMessage: errorMessage || undefined,
        completedAt: (status === 'completed' || status === 'failed') ? new Date().toISOString() : undefined,
      };

      await db.update(exportHistory).set(updates).where(eq(exportHistory.id, exportId));

      logger.info('Export updated', { component: 'PublishingService', exportId, status });
    } catch (error) {
      logger.error('Failed to update export', { component: 'PublishingService' }, error as Error);
      throw error;
    }
  }

  public async getExportHistory(projectId: string): Promise<ExportHistoryRow[]> {
    const db = getDrizzleClient();
    if (!db) return [];

    try {
      const rows = await db
        .select()
        .from(exportHistory)
        .where(eq(exportHistory.projectId, projectId))
        .orderBy(desc(exportHistory.createdAt));

      return rows;
    } catch (error) {
      logger.error(
        'Failed to get export history',
        { component: 'PublishingService' },
        error as Error,
      );
      return [];
    }
  }

  public async deleteExport(exportId: string): Promise<void> {
    const db = getDrizzleClient();
    if (!db) throw new Error('Database not configured');

    try {
      await db.delete(exportHistory).where(eq(exportHistory.id, exportId));
      logger.info('Export deleted', { component: 'PublishingService', exportId });
    } catch (error) {
      logger.error('Failed to delete export', { component: 'PublishingService' }, error as Error);
      throw error;
    }
  }
}

export const publishingService = new PublishingService();
