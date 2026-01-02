/**
 * Context Cache Service
 * Caches extracted project context to improve performance
 * Part of RAG Phase 1 implementation
 */

import { logger } from '@/lib/logging/logger';
import type { Project } from '@/types';

import type { ProjectContext } from './contextExtractor';

interface CacheEntry {
  context: ProjectContext;
  timestamp: number;
  projectHash: string;
}

class ContextCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_ENTRIES = 50;

  /**
   * Generate a hash for project state to detect changes
   */
  private generateProjectHash(project: Project): string {
    const hashData = {
      id: project.id,
      title: project.title,
      idea: project.idea,
      style: project.style,
      chaptersCount: project.chapters?.length || 0,
      lastModified: project.updatedAt || Date.now(),
      // Include chapter summaries for change detection
      chapterSummaries:
        project.chapters?.map((c: Project['chapters'][0]) => ({
          id: c.id,
          title: c.title,
          summary: c.summary,
          status: c.status,
        })) || [],
    };

    return btoa(JSON.stringify(hashData)).slice(0, 32);
  }

  /**
   * Get cached context if valid and fresh
   */
  get(projectId: string, project: Project): ProjectContext | null {
    const entry = this.cache.get(projectId);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > this.TTL_MS;

    if (isExpired) {
      this.cache.delete(projectId);
      logger.debug('Context cache expired', {
        component: 'ContextCache',
        projectId,
        age: now - entry.timestamp,
      });
      return null;
    }

    const currentHash = this.generateProjectHash(project);
    const isStale = entry.projectHash !== currentHash;

    if (isStale) {
      this.cache.delete(projectId);
      logger.debug('Context cache stale', {
        component: 'ContextCache',
        projectId,
        oldHash: entry.projectHash,
        newHash: currentHash,
      });
      return null;
    }

    logger.debug('Context cache hit', {
      component: 'ContextCache',
      projectId,
      age: now - entry.timestamp,
    });

    return entry.context;
  }

  /**
   * Store context in cache
   */
  set(projectId: string, project: Project, context: ProjectContext): void {
    // Enforce cache size limit
    if (this.cache.size >= this.MAX_ENTRIES) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const entry: CacheEntry = {
      context,
      timestamp: Date.now(),
      projectHash: this.generateProjectHash(project),
    };

    this.cache.set(projectId, entry);

    logger.debug('Context cached', {
      component: 'ContextCache',
      projectId,
      cacheSize: this.cache.size,
      contextTokens: this.estimateTokens(context),
    });
  }

  /**
   * Clear cache for specific project
   */
  invalidate(projectId: string): void {
    const deleted = this.cache.delete(projectId);

    if (deleted) {
      logger.debug('Context cache invalidated', {
        component: 'ContextCache',
        projectId,
      });
    }
  }

  /**
   * Clear all cached contexts
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();

    logger.info('Context cache cleared', {
      component: 'ContextCache',
      entriesCleared: size,
    });
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    ttlMs: number;
    entries: Array<{
      projectId: string;
      age: number;
      tokenEstimate: number;
    }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([projectId, entry]) => ({
      projectId,
      age: now - entry.timestamp,
      tokenEstimate: this.estimateTokens(entry.context),
    }));

    return {
      size: this.cache.size,
      maxSize: this.MAX_ENTRIES,
      ttlMs: this.TTL_MS,
      entries,
    };
  }

  /**
   * Estimate token count for context (rough approximation)
   */
  private estimateTokens(context: ProjectContext): number {
    const text = JSON.stringify(context);
    return Math.ceil(text.length / 4);
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [projectId, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL_MS) {
        this.cache.delete(projectId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Context cache cleanup', {
        component: 'ContextCache',
        entriesRemoved: cleaned,
        remainingEntries: this.cache.size,
      });
    }
  }
}

// Export singleton instance
export const contextCache = new ContextCache();

// Set up periodic cleanup
if (typeof window !== 'undefined') {
  setInterval(
    () => {
      contextCache.cleanup();
    },
    2 * 60 * 1000,
  ); // Clean up every 2 minutes
}
