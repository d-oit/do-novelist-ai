import { ChapterVersion, Branch, VersionDiff, VersionCompareResult } from '../types';
import { Chapter } from '../../../types';
import { createChapter } from '../../../shared/utils';

class VersioningService {
  private static instance: VersioningService;
      private dbName = 'novelist-versioning';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  static getInstance(): VersioningService {
    if (!VersioningService.instance) {
      VersioningService.instance = new VersioningService();
    }
    return VersioningService.instance;
  }

  async init(): Promise<void> {
    return new Promise((resolve, _reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => _reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
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

  async saveVersion(
    chapter: Chapter, 
    message?: string, 
    type: ChapterVersion['type'] = 'manual'
  ): Promise<ChapterVersion> {
    if (!this.db) await this.init();
    
    const version: ChapterVersion = {
      id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chapterId: chapter.id,
      title: chapter.title,
      summary: chapter.summary,
      content: chapter.content,
      status: chapter.status,
      timestamp: new Date(),
      authorName: 'Current User', // TODO: Get from user context
      message: message || this.generateAutoMessage(type, chapter),
      type,
      contentHash: await this.generateContentHash(chapter.content),
      wordCount: this.countWords(chapter.content),
      charCount: chapter.content.length,
    };

    return new Promise((resolve, _reject) => {
      const transaction = this.db!.transaction(['versions'], 'readwrite');
      const store = transaction.objectStore('versions');
      const request = store.add(version);
      
      request.onsuccess = () => resolve(version);
      request.onerror = () => _reject(request.error);
    });
  }

  async getVersionHistory(chapterId: string): Promise<ChapterVersion[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, _reject) => {
      const transaction = this.db!.transaction(['versions'], 'readonly');
      const store = transaction.objectStore('versions');
      const index = store.index('chapterId');
      const request = index.getAll(chapterId);
      
      request.onsuccess = () => {
        const versions = request.result.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        resolve(versions);
      };
      request.onerror = () => _reject(request.error);
    });
  }

  async restoreVersion(versionId: string): Promise<Chapter | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, _reject) => {
      const transaction = this.db!.transaction(['versions'], 'readonly');
      const store = transaction.objectStore('versions');
      const request = store.get(versionId);
      
      request.onsuccess = () => {
        const version = request.result as ChapterVersion;
        if (version) {
          const chapter = createChapter({
            id: version.chapterId,
            title: version.title,
            summary: version.summary,
            content: version.content,
            status: version.status,
            orderIndex: 0 // Will be set by caller
          });
          resolve(chapter);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => _reject(request.error);
    });
  }

  async deleteVersion(versionId: string): Promise<boolean> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, _reject) => {
      const transaction = this.db!.transaction(['versions'], 'readwrite');
      const store = transaction.objectStore('versions');
      const request = store.delete(versionId);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        console.error('Failed to delete version:', request.error);
        resolve(false);
      };
    });
  }

  async compareVersions(versionId1: string, versionId2: string): Promise<VersionCompareResult> {
    const [version1, version2] = await Promise.all([
      this.getVersion(versionId1),
      this.getVersion(versionId2)
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

  async createBranch(name: string, description: string, parentVersionId: string): Promise<Branch> {
    if (!this.db) await this.init();
    
    const branch: Branch = {
      id: `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      parentVersionId,
      createdAt: new Date(),
      isActive: false,
      color: this.generateBranchColor(),
    };

    return new Promise((resolve, _reject) => {
      const transaction = this.db!.transaction(['branches'], 'readwrite');
      const store = transaction.objectStore('branches');
      const request = store.add(branch);
      
      request.onsuccess = () => resolve(branch);
      request.onerror = () => _reject(request.error);
    });
  }

  async getBranches(chapterId: string): Promise<Branch[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, _reject) => {
      const transaction = this.db!.transaction(['branches'], 'readonly');
      const store = transaction.objectStore('branches');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const branches = request.result.filter(b => b.chapterId === chapterId);
        resolve(branches);
      };
      request.onerror = () => _reject(request.error);
    });
  }

  async switchBranch(_branchId: string): Promise<boolean> {
    // Implementation for switching branches
    return true;
  }

  async mergeBranch(_sourceBranchId: string, _targetBranchId: string): Promise<boolean> {
    // Implementation for merging branches
    return true;
  }

  async deleteBranch(branchId: string): Promise<boolean> {
    if (!this.db) await this.init();

    return new Promise((resolve, _reject) => {
      const transaction = this.db!.transaction(['branches'], 'readwrite');
      const store = transaction.objectStore('branches');
      const request = store.delete(branchId);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  }

  async exportVersionHistory(chapterId: string, format: 'json' | 'csv'): Promise<string> {
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
        v.charCount.toString()
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  private async getVersion(versionId: string): Promise<ChapterVersion | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, _reject) => {
      const transaction = this.db!.transaction(['versions'], 'readonly');
      const store = transaction.objectStore('versions');
      const request = store.get(versionId);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => _reject(request.error);
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
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
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
      '#3B82F6', '#8B5CF6', '#EC4899', '#10B981',
      '#F59E0B', '#EF4444', '#06B6D4', '#84CC16'
    ];
    return colors[Math.floor(Math.random() * colors.length)] as string;
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