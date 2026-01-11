import { versioningService as tursoVersioningService } from '@/lib/database/services';
import { logger } from '@/lib/logging/logger';
import {
  type Chapter,
  type ChapterVersion,
  type Branch,
  type VersionDiff,
  type VersionCompareResult,
  ChapterStatus,
} from '@/types';

import { createChapter } from '@shared/utils';

class VersioningService {
  private static instance: VersioningService;

  public static getInstance(): VersioningService {
    VersioningService.instance ??= new VersioningService();
    return VersioningService.instance;
  }

  public async init(): Promise<void> {
    await tursoVersioningService.init();
  }

  public async saveVersion(
    chapter: Chapter,
    message?: string,
    type: ChapterVersion['type'] = 'manual',
  ): Promise<ChapterVersion> {
    const versionMessage = message ?? this.generateAutoMessage(type, chapter);
    
    // Delegate to Turso service
    return await tursoVersioningService.saveVersion(
      chapter.id,
      chapter.content,
      chapter.title,
      versionMessage,
      undefined, // branchId
      type,
      chapter.summary,
      chapter.status
    );
  }

  public async getVersionHistory(chapterId: string): Promise<ChapterVersion[]> {
    return await tursoVersioningService.getVersionsByChapterId(chapterId);
  }

  public async getVersion(versionId: string): Promise<ChapterVersion | null> {
    return await tursoVersioningService.getVersionById(versionId);
  }

  public async restoreVersion(versionId: string): Promise<Chapter | null> {
    const version = await tursoVersioningService.getVersionById(versionId);
    if (!version) return null;
    
    return createChapter({
      id: version.chapterId,
      title: version.title,
      summary: version.summary || '',
      content: version.content,
      status: ChapterStatus.PENDING,
      orderIndex: 0,
    });
  }

  public async deleteVersion(versionId: string): Promise<boolean> {
    try {
      await tursoVersioningService.deleteVersion(versionId);
      return true;
    } catch (err) {
      logger.error('Failed to delete version', { component: 'VersioningService', versionId, error: err });
      return false;
    }
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
    
    return {
      diffs,
      wordCountChange: version2.wordCount - version1.wordCount,
      charCountChange: version2.charCount - version1.charCount,
      additionsCount: diffs.filter(d => d.type === 'addition').length,
      deletionsCount: diffs.filter(d => d.type === 'deletion').length,
      modificationsCount: diffs.filter(d => d.type === 'modification').length,
    };
  }

  public async createBranch(
    chapterId: string,
    name: string,
    description: string,
    parentVersionId: string,
  ): Promise<Branch> {
    return await tursoVersioningService.createBranch(
      'default-project',
      name,
      chapterId,
      description,
      parentVersionId
    );
  }

  public async getBranches(chapterId: string): Promise<Branch[]> {
    const allBranches = await tursoVersioningService.getBranchesByProjectId('default-project');
    return allBranches.filter(b => b.chapterId === chapterId);
  }

  public switchBranch(branchId: string): boolean {
    logger.info(`Switching to branch: ${branchId}`);
    return true;
  }

  public mergeBranch(sourceBranchId: string, targetBranchId: string): boolean {
    logger.info(`Merging branch ${sourceBranchId} into ${targetBranchId}`);
    return true;
  }

  public async deleteBranch(branchId: string): Promise<boolean> {
    try {
      await tursoVersioningService.deleteBranch(branchId);
      return true;
    } catch (err) {
      logger.error('Failed to delete branch', { component: 'VersioningService', branchId, error: err });
      return false;
    }
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

  private computeDiffs(content1: string, content2: string): VersionDiff[] {
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');
    const diffs: VersionDiff[] = [];
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
