/**
 * Versioning Service for Turso Database
 * Handles chapter versions and branches using Drizzle ORM
 */
import { eq, desc } from 'drizzle-orm';

import type { ChapterVersion, Branch } from '@/features/versioning/types';
import { getDrizzleClient } from '@/lib/database/drizzle';
import {
  chapterVersions,
  branches,
  type ChapterVersionRow,
  type NewChapterVersionRow,
  type BranchRow,
  type NewBranchRow,
} from '@/lib/database/schemas';
import { logger } from '@/lib/logging/logger';
import { generateSecureId } from '@/lib/secure-random';
import type { ChapterStatus } from '@/types';

class VersioningService {
  private static instance: VersioningService;

  public static getInstance(): VersioningService {
    VersioningService.instance ??= new VersioningService();
    return VersioningService.instance;
  }

  private getUserName(): string {
    try {
      const settings = JSON.parse(localStorage.getItem('novelist_settings') ?? '{}') as Record<
        string,
        unknown
      >;
      const userName = (settings.userName as string) ?? (settings.authorName as string);
      return userName ?? 'Anonymous User';
    } catch {
      return 'Anonymous User';
    }
  }

  public async init(): Promise<void> {
    logger.info('Versioning service initialized', { component: 'VersioningService' });
  }

  // ==================== Mappers ====================

  private mapRowToChapterVersion(row: ChapterVersionRow): ChapterVersion {
    return {
      id: row.id,
      chapterId: row.chapterId,
      title: row.title,
      summary: row.summary || '',
      content: row.content,
      status: (row.status as ChapterStatus) || 'draft',
      timestamp: new Date(row.createdAt),
      authorName: row.authorName,
      message: row.message || '',
      type: row.type as ChapterVersion['type'],
      contentHash: row.contentHash || '',
      wordCount: row.wordCount || 0,
      charCount: row.charCount || 0,
      versionNumber: row.versionNumber,
    };
  }

  private mapRowToBranch(row: BranchRow): Branch {
    return {
      id: row.id,
      chapterId: row.chapterId || '',
      name: row.name,
      description: row.description || '',
      parentVersionId: row.parentVersionId || '',
      createdAt: new Date(row.createdAt),
      isActive: row.isActive || false,
      color: row.color || '#3b82f6', // Default blue
    };
  }

  // ==================== Chapter Versions ====================

  public async saveVersion(
    chapterId: string,
    content: string,
    title: string,
    message?: string,
    branchId?: string,
    type: ChapterVersion['type'] = 'manual',
    summary?: string,
    status?: ChapterStatus,
  ): Promise<ChapterVersion> {
    const db = getDrizzleClient();
    if (!db) throw new Error('Database not configured');

    try {
      // Get current version count for this chapter
      const existingVersions = await db
        .select({ id: chapterVersions.id })
        .from(chapterVersions)
        .where(eq(chapterVersions.chapterId, chapterId));

      const versionNumber = existingVersions.length + 1;
      const id = generateSecureId();

      const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
      const charCount = content.length;
      const contentHash = await this.generateSimpleHash(content);

      const lastVersionId =
        existingVersions.length > 0 ? existingVersions[existingVersions.length - 1]?.id : null;

      const newVersion: NewChapterVersionRow = {
        id,
        chapterId,
        versionNumber,
        content,
        title,
        summary: summary || null,
        status: status || null,
        message: message || null,
        authorName: this.getUserName(),
        type,
        contentHash,
        wordCount,
        charCount,
        branchId: branchId || null,
        parentVersionId: lastVersionId || null,
        createdAt: new Date().toISOString(),
      };

      await db.insert(chapterVersions).values(newVersion);

      logger.info('Version saved', { component: 'VersioningService', chapterId, versionNumber });

      return this.mapRowToChapterVersion(newVersion as ChapterVersionRow);
    } catch (error) {
      logger.error('Failed to save version', { component: 'VersioningService' }, error as Error);
      throw error;
    }
  }

