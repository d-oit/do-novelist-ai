/**
 * Chapter Types
 * Shared type definitions for chapter operations
 */

import type { ChapterStatus } from '@/types';

/**
 * Query options for chapter searches
 */
export interface ChapterQueryOptions {
  /** Filter by project ID */
  projectId?: string;
  /** Filter by status */
  status?: ChapterStatus;
  /** Minimum word count filter */
  minWordCount?: number;
  /** Maximum word count filter */
  maxWordCount?: number;
  /** Search in title, summary, or content */
  searchQuery?: string;
  /** Sort order: 'orderIndex', 'title', 'wordCount', or 'createdAt' */
  orderBy?: 'orderIndex' | 'title' | 'wordCount' | 'createdAt';
  /** Maximum number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Chapter order update data
 */
export interface ChapterOrderUpdate {
  /** Chapter ID */
  id: string;
  /** New order index */
  orderIndex: number;
  /** Optional project ID for filtering */
  projectId?: string;
}

/**
 * Chapter statistics
 */
export interface ChapterStats {
  /** Total chapters count */
  totalChapters: number;
  /** Chapters by status */
  byStatus: Record<ChapterStatus, number>;
  /** Total word count */
  totalWordCount: number;
  /** Average chapter length */
  averageChapterLength: number;
  /** Estimated reading time */
  estimatedReadingTime: number;
}

/**
 * Chapter creation options
 */
export interface ChapterCreateOptions {
  /** Project ID (required) */
  projectId: string;
  /** Chapter title */
  title: string;
  /** Order index (optional, auto-generated if not provided) */
  orderIndex?: number;
  /** Chapter summary */
  summary?: string;
  /** Chapter content */
  content?: string;
  /** Chapter status */
  status?: ChapterStatus;
}
