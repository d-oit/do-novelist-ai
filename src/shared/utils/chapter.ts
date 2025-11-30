/**
 * Chapter creation utilities
 * Provides helper functions to create Chapter objects with all required fields
 */

import { Chapter, ChapterStatus } from '../types';

/**
 * Creates a complete Chapter object with all required properties
 *
 * @param partial - Partial chapter data to merge with defaults
 * @returns A complete Chapter object with all required fields
 *
 * @example
 * ```ts
 * const chapter = createChapter({
 *   id: 'proj_123_ch_1',
 *   orderIndex: 1,
 *   title: 'Chapter 1',
 *   summary: 'The beginning',
 *   content: 'Once upon a time...'
 * });
 * ```
 */
export function createChapter(
  partial: Partial<Chapter> & Pick<Chapter, 'id' | 'orderIndex' | 'title'>
): Chapter {
  const now = new Date();

  return {
    // Required fields from partial
    id: partial.id,
    orderIndex: partial.orderIndex,
    title: partial.title,

    // Optional fields with defaults
    summary: partial.summary ?? '',
    content: partial.content ?? '',
    status: partial.status ?? ChapterStatus.PENDING,
    illustration: partial.illustration,

    // Metadata with defaults
    wordCount: partial.wordCount ?? 0,
    characterCount: partial.characterCount ?? 0,
    estimatedReadingTime: partial.estimatedReadingTime ?? 0,
    tags: partial.tags ?? [],
    notes: partial.notes ?? '',

    // Timestamps
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,

    // AI generation metadata (optional)
    generationPrompt: partial.generationPrompt,
    aiModel: partial.aiModel,
    generationSettings: partial.generationSettings,

    // Extended metadata (optional)
    plotPoints: partial.plotPoints,
    characters: partial.characters,
    locations: partial.locations,
    scenes: partial.scenes,
  };
}

/**
 * Updates an existing Chapter object with new data while updating the timestamp
 *
 * @param existing - The existing Chapter object
 * @param updates - Partial chapter data to update
 * @returns A new Chapter object with updated fields
 */
export function updateChapter(existing: Chapter, updates: Partial<Chapter>): Chapter {
  return {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  };
}

/**
 * Calculates word count from chapter content
 *
 * @param content - The chapter content
 * @returns The word count
 */
export function calculateWordCount(content: string): number {
  if (!content || content.trim().length === 0) {
    return 0;
  }
  return content.trim().split(/\s+/).length;
}

/**
 * Calculates character count from chapter content
 *
 * @param content - The chapter content
 * @returns The character count (excluding whitespace)
 */
export function calculateCharacterCount(content: string): number {
  return content.replace(/\s/g, '').length;
}

/**
 * Estimates reading time in minutes based on average reading speed (200 WPM)
 *
 * @param wordCount - The word count
 * @returns The estimated reading time in minutes
 */
export function calculateEstimatedReadingTime(wordCount: number): number {
  const wordsPerMinute = 200;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Updates chapter metrics (wordCount, characterCount, estimatedReadingTime) based on content
 *
 * @param chapter - The chapter to update
 * @returns A new Chapter object with updated metrics
 */
export function updateChapterMetrics(chapter: Chapter): Chapter {
  const wordCount = calculateWordCount(chapter.content);
  const characterCount = calculateCharacterCount(chapter.content);
  const estimatedReadingTime = calculateEstimatedReadingTime(wordCount);

  return {
    ...chapter,
    wordCount,
    characterCount,
    estimatedReadingTime,
    updatedAt: new Date(),
  };
}
