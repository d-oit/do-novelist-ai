/**
 * Context Management System
 * RAG Phase 1: Project Context Injection
 *
 * This module provides context-aware AI operations by extracting project
 * information and injecting it into AI prompts for better consistency
 * and relevance.
 */

export {
  extractProjectContext,
  formatContextForPrompt,
  type ProjectContext,
  type ContextExtractionOptions,
} from './contextExtractor';

export {
  injectProjectContext,
  ContextAwarePrompts,
  createContextAwarePrompt,
  type ContextInjectionOptions,
  type EnhancedPrompt,
} from './contextInjector';

export { contextCache } from './contextCache';

// Re-export for convenience
export { logger } from '@/lib/logging/logger';
