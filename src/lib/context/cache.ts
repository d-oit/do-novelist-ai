/**
 * Context Cache
 * Caches extracted context to avoid regeneration
 */

import { logger } from '@/lib/logging/logger';

import type { ContextCacheEntry, ProjectContext, OperationContext } from './types';

// In-memory cache (could be replaced with IndexedDB for persistence)
const contextCache = new Map<string, ContextCacheEntry>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50; // Maximum cached projects

// Cache statistics tracking
let cacheHits = 0;
let cacheMisses = 0;

/**
 * Generate a hash for cache invalidation
 * Simple hash based on project update time and data counts
 */
function generateContextHash(operationContext: OperationContext): string {
  const { project, characters = [], locations = [], cultures = [] } = operationContext;

  const parts = [
    project.updatedAt.getTime().toString(),
    project.chapters.length.toString(),
    characters.length.toString(),
    locations.length.toString(),
    cultures.length.toString(),
    project.worldState.hasCharacters.toString(),
    project.worldState.hasWorldBuilding.toString(),
  ];

  return parts.join('-');
}

/**
 * Get cached context if valid
 */
export function getCachedContext(projectId: string, hash: string): ProjectContext | null {
  const entry = contextCache.get(projectId);

  if (!entry) {
    cacheMisses++;
    logger.debug('Context cache miss - no entry', {
      component: 'ContextCache',
      projectId,
      hitRate: calculateHitRate(),
    });
    return null;
  }

  // Check if expired
  if (entry.expiresAt < new Date()) {
    cacheMisses++;
    logger.debug('Context cache miss - expired', {
      component: 'ContextCache',
      projectId,
      hitRate: calculateHitRate(),
    });
    contextCache.delete(projectId);
    return null;
  }

  // Check if hash matches (data hasn't changed)
  if (entry.hash !== hash) {
    cacheMisses++;
    logger.debug('Context cache miss - stale data', {
      component: 'ContextCache',
      projectId,
      cachedHash: entry.hash,
      currentHash: hash,
      hitRate: calculateHitRate(),
    });
    contextCache.delete(projectId);
    return null;
  }

  cacheHits++;
  logger.debug('Context cache hit', {
    component: 'ContextCache',
    projectId,
    age: Date.now() - entry.createdAt.getTime(),
    hitRate: calculateHitRate(),
  });

  return entry.context;
}

/**
 * Cache context
 */
export function cacheContext(projectId: string, context: ProjectContext, hash: string): void {
  // Enforce cache size limit (LRU-style)
  if (contextCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of contextCache.entries()) {
      if (entry.createdAt.getTime() < oldestTime) {
        oldestTime = entry.createdAt.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      contextCache.delete(oldestKey);
      logger.debug('Evicted oldest cache entry', {
        component: 'ContextCache',
        evictedProjectId: oldestKey,
      });
    }
  }

  const now = new Date();
  const entry: ContextCacheEntry = {
    projectId,
    context,
    hash,
    createdAt: now,
    expiresAt: new Date(now.getTime() + CACHE_TTL),
  };

  contextCache.set(projectId, entry);

  logger.debug('Context cached', {
    component: 'ContextCache',
    projectId,
    chunks: context.chunks.length,
    tokens: context.totalTokens,
    ttl: CACHE_TTL,
  });
}

/**
 * Invalidate cache for a project
 */
export function invalidateCache(projectId: string): void {
  if (contextCache.delete(projectId)) {
    logger.debug('Context cache invalidated', {
      component: 'ContextCache',
      projectId,
    });
  }
}

/**
 * Clear entire cache
 */
export function clearCache(): void {
  const size = contextCache.size;
  contextCache.clear();
  // Reset statistics
  cacheHits = 0;
  cacheMisses = 0;
  logger.info('Context cache cleared', {
    component: 'ContextCache',
    clearedEntries: size,
  });
}

/**
 * Calculate cache hit rate
 */
function calculateHitRate(): number {
  const total = cacheHits + cacheMisses;
  if (total === 0) return 0;
  return Math.round((cacheHits / total) * 100) / 100;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  maxSize: number;
  hitRate: number;
  hits: number;
  misses: number;
  entries: Array<{ projectId: string; age: number; tokens: number }>;
} {
  const entries = Array.from(contextCache.entries()).map(([projectId, entry]) => ({
    projectId,
    age: Date.now() - entry.createdAt.getTime(),
    tokens: entry.context.totalTokens,
  }));

  return {
    size: contextCache.size,
    maxSize: MAX_CACHE_SIZE,
    hitRate: calculateHitRate(),
    hits: cacheHits,
    misses: cacheMisses,
    entries,
  };
}

/**
 * Get context with automatic caching
 * High-level function that handles cache check and storage
 */
export function getOrExtractContext(
  operationContext: OperationContext,
  extractor: (context: OperationContext) => ProjectContext,
): ProjectContext {
  const projectId = operationContext.project.id;
  const hash = generateContextHash(operationContext);

  // Try to get from cache
  const cached = getCachedContext(projectId, hash);
  if (cached) {
    return cached;
  }

  // Extract new context
  const context = extractor(operationContext);

  // Cache it
  cacheContext(projectId, context, hash);

  return context;
}

/**
 * Export hash generation for testing
 */
export { generateContextHash };
