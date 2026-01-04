/**
 * Content Processor
 * Extracts and prepares text from different content types for embedding
 */

import type { VectorContent } from '@/types/embeddings';

/**
 * Minimum content length for embedding generation
 * Shorter content will be padded or skipped
 */
export const MIN_CONTENT_LENGTH = 10;

/**
 * Maximum content length before chunking
 * Text longer than this will be split into chunks
 */
export const MAX_CONTENT_LENGTH = 8000;

/**
 * Content source type
 */
export type ContentSourceType =
  | 'project'
  | 'chapter'
  | 'character'
  | 'world_building'
  | 'timeline'
  | 'version';

/**
 * Extracted content with metadata
 */
export interface ExtractedContent extends VectorContent {
  sourceType: ContentSourceType;
  originalText: string;
  metadata?: Record<string, unknown>;
}

/**
 * Remove special characters and normalize text
 */
function normalizeText(text: string): string {
  // Remove excessive whitespace
  let normalized = text.replace(/\s+/g, ' ').trim();

  // Remove special characters that might interfere with embeddings
  // But keep meaningful punctuation for semantic understanding
  normalized = normalized
    .replace(/[\x00-\x1F\x7F]/g, '') // Control characters
    .replace(/[\u2000-\u200F\u2028-\u202F\u205F-\u206F\uFEFF]/g, ''); // Unicode whitespace and control chars

  return normalized;
}

/**
 * Check if content is too short for meaningful embedding
 */
function isContentTooShort(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length < MIN_CONTENT_LENGTH;
}

/**
 * Check if content is empty or only whitespace
 */
function isContentEmpty(text: string): boolean {
  return text.trim().length === 0;
}

/**
 * Extract text from project for embedding
 */
export function extractFromProject(
  projectId: string,
  project: { title: string; idea: string; style?: string; language?: string },
): ExtractedContent[] {
  const contents: ExtractedContent[] = [];

  // Combine project metadata
  const metadataText = [project.title, project.idea, project.style, project.language]
    .filter(Boolean)
    .join('. ');

  if (!isContentEmpty(metadataText) && !isContentTooShort(metadataText)) {
    const normalized = normalizeText(metadataText);

    contents.push({
      projectId,
      entityType: 'project',
      entityId: projectId,
      content: normalized,
      sourceType: 'project',
      originalText: metadataText,
      metadata: {
        title: project.title,
        idea: project.idea,
        style: project.style,
        language: project.language,
      },
    });
  }

  return contents;
}

/**
 * Extract text from chapter for embedding
 */
export function extractFromChapter(
  projectId: string,
  chapter: { id: string; title: string; summary?: string; content?: string },
): ExtractedContent[] {
  const contents: ExtractedContent[] = [];

  // Use summary if available, otherwise use content
  const textToEmbed = chapter.summary ?? chapter.content ?? '';

  if (!isContentEmpty(textToEmbed) && !isContentTooShort(textToEmbed)) {
    // Combine title with content for better context
    const combinedText = `${chapter.title}. ${textToEmbed}`;
    const normalized = normalizeText(combinedText);

    contents.push({
      projectId,
      entityType: 'chapter',
      entityId: chapter.id,
      content: normalized,
      sourceType: 'chapter',
      originalText: textToEmbed,
      metadata: {
        title: chapter.title,
        hasSummary: !!chapter.summary,
        contentLength: textToEmbed.length,
      },
    });
  }

  return contents;
}

/**
 * Extract text from character for embedding
 */
export function extractFromCharacter(
  projectId: string,
  character: { id: string; name: string; description?: string; backstory?: string },
): ExtractedContent[] {
  const contents: ExtractedContent[] = [];

  // Combine character attributes
  const characterText = [character.name, character.description, character.backstory]
    .filter(Boolean)
    .join(' ');

  if (!isContentEmpty(characterText) && !isContentTooShort(characterText)) {
    const normalized = normalizeText(characterText);

    contents.push({
      projectId,
      entityType: 'character',
      entityId: character.id,
      content: normalized,
      sourceType: 'character',
      originalText: characterText,
      metadata: {
        name: character.name,
        hasDescription: !!character.description,
        hasBackstory: !!character.backstory,
      },
    });
  }

  return contents;
}

