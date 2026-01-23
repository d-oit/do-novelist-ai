/**
 * Project Repository - Type Definitions
 *
 * Common type definitions used across the project repository modules
 */

import type { Project, PublishStatus } from '@/types';

/**
 * Project statistics for analytics
 */
export interface ProjectStats {
  totalProjects: number;
  projectsByStatus: Record<PublishStatus, number>;
  totalWordCount: number;
  averageWordCount: number;
}

/**
 * Project summary data type
 */
export type ProjectSummary = {
  id: string;
  title: string;
  style: string;
  status: PublishStatus;
  language: Project['language'];
  targetWordCount: number;
  updatedAt: string;
  coverImage?: string;
};

/**
 * Database row type for projects
 */
export type ProjectRow = {
  id: string;
  title: string;
  idea: string;
  style: string;
  coverImage: string | null;
  worldState: unknown;
  status: string;
  language: string;
  targetWordCount: number;
  settings: unknown;
  timeline: unknown;
  updatedAt: string;
};
