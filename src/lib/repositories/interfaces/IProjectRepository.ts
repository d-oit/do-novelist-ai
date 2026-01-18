/**
 * Project Repository Interface
 *
 * Extends the generic repository with project-specific query methods
 */
import type { Project, PublishStatus } from '@/types';

import { type IRepository } from './IRepository';

/**
 * Project-specific query options
 */
export interface ProjectQueryOptions {
  status?: PublishStatus;
  style?: Project['style'];
  language?: Project['language'];
  minTargetWordCount?: number;
  maxTargetWordCount?: number;
  hasChapters?: boolean;
  searchQuery?: string;
}

/**
 * Project-specific statistics
 */
export interface ProjectStats {
  totalProjects: number;
  projectsByStatus: Record<PublishStatus, number>;
  totalWordCount: number;
  averageWordCount: number;
}

/**
 * Project repository interface with project-specific methods
 */
export interface IProjectRepository extends IRepository<Project> {
  /**
   * Find projects by status
   * @param status - The publish status
   * @returns Array of projects with matching status
   */
  findByStatus(status: PublishStatus): Promise<Project[]>;

  /**
   * Find projects by style
   * @param style - The writing style
   * @returns Array of projects with matching style
   */
  findByStyle(style: Project['style']): Promise<Project[]>;

  /**
   * Find projects by language
   * @param language - The project language
   * @returns Array of projects with matching language
   */
  findByLanguage(language: Project['language']): Promise<Project[]>;

  /**
   * Find projects with complex query options
   * @param options - Query options
   * @returns Array of matching projects
   */
  findByQuery(options: ProjectQueryOptions): Promise<Project[]>;

  /**
   * Get project summary (minimal data for list views)
   * @returns Array of project summaries
   */
  getSummaries(): Promise<
    Array<{
      id: string;
      title: string;
      style: string;
      status: PublishStatus;
      language: Project['language'];
      targetWordCount: number;
      updatedAt: string;
      coverImage?: string;
    }>
  >;

  /**
   * Get project statistics
   * @returns Project statistics
   */
  getStats(): Promise<ProjectStats>;

  /**
   * Check if project title exists (for uniqueness validation)
   * @param title - The project title
   * @param excludeId - ID to exclude from check (for updates)
   * @returns true if title exists, false otherwise
   */
  titleExists(title: string, excludeId?: string): Promise<boolean>;
}