/**
 * Extract text from world-building element for embedding
 */
export function extractFromWorldBuilding(
  projectId: string,
  element: { id: string; type: string; name: string; description?: string; details?: string },
): ExtractedContent[] {
  const contents: ExtractedContent[] = [];

  // Combine element attributes
  const elementText = [element.name, element.type, element.description, element.details]
    .filter(Boolean)
    .join(' ');

  if (!isContentEmpty(elementText) && !isContentTooShort(elementText)) {
    const normalized = normalizeText(elementText);

    contents.push({
      projectId,
      entityType: 'world_building',
      entityId: element.id,
      content: normalized,
      sourceType: 'world_building',
      originalText: elementText,
      metadata: {
        name: element.name,
        type: element.type,
        hasDescription: !!element.description,
        hasDetails: !!element.details,
      },
    });
  }

  return contents;
}

/**
 * Batch extract from multiple sources
 */
export function batchExtract(
  projectId: string,
  items: Array<{
    type: ContentSourceType;
    data: Record<string, unknown>;
  }>,
): ExtractedContent[] {
  const allContents: ExtractedContent[] = [];

  for (const item of items) {
    let extracted: ExtractedContent[] = [];

    switch (item.type) {
      case 'project':
        extracted = extractFromProject(
          projectId,
          item.data as {
            title: string;
            idea: string;
            style?: string;
            language?: string;
          },
        );
        break;

      case 'chapter':
        extracted = extractFromChapter(
          projectId,
          item.data as {
            id: string;
            title: string;
            summary?: string;
            content?: string;
          },
        );
        break;

      case 'character':
        extracted = extractFromCharacter(
          projectId,
          item.data as {
            id: string;
            name: string;
            description?: string;
            backstory?: string;
          },
        );
        break;

      case 'world_building':
        extracted = extractFromWorldBuilding(
          projectId,
          item.data as {
            id: string;
            type: string;
            name: string;
            description?: string;
            details?: string;
          },
        );
        break;
    }

    allContents.push(...extracted);
  }

  return allContents;
}

/**
 * Chunk long content into smaller pieces
 * This is needed because embedding models have token limits
 */
export function chunkContent(
  content: string,
  chunkSize: number = MAX_CONTENT_LENGTH,
  overlap: number = 200,
): string[] {
  if (content.length <= chunkSize) {
    return [content];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < content.length) {
    let end = start + chunkSize;

    // Try to break at sentence boundary
    if (end < content.length) {
      const lastPeriod = content.lastIndexOf('.', end);
      const lastQuestion = content.lastIndexOf('?', end);
      const lastExclamation = content.lastIndexOf('!', end);

      const lastBoundary = Math.max(lastPeriod, lastQuestion, lastExclamation);

      // Use sentence boundary if it's within overlap range
      if (lastBoundary > start && lastBoundary > end - overlap) {
        end = lastBoundary + 1;
      }
    }

    chunks.push(content.slice(start, end));
    start = end - overlap;
  }

  return chunks;
}

/**
 * Validate content before processing
 */
export function validateContent(content: string): {
  valid: boolean;
  reason?: string;
} {
  if (isContentEmpty(content)) {
    return { valid: false, reason: 'Content is empty' };
  }

  if (isContentTooShort(content)) {
    return {
      valid: false,
      reason: `Content too short (minimum ${MIN_CONTENT_LENGTH} chars)`,
    };
  }

  return { valid: true };
}

/**
 * Get statistics about extracted content
 */
export function getContentStats(contents: ExtractedContent[]): {
  total: number;
  byType: Record<string, number>;
  avgLength: number;
  totalChars: number;
} {
  const byType: Record<string, number> = {};
  let totalChars = 0;

  for (const content of contents) {
    const type = content.sourceType;
    byType[type] = (byType[type] ?? 0) + 1;
    totalChars += content.content.length;
  }

  const avgLength = contents.length > 0 ? totalChars / contents.length : 0;

  return {
    total: contents.length,
    byType,
    avgLength,
    totalChars,
  };
}
