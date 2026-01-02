/**
 * Context System - RAG Phase 1
 * Project context injection for AI operations
 *
 * This module provides intelligent context extraction and formatting
 * to make AI generations more accurate and consistent.
 */

export * from './types';
export * from './extractor';
export * from './formatter';
export * from './token-utils';
export * from './cache';

// Re-export main functions for convenience
export { extractProjectContext } from './extractor';
export { formatContextForPrompt, formatMinimalContext, createContextSummary } from './formatter';
export { getOrExtractContext, invalidateCache, clearCache, getCacheStats } from './cache';
export { estimateTokens, truncateToTokens, estimatePromptTokens } from './token-utils';