  private async generateSimpleHash(content: string): Promise<string> {
    // Simple hash for content identification
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  public async getVersionsByChapterId(chapterId: string): Promise<ChapterVersion[]> {
    const db = getDrizzleClient();
    if (!db) return [];

    try {
      const rows = await db
        .select()
        .from(chapterVersions)
        .where(eq(chapterVersions.chapterId, chapterId))
        .orderBy(desc(chapterVersions.createdAt));

      return rows.map(row => this.mapRowToChapterVersion(row));
    } catch (error) {
      logger.error('Failed to get versions', { component: 'VersioningService' }, error as Error);
      return [];
    }
  }

  public async getVersionById(versionId: string): Promise<ChapterVersion | null> {
    const db = getDrizzleClient();
    if (!db) return null;

    try {
      const rows = await db.select().from(chapterVersions).where(eq(chapterVersions.id, versionId));

      if (rows.length === 0 || !rows[0]) return null;

      return this.mapRowToChapterVersion(rows[0]);
    } catch (error) {
      logger.error('Failed to get version', { component: 'VersioningService' }, error as Error);
      return null;
    }
  }

  public async deleteVersion(versionId: string): Promise<void> {
    const db = getDrizzleClient();
    if (!db) throw new Error('Database not configured');

    try {
      await db.delete(chapterVersions).where(eq(chapterVersions.id, versionId));
      logger.info('Version deleted', { component: 'VersioningService', versionId });
    } catch (error) {
      logger.error('Failed to delete version', { component: 'VersioningService' }, error as Error);
      throw error;
    }
  }

  // ==================== Branches ====================

  public async createBranch(
    projectId: string,
    name: string,
    chapterId?: string,
    description?: string,
    parentVersionId?: string,
    color: string = '#3b82f6',
    createdFrom?: string,
  ): Promise<Branch> {
    const db = getDrizzleClient();
    if (!db) throw new Error('Database not configured');

    try {
      const id = generateSecureId();
      const now = new Date().toISOString();

      const newBranch: NewBranchRow = {
        id,
        projectId,
        chapterId: chapterId || null,
        name,
        description: description || null,
        isActive: false,
        parentVersionId: parentVersionId || null,
        color: color,
        createdFrom: createdFrom || null,
        createdBy: this.getUserName(),
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(branches).values(newBranch);

      logger.info('Branch created', { component: 'VersioningService', branchId: id });

      return this.mapRowToBranch(newBranch as BranchRow);
    } catch (error) {
      logger.error('Failed to create branch', { component: 'VersioningService' }, error as Error);
      throw error;
    }
  }

  public async getBranchesByProjectId(projectId: string): Promise<Branch[]> {
    const db = getDrizzleClient();
    if (!db) return [];

    try {
      const rows = await db.select().from(branches).where(eq(branches.projectId, projectId));

      return rows.map(row => this.mapRowToBranch(row));
    } catch (error) {
      logger.error('Failed to get branches', { component: 'VersioningService' }, error as Error);
      return [];
    }
  }

  public async setActiveBranch(projectId: string, branchId: string): Promise<void> {
    const db = getDrizzleClient();
    if (!db) throw new Error('Database not configured');

    try {
      // Deactivate all branches for the project
      await db.update(branches).set({ isActive: false }).where(eq(branches.projectId, projectId));

      // Activate the selected branch
      await db.update(branches).set({ isActive: true }).where(eq(branches.id, branchId));

      logger.info('Active branch set', { component: 'VersioningService', branchId });
    } catch (error) {
      logger.error(
        'Failed to set active branch',
        { component: 'VersioningService' },
        error as Error,
      );
      throw error;
    }
  }

  public async deleteBranch(branchId: string): Promise<void> {
    const db = getDrizzleClient();
    if (!db) throw new Error('Database not configured');

    try {
      await db.delete(branches).where(eq(branches.id, branchId));
      logger.info('Branch deleted', { component: 'VersioningService', branchId });
    } catch (error) {
      logger.error('Failed to delete branch', { component: 'VersioningService' }, error as Error);
      throw error;
    }
  }
}

export const versioningService = VersioningService.getInstance();
