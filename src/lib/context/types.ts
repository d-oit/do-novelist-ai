/**
 * Context System Types
 * Types for RAG Phase 1: Project Context Injection
 */

import type { Character } from '@/features/characters/types';
import type { Location, Culture } from '@/features/world-building/types';
import type { Chapter, Project } from '@/shared/types';

/**
 * Context priority levels for token optimization
 */
export enum ContextPriority {
  CRITICAL = 'critical', // Always include (e.g., current chapter, main characters)
  HIGH = 'high', // Include if space available (e.g., related characters, locations)
  MEDIUM = 'medium', // Include if space permits (e.g., world rules, timeline)
  LOW = 'low', // Include only if plenty of space (e.g., minor details)
}

/**
 * Types of context that can be extracted
 */
export enum ContextType {
  PROJECT_METADATA = 'project_metadata',
  CHARACTERS = 'characters',
  WORLD_BUILDING = 'world_building',
  TIMELINE = 'timeline',
  CHAPTERS = 'chapters',
  THEMES = 'themes',
}

/**
 * Context chunk with metadata
 */
export interface ContextChunk {
  type: ContextType;
  priority: ContextPriority;
  content: string;
  tokens: number;
  metadata: {
    id?: string;
    name?: string;
    relevance?: number; // 0-1 score for semantic relevance
    timestamp?: Date;
  };
}

/**
 * Extracted project context
 */
export interface ProjectContext {
  projectId: string;
  chunks: ContextChunk[];
  totalTokens: number;
  extractedAt: Date;
  version: string; // Cache versioning
}

/**
 * Context extraction options
 */
export interface ContextExtractionOptions {
  maxTokens?: number; // Maximum context tokens (default: 50000)
  includeTypes?: ContextType[]; // Which context types to include
  currentChapterId?: string; // For chapter-specific context
  priorityThreshold?: ContextPriority; // Minimum priority to include
  relevanceThreshold?: number; // Minimum relevance score (0-1)
}

/**
 * Context injection result
 */
export interface ContextInjectionResult {
  systemPrompt: string;
  contextTokens: number;
  chunksIncluded: number;
  truncated: boolean;
}

/**
 * Context for specific operations
 */
export interface OperationContext {
  project: Project;
  characters?: Character[];
  locations?: Location[];
  cultures?: Culture[];
  currentChapter?: Chapter;
  relatedChapters?: Chapter[];
}

/**
 * Context cache entry
 */
export interface ContextCacheEntry {
  projectId: string;
  context: ProjectContext;
  hash: string; // Hash of source data for invalidation
  createdAt: Date;
  expiresAt: Date;
}
