/**
 * Tests for cache hit/miss tracking
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { cacheContext, getCachedContext, getCacheStats, clearCache, generateContextHash } from '@/lib/context/cache';
import { ContextType, ContextPriority } from '@/lib/context/types';
import type { ProjectContext, OperationContext } from '@/lib/context/types';
import { PublishStatus } from '@/shared/types';

describe('Cache Statistics', () => {
  beforeEach(() => {
    clearCache();
  });

  const createMockOperationContext = (): OperationContext => ({
    project: {
      id: 'test-project',
      title: 'Test Project',
      idea: 'Test idea',
      style: 'Fantasy',
      genre: ['Fantasy'],
      chapters: [],
      updatedAt: new Date(),
      createdAt: new Date(),
      isGenerating: false,
      status: PublishStatus.DRAFT,
      language: 'en',
      targetWordCount: 50000,
      targetAudience: 'adult',
      contentWarnings: [],
      keywords: [],
      synopsis: 'Test synopsis',
      settings: {},
      authors: [],
      analytics: {
        totalWordCount: 0,
        averageChapterLength: 0,
        estimatedReadingTime: 0,
        generationCost: 0,
        editingRounds: 0,
      },
      version: '1.0.0',
      changeLog: [],
      timeline: {
        id: 'timeline-1',
        projectId: 'test-project',
        events: [],
        eras: [],
        settings: {
          viewMode: 'chronological',
          zoomLevel: 1,
          showCharacters: true,
          showImplicitEvents: false,
        },
      },
      worldState: {
        hasTitle: true,
        hasOutline: false,
        hasCharacters: false,
        hasWorldBuilding: false,
        chaptersCount: 0,
        chaptersCompleted: 0,
        styleDefined: false,
        isPublished: false,
        hasThemes: false,
        plotStructureDefined: false,
        targetAudienceDefined: false,
      },
    },
    characters: [],
    locations: [],
    cultures: [],
  });

  const createMockProjectContext = (): ProjectContext => ({
    projectId: 'test-project',
    chunks: [
      {
        type: ContextType.PROJECT_METADATA,
        priority: ContextPriority.CRITICAL,
        content: 'Test content',
        tokens: 100,
        metadata: {
          id: 'chunk-1',
          name: 'Project Overview',
          relevance: 1,
          timestamp: new Date(),
        },
      },
    ],
    totalTokens: 100,
    extractedAt: new Date(),
    version: '1.0',
  });

  it('should start with zero hits and misses', () => {
    const stats = getCacheStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(stats.hitRate).toBe(0);
  });

  it('should track cache miss on first access', () => {
    const opContext = createMockOperationContext();
    const hash = generateContextHash(opContext);

    getCachedContext('test-project', hash);

    const stats = getCacheStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe(0);
  });

  it('should track cache hit on subsequent access', () => {
    const opContext = createMockOperationContext();
    const hash = generateContextHash(opContext);
    const context = createMockProjectContext();

    // Cache the context
    cacheContext('test-project', context, hash);

    // First hit
    getCachedContext('test-project', hash);

    const stats = getCacheStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(0);
    expect(stats.hitRate).toBe(1);
  });

  it('should calculate correct hit rate', () => {
    const opContext = createMockOperationContext();
    const hash = generateContextHash(opContext);
    const context = createMockProjectContext();

    // Cache the context
    cacheContext('test-project', context, hash);

    // 3 hits
    getCachedContext('test-project', hash);
    getCachedContext('test-project', hash);
    getCachedContext('test-project', hash);

    // 1 miss
    getCachedContext('different-project', hash);

    const stats = getCacheStats();
    expect(stats.hits).toBe(3);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe(0.75); // 3/4 = 0.75
  });

  it('should track misses for expired entries', () => {
    const opContext = createMockOperationContext();
    const hash = generateContextHash(opContext);
    const context = createMockProjectContext();

    // Cache the context
    cacheContext('test-project', context, hash);

    // Access with different hash (simulates stale data)
    getCachedContext('test-project', 'different-hash');

    const stats = getCacheStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(1);
  });

  it('should reset statistics on clearCache', () => {
    const opContext = createMockOperationContext();
    const hash = generateContextHash(opContext);
    const context = createMockProjectContext();

    cacheContext('test-project', context, hash);
    getCachedContext('test-project', hash);
    getCachedContext('other-project', hash);

    let stats = getCacheStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);

    clearCache();

    stats = getCacheStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(stats.hitRate).toBe(0);
  });

  it('should track statistics across multiple projects', () => {
    const context = createMockProjectContext();

    cacheContext('project1', context, 'hash1');
    cacheContext('project2', context, 'hash2');
    cacheContext('project3', context, 'hash3');

    // 2 hits
    getCachedContext('project1', 'hash1');
    getCachedContext('project2', 'hash2');

    // 2 misses
    getCachedContext('project4', 'hash4');
    getCachedContext('project5', 'hash5');

    const stats = getCacheStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(2);
    expect(stats.hitRate).toBe(0.5);
    expect(stats.size).toBe(3);
  });
});
