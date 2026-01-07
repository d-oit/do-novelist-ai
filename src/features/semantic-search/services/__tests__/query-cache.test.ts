/**
 * Query Cache Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { QueryCache } from '@/features/semantic-search/services/query-cache';
import type { HydratedSearchResult } from '@/types/embeddings';

describe('QueryCache', () => {
  let cache: QueryCache;

  // Helper to create mock results
  const createMockResult = (entityId: string, name: string, similarity = 0.95): HydratedSearchResult => ({
    id: `vec-${entityId}`,
    entityId,
    entityType: 'character',
    projectId: 'project-1',
    content: `Character description for ${name}`,
    similarity,
    entity: { name },
    context: `Character: ${name}`,
  });

  beforeEach(() => {
    cache = new QueryCache({ ttlMs: 1000, maxEntries: 3 });
  });

  afterEach(() => {
    cache.clear();
  });

  describe('Basic Cache Operations', () => {
    it('should return null for cache miss', () => {
      const result = cache.get('test query', 'project-1');
      expect(result).toBeNull();
    });

    it('should cache and retrieve results', () => {
      const mockResults = [createMockResult('char-1', 'Elara')];

      cache.set('Who is Elara?', 'project-1', mockResults);
      const retrieved = cache.get('Who is Elara?', 'project-1');

      expect(retrieved).toEqual(mockResults);
    });

    it('should normalize queries for cache key (case insensitive)', () => {
      const mockResults = [createMockResult('char-1', 'Elara')];

      cache.set('WHO IS ELARA?', 'project-1', mockResults);
      const retrieved = cache.get('who is elara?', 'project-1');

      expect(retrieved).toEqual(mockResults);
    });

    it('should normalize queries with extra whitespace', () => {
      const mockResults = [createMockResult('char-1', 'Elara')];

      cache.set('  Who is Elara?  ', 'project-1', mockResults);
      const retrieved = cache.get('Who is Elara?', 'project-1');

      expect(retrieved).toEqual(mockResults);
    });

    it('should cache embeddings', () => {
      const mockResults: HydratedSearchResult[] = [];
      const mockEmbedding = [0.1, 0.2, 0.3];

      cache.set('test query', 'project-1', mockResults, mockEmbedding);
      const embedding = cache.getEmbedding('test query', 'project-1');

      expect(embedding).toEqual(mockEmbedding);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      const mockResults = [createMockResult('char-1', 'Elara')];

      cache.set('test query', 'project-1', mockResults);

      // Should be cached immediately
      expect(cache.get('test query', 'project-1')).toEqual(mockResults);

      // Wait for TTL to expire (1000ms)
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be expired
      expect(cache.get('test query', 'project-1')).toBeNull();
    });

    it('should not expire embeddings before TTL', () => {
      const mockResults: HydratedSearchResult[] = [];
      const mockEmbedding = [0.1, 0.2, 0.3];

      cache.set('test query', 'project-1', mockResults, mockEmbedding);

      // Should be available immediately
      expect(cache.getEmbedding('test query', 'project-1')).toEqual(mockEmbedding);
    });
  });

  describe('LRU (Least Recently Used) Eviction', () => {
    it('should evict oldest entry when max entries exceeded', () => {
      const mockResults1 = [createMockResult('char-1', 'Elara')];
      const mockResults2 = [createMockResult('char-2', 'Theron')];
      const mockResults3 = [createMockResult('char-3', 'Lyra')];
      const mockResults4 = [createMockResult('char-4', 'Kael')];

      // Max entries is 3
      cache.set('query1', 'project-1', mockResults1);
      cache.set('query2', 'project-1', mockResults2);
      cache.set('query3', 'project-1', mockResults3);

      // All should be cached
      expect(cache.get('query1', 'project-1')).toEqual(mockResults1);
      expect(cache.get('query2', 'project-1')).toEqual(mockResults2);
      expect(cache.get('query3', 'project-1')).toEqual(mockResults3);

      // Add 4th entry - should evict query1 (oldest)
      cache.set('query4', 'project-1', mockResults4);

      expect(cache.get('query1', 'project-1')).toBeNull(); // Evicted
      expect(cache.get('query2', 'project-1')).toEqual(mockResults2);
      expect(cache.get('query3', 'project-1')).toEqual(mockResults3);
      expect(cache.get('query4', 'project-1')).toEqual(mockResults4);
    });

    it('should move accessed entries to end (LRU behavior)', () => {
      const mockResults1 = [createMockResult('char-1', 'Elara')];
      const mockResults2 = [createMockResult('char-2', 'Theron')];
      const mockResults3 = [createMockResult('char-3', 'Lyra')];
      const mockResults4 = [createMockResult('char-4', 'Kael')];

      cache.set('query1', 'project-1', mockResults1);
      cache.set('query2', 'project-1', mockResults2);
      cache.set('query3', 'project-1', mockResults3);

      // Access query1 (should move to end)
      cache.get('query1', 'project-1');

      // Add 4th entry - should evict query2 (now oldest)
      cache.set('query4', 'project-1', mockResults4);

      expect(cache.get('query1', 'project-1')).toEqual(mockResults1); // Still cached
      expect(cache.get('query2', 'project-1')).toBeNull(); // Evicted
      expect(cache.get('query3', 'project-1')).toEqual(mockResults3);
      expect(cache.get('query4', 'project-1')).toEqual(mockResults4);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate all entries for a project', () => {
      const mockResults = [createMockResult('char-1', 'Elara')];

      cache.set('query1', 'project-1', mockResults);
      cache.set('query2', 'project-1', mockResults);
      cache.set('query3', 'project-2', mockResults);

      cache.invalidateProject('project-1');

      expect(cache.get('query1', 'project-1')).toBeNull();
      expect(cache.get('query2', 'project-1')).toBeNull();
      expect(cache.get('query3', 'project-2')).toEqual(mockResults); // Different project
    });

    it('should invalidate entity (invalidates whole project)', () => {
      const mockResults = [createMockResult('char-1', 'Elara')];

      cache.set('query1', 'project-1', mockResults);
      cache.invalidateEntity('char-1', 'project-1');

      expect(cache.get('query1', 'project-1')).toBeNull();
    });

    it('should clear all cache entries', () => {
      const mockResults = [createMockResult('char-1', 'Elara')];

      cache.set('query1', 'project-1', mockResults);
      cache.set('query2', 'project-2', mockResults);

      cache.clear();

      expect(cache.get('query1', 'project-1')).toBeNull();
      expect(cache.get('query2', 'project-2')).toBeNull();
    });
  });

  describe('Cache Statistics', () => {
    it('should track hit/miss stats', () => {
      const mockResults = [createMockResult('char-1', 'Elara')];

      cache.set('test query', 'project-1', mockResults);

      // 2 hits
      cache.get('test query', 'project-1');
      cache.get('test query', 'project-1');

      // 3 misses
      cache.get('unknown query 1', 'project-1');
      cache.get('unknown query 2', 'project-1');
      cache.get('unknown query 3', 'project-1');

      const stats = cache.getStats();

      expect(stats.totalHits).toBe(2);
      expect(stats.totalMisses).toBe(3);
      expect(stats.hitRate).toBe(0.4); // 2/5 = 0.4
    });

    it('should calculate correct hit rate', () => {
      const mockResults = [createMockResult('char-1', 'Elara')];

      cache.set('query1', 'project-1', mockResults);
      cache.set('query2', 'project-1', mockResults);

      // 8 hits
      for (let i = 0; i < 4; i++) {
        cache.get('query1', 'project-1');
        cache.get('query2', 'project-1');
      }

      // 2 misses
      cache.get('unknown1', 'project-1');
      cache.get('unknown2', 'project-1');

      const stats = cache.getStats();

      expect(stats.totalHits).toBe(8);
      expect(stats.totalMisses).toBe(2);
      expect(stats.hitRate).toBe(0.8); // 8/10 = 0.8
    });

    it('should track entry count', () => {
      const mockResults = [createMockResult('char-1', 'Elara')];

      expect(cache.getStats().entryCount).toBe(0);

      cache.set('query1', 'project-1', mockResults);
      expect(cache.getStats().entryCount).toBe(1);

      cache.set('query2', 'project-1', mockResults);
      expect(cache.getStats().entryCount).toBe(2);

      cache.clear();
      expect(cache.getStats().entryCount).toBe(0);
    });

    it('should reset stats on clear', () => {
      const mockResults = [createMockResult('char-1', 'Elara')];

      cache.set('query1', 'project-1', mockResults);
      cache.get('query1', 'project-1');
      cache.get('unknown', 'project-1');

      cache.clear();

      const stats = cache.getStats();
      expect(stats.totalHits).toBe(0);
      expect(stats.totalMisses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('Cache Pruning', () => {
    it('should prune expired entries', async () => {
      const mockResults = [createMockResult('char-1', 'Elara')];

      cache.set('old query', 'project-1', mockResults);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      cache.set('new query', 'project-1', mockResults);

      cache.prune();

      // Old should be pruned, new should remain
      expect(cache.get('old query', 'project-1')).toBeNull();
      expect(cache.get('new query', 'project-1')).toEqual(mockResults);
    });

    it('should not prune valid entries', () => {
      const mockResults = [createMockResult('char-1', 'Elara')];

      cache.set('query1', 'project-1', mockResults);
      cache.set('query2', 'project-1', mockResults);

      cache.prune();

      expect(cache.get('query1', 'project-1')).toEqual(mockResults);
      expect(cache.get('query2', 'project-1')).toEqual(mockResults);
      expect(cache.getStats().entryCount).toBe(2);
    });
  });
});
