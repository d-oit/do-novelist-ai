import { logger } from '@/lib/logging/logger';
import type { Chapter, ChapterVersion, Branch, VersionDiff, VersionCompareResult  } from '@/types';

import { createChapter } from '@shared/utils';

class VersioningService {
  private static instance: VersioningService;
  private readonly dbName = 'novelist-versioning';
  private readonly dbVersion = 1;
  private db: IDBDatabase | null = null;

  public static getInstance(): VersioningService {
    VersioningService.instance ??= new VersioningService();
    return VersioningService.instance;
  }

  /**
   * Get the current user's name from settings or default
   */
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
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
      request.onsuccess = (): void => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent): void => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create versions store
        if (!db.objectStoreNames.contains('versions')) {
          const versionStore = db.createObjectStore('versions', { keyPath: 'id' });
          versionStore.createIndex('chapterId', 'chapterId');
          versionStore.createIndex('timestamp', 'timestamp');
          versionStore.createIndex('type', 'type');
        }

        // Create branches store
        if (!db.objectStoreNames.contains('branches')) {
          const branchStore = db.createObjectStore('branches', { keyPath: 'id' });
          branchStore.createIndex('chapterId', 'chapterId');
          branchStore.createIndex('isActive', 'isActive');
        }
      };
    });
  }

  public async saveVersion(
    chapter: Chapter,
    message?: string,
    type: ChapterVersion['type'] = 'manual',
  ): Promise<ChapterVersion> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const db = this.db;
    const version: ChapterVersion = {
      id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chapterId: chapter.id,
      title: chapter.title,
      summary: chapter.summary,
      content: chapter.content,
      status: chapter.status,
      timestamp: new Date(),
      authorName: this.getUserName(),
      message: message ?? this.generateAutoMessage(type, chapter),
      type,
      contentHash: await this.generateContentHash(chapter.content),
      wordCount: this.countWords(chapter.content),
      charCount: chapter.content.length,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['versions'], 'readwrite');
      const store = transaction.objectStore('versions');
      const request = store.add(version);

      request.onsuccess = (): void => resolve(version);
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }

  public async getVersionHistory(chapterId: string): Promise<ChapterVersion[]> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['versions'], 'readonly');
      const store = transaction.objectStore('versions');
      const index = store.index('chapterId');
      const request = index.getAll(chapterId);

      request.onsuccess = (): void => {
        const versions = (request.result as ChapterVersion[]).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
        resolve(versions);
      };
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }

  public async restoreVersion(versionId: string): Promise<Chapter | null> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['versions'], 'readonly');
      const store = transaction.objectStore('versions');
      const request = store.get(versionId);

      request.onsuccess = (): void => {
        const version = request.result as ChapterVersion;
        if (version != null) {
          const chapter = createChapter({
            id: version.chapterId,
            title: version.title,
            summary: version.summary,
            content: version.content,
            status: version.status,
            orderIndex: 0, // Will be set by caller
          });
          resolve(chapter);
        } else {
          resolve(null);
        }
      };
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }

  public async deleteVersion(versionId: string): Promise<boolean> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const db = this.db;
    // Check if version exists first
    const version = await this.getVersion(versionId);
    if (!version) {
      return false;
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['versions'], 'readwrite');
      const store = transaction.objectStore('versions');
      const request = store.delete(versionId);

      request.onsuccess = (): void => resolve(true);
      request.onerror = (): void => {
        console.error('Failed to delete version:', request.error);
        reject(new Error(request.error?.message ?? 'Failed to delete version'));
      };
    });
  }

  public async compareVersions(
    versionId1: string,
    versionId2: string,
  ): Promise<VersionCompareResult> {
    const [version1, version2] = await Promise.all([
      this.getVersion(versionId1),
      this.getVersion(versionId2),
    ]);

    if (!version1 || !version2) {
      throw new Error('One or both versions not found');
    }

    const diffs = this.computeDiffs(version1.content, version2.content);
    const wordCountChange = version2.wordCount - version1.wordCount;
    const charCountChange = version2.charCount - version1.charCount;

    const additionsCount = diffs.filter(d => d.type === 'addition').length;
    const deletionsCount = diffs.filter(d => d.type === 'deletion').length;
    const modificationsCount = diffs.filter(d => d.type === 'modification').length;

    return {
      diffs,
      wordCountChange,
      charCountChange,
      additionsCount,
      deletionsCount,
      modificationsCount,
    };
  }

  public async createBranch(
    chapterId: string,
    name: string,
    description: string,
    parentVersionId: string,
  ): Promise<Branch> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const db = this.db;
    const branch: Branch = {
      id: `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chapterId,
      name,
      description,
      parentVersionId,
      createdAt: new Date(),
      isActive: false,
      color: this.generateBranchColor(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['branches'], 'readwrite');
      const store = transaction.objectStore('branches');
      const request = store.add(branch);

      request.onsuccess = (): void => resolve(branch);
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }

  public async getBranches(chapterId: string): Promise<Branch[]> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['branches'], 'readonly');
      const store = transaction.objectStore('branches');
      const request = store.getAll();

      request.onsuccess = (): void => {
        const branches = (request.result as Branch[]).filter(b => b.chapterId === chapterId);
        resolve(branches);
      };
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }

  public switchBranch(branchId: string): boolean {
    // Implementation for switching branches
    logger.info(`Switching to branch: ${branchId}`);
    return true;
  }

  public mergeBranch(sourceBranchId: string, targetBranchId: string): boolean {
    // Implementation for merging branches
    logger.info(`Merging branch ${sourceBranchId} into ${targetBranchId}`);
    return true;
  }

  public async deleteBranch(branchId: string): Promise<boolean> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    logger.info(`Deleting branch: ${branchId}`);

    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['branches'], 'readwrite');
      const store = transaction.objectStore('branches');
      const request = store.delete(branchId);

      request.onsuccess = (): void => resolve(true);
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Failed to delete branch'));
    });
  }

  public async exportVersionHistory(chapterId: string, format: 'json' | 'csv'): Promise<string> {
    const versions = await this.getVersionHistory(chapterId);

    if (format === 'json') {
      return JSON.stringify(versions, null, 2);
    } else {
      const headers = ['ID', 'Timestamp', 'Author', 'Message', 'Type', 'Word Count', 'Char Count'];
      const rows = versions.map(v => [
        v.id,
        v.timestamp.toISOString(),
        v.authorName,
        v.message,
        v.type,
        v.wordCount.toString(),
        v.charCount.toString(),
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  private async getVersion(versionId: string): Promise<ChapterVersion | null> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['versions'], 'readonly');
      const store = transaction.objectStore('versions');
      const request = store.get(versionId);

      request.onsuccess = (): void => resolve((request.result as ChapterVersion | null) ?? null);
      request.onerror = (): void =>
        reject(new Error(request.error?.message ?? 'Database operation failed'));
    });
  }

  private async generateContentHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private countWords(content: string): number {
    return content
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }

  private generateAutoMessage(type: ChapterVersion['type'], chapter: Chapter): string {
    switch (type) {
      case 'auto':
        return `Auto-saved: ${chapter.title}`;
      case 'ai-generated':
        return `AI generated content for: ${chapter.title}`;
      case 'restore':
        return `Restored version of: ${chapter.title}`;
      default:
        return `Manual save: ${chapter.title}`;
    }
  }

  private generateBranchColor(): string {
    const colors = [
      '#3B82F6',
      '#8B5CF6',
      '#EC4899',
      '#10B981',
      '#F59E0B',
      '#EF4444',
      '#06B6D4',
      '#84CC16',
    ];
    return colors[Math.floor(Math.random() * colors.length)] ?? '#3B82F6';
  }

  private computeDiffs(content1: string, content2: string): VersionDiff[] {
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');
    const diffs: VersionDiff[] = [];

    // Simple line-by-line diff algorithm
    const maxLines = Math.max(lines1.length, lines2.length);

    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i];
      const line2 = lines2[i];

      if (line1 === undefined && line2 !== undefined) {
        diffs.push({
          type: 'addition',
          lineNumber: i + 1,
          newContent: line2,
          context: this.getLineContext(lines2, i),
        });
      } else if (line1 !== undefined && line2 === undefined) {
        diffs.push({
          type: 'deletion',
          lineNumber: i + 1,
          oldContent: line1,
          context: this.getLineContext(lines1, i),
        });
      } else if (line1 !== line2) {
        diffs.push({
          type: 'modification',
          lineNumber: i + 1,
          oldContent: line1,
          newContent: line2,
          context: this.getLineContext(lines2, i),
        });
      }
    }

    return diffs;
  }

  private getLineContext(lines: string[], index: number): string {
    const start = Math.max(0, index - 1);
    const end = Math.min(lines.length, index + 2);
    return lines.slice(start, end).join('\n');
  }
}

export const versioningService = VersioningService.getInstance();
