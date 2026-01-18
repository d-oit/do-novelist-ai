/**
 * Chapter Repository Interface
 *
 * Extends the generic repository with chapter-specific query methods
 */
import type { Chapter, ChapterStatus } from '@/types';

import { type IRepository } from './IRepository';

/**
 * Chapter query options
 */
export interface ChapterQueryOptions {
  projectId?: string;
  status?: ChapterStatus;
  minWordCount?: number;
  maxWordCount?: number;
  searchQuery?: string;
  orderBy?: 'orderIndex' | 'title' | 'wordCount' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
}

/**
 * Chapter repository interface with chapter-specific methods
 */
export interface IChapterRepository extends IRepository<Chapter> {
  /**
   * Find all chapters for a project
   * @param projectId - The project ID
   * @returns Array of chapters ordered by orderIndex
   */
  findByProjectId(projectId: string): Promise<Chapter[]>;

  /**
   * Find chapters by status
   * @param status - The chapter status
   * @returns Array of chapters with matching status
   */
  findByStatus(status: ChapterStatus): Promise<Chapter[]>;

  /**
   * Find chapters for a project with specific status
   * @param projectId - The project ID
   * @param status - The chapter status
   * @returns Array of matching chapters
   */
  findByProjectIdAndStatus(projectId: string, status: ChapterStatus): Promise<Chapter[]>;

  /**
   * Find a chapter by its order index within a project
   * @param projectId - The project ID
   * @param orderIndex - The order index
   * @returns The chapter if found, null otherwise
   */
  findByOrderIndex(projectId: string, orderIndex: number): Promise<Chapter | null>;

  /**
   * Get the next chapter in a project
   * @param projectId - The project ID
   * @param currentOrderIndex - The current chapter's order index
   * @returns The next chapter if exists, null otherwise
   */
  getNextChapter(projectId: string, currentOrderIndex: number): Promise<Chapter | null>;

  /**
   * Get the previous chapter in a project
   * @param projectId - The project ID
   * @param currentOrderIndex - The current chapter's order index
   * @returns The previous chapter if exists, null otherwise
   */
  getPreviousChapter(projectId: string, currentOrderIndex: number): Promise<Chapter | null>;

  /**
   * Find chapters with complex query options
   * @param options - Query options
   * @returns Array of matching chapters
   */
  findByQuery(options: ChapterQueryOptions): Promise<Chapter[]>;

  /**
   * Reorder chapters in a project
   * @param projectId - The project ID
   * @param chapterIds - Array of chapter IDs in new order
   * @returns Array of updated chapters
   */
  reorderChapters(projectId: string, chapterIds: string[]): Promise<Chapter[]>;

  /**
   * Get chapter count for a project
   * @param projectId - The project ID
   * @returns The number of chapters
   */
  countByProject(projectId: string): Promise<number>;

  /**
   * Get total word count for a project
   * @param projectId - The project ID
   * @returns The total word count
   */
  getTotalWordCount(projectId: string): Promise<number>;

  /**
   * Bulk update chapter order indices
   * @param chapters - Array of chapters with updated order indices
   * @returns Array of updated chapters
   */
  bulkUpdateOrder(chapters: Array<{ id: string; orderIndex: number }>): Promise<Chapter[]>;
}
