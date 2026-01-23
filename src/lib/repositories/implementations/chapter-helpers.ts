/**
 * Chapter Helper Functions
 * Utility functions for chapter operations
 */

import type { Chapter, ChapterStatus } from '@/types';

/**
 * Map database row to Chapter entity
 */
export function mapRowToChapter(row: unknown): Chapter {
  const r = row as {
    id: string;
    project_id: string;
    order_index: number;
    title: string;
    summary: string | null;
    content: string;
    status: string;
    word_count?: number;
    character_count?: number;
    estimated_reading_time?: number;
    tags?: string;
    notes?: string | null;
    created_at: string;
    updated_at: string;
    generation_prompt?: string | null;
    ai_model?: string | null;
  };

  return {
    id: r.id,
    projectId: r.project_id,
    orderIndex: r.order_index,
    title: r.title,
    summary: r.summary ?? '',
    content: r.content ?? '',
    status: r.status as ChapterStatus,
    wordCount: r.word_count ?? 0,
    characterCount: r.character_count ?? 0,
    estimatedReadingTime: r.estimated_reading_time ?? 0,
    tags: r.tags ? JSON.parse(r.tags) : [],
    notes: r.notes ?? '',
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
    generationPrompt: r.generation_prompt ?? undefined,
    aiModel: r.ai_model ?? undefined,
    generationSettings: undefined,
    illustration: undefined,
    plotPoints: undefined,
    characters: undefined,
    locations: undefined,
    scenes: undefined,
  };
}

/**
 * Generate chapter ID
 */
export function generateChapterId(): string {
  return `chap_${Date.now()}`;
}

/**
 * Calculate word count from content
 */
export function calculateWordCount(content: string): number {
  return content.length;
}

/**
 * Calculate estimated reading time (250 words per minute)
 */
export function calculateReadingTime(wordCount: number): number {
  return Math.ceil(wordCount / 250);
}

/**
 * Validate chapter status
 */
export function isValidChapterStatus(status: string): status is ChapterStatus {
  const validStatuses = ['pending', 'drafting', 'review', 'complete'];
  return validStatuses.includes(status as ChapterStatus);
}

/**
 * Get default chapter status
 */
export function getDefaultChapterStatus(): ChapterStatus {
  return 'pending' as ChapterStatus;
}

/**
 * Validate chapter order index is non-negative
 */
export function isValidOrderIndex(index: number): boolean {
  return index >= 0 && Number.isInteger(index);
}

/**
 * Generate update data object from partial chapter data
 */
export function buildChapterUpdateData(data: Partial<Chapter>): Record<string, unknown> {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.summary !== undefined) updateData.summary = data.summary;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.status !== undefined) updateData.status = data.status;

  return updateData;
}

/**
 * Generate chapter creation data
 */
export interface ChapterCreationData {
  id: string;
  orderIndex: number;
  title: string;
  summary: string;
  content: string;
  status: ChapterStatus;
}

export function buildChapterCreationData(
  chapterId: string,
  orderIndex: number,
  title: string,
  summary: string,
  content: string,
  status: ChapterStatus,
): ChapterCreationData {
  return {
    id: chapterId,
    orderIndex,
    title,
    summary,
    content,
    status,
  };
}

/**
 * Get max order index query result
 */
export type MaxOrderIndexResult = {
  maxOrderIndex: number | null;
};

/**
 * Count result type
 */
export type CountResult = {
  count: number;
};
