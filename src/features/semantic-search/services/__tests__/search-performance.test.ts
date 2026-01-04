import { describe, it, expect, vi, beforeEach } from 'vitest';

import { characterService } from '@/features/characters/services/characterService';
import { searchService } from '@/features/semantic-search';
import * as vectorService from '@/lib/database/services/vector-service';

// Mock dependencies
vi.mock('@/lib/database/services/vector-service', () => ({
  semanticSearch: vi.fn(),
}));

vi.mock('@/features/characters/services/characterService', () => ({
  characterService: {
    getById: vi.fn(),
  },
}));

vi.mock('@/features/editor/services/editorService', () => ({
  editorService: {
    loadDraft: vi.fn(),
  },
}));

vi.mock('@/features/projects/services/projectService', () => ({
  projectService: {
    getById: vi.fn(),
  },
}));

vi.mock('@/features/world-building/services/worldBuildingService', () => ({
  worldBuildingService: {
    getLocation: vi.fn(),
    getCulture: vi.fn(),
  },
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('SearchService Performance Benchmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete search within 500ms for 10 results', async () => {
    // Mock 10 vector results
    const mockVectorResults = Array.from({ length: 10 }, (_, i) => ({
      id: `v${i}`,
      projectId: 'p1',
      entityType: 'character',
      entityId: `char${i}`,
      content: `Character ${i} content`,
      similarity: 0.9 - i * 0.05,
    }));

    (vectorService.semanticSearch as any).mockResolvedValue(mockVectorResults);
    (characterService.getById as any).mockImplementation(async (id: string) => ({
      id,
      name: `Character ${id}`,
      description: 'A test character',
    }));

    // Measure search time
    const startTime = performance.now();
    const results = await searchService.search('test query', 'p1');
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Assert results are correct
    expect(results).toHaveLength(10);

    // Performance benchmark: should complete in under 500ms
    expect(duration).toBeLessThan(500);
  });

  it('should handle 100 results efficiently', async () => {
    // Mock 100 vector results
    const mockVectorResults = Array.from({ length: 100 }, (_, i) => ({
      id: `v${i}`,
      projectId: 'p1',
      entityType: 'character',
      entityId: `char${i}`,
      content: `Character ${i} content`,
      similarity: 0.95 - i * 0.001,
    }));

    (vectorService.semanticSearch as any).mockResolvedValue(mockVectorResults);
    (characterService.getById as any).mockImplementation(async (id: string) => ({
      id,
      name: `Character ${id}`,
      description: 'A test character',
    }));

    // Measure search time
    const startTime = performance.now();
    const results = await searchService.search('test query', 'p1');
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Assert results are correct
    expect(results).toHaveLength(100);

    // Performance benchmark: should complete in under 2 seconds even with 100 results
    expect(duration).toBeLessThan(2000);
  });

  it('should handle concurrent searches efficiently', async () => {
    // Mock vector results
    const mockVectorResults = [
      {
        id: 'v1',
        projectId: 'p1',
        entityType: 'character',
        entityId: 'char1',
        content: 'Character content',
        similarity: 0.9,
      },
    ];

    (vectorService.semanticSearch as any).mockResolvedValue(mockVectorResults);
    (characterService.getById as any).mockResolvedValue({
      id: 'char1',
      name: 'Test Character',
      description: 'A test character',
    });

    // Perform 10 concurrent searches
    const startTime = performance.now();
    const searches = Array.from({ length: 10 }, () => searchService.search('test query', 'p1'));
    await Promise.all(searches);
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Performance benchmark: 10 concurrent searches should complete in under 1 second
    expect(duration).toBeLessThan(1000);
  });

  it('should filter results efficiently with entityType filter', async () => {
    // Mock mixed entity types
    const mockVectorResults = [
      {
        id: 'v1',
        projectId: 'p1',
        entityType: 'character',
        entityId: 'char1',
        content: 'Character content',
        similarity: 0.95,
      },
      {
        id: 'v2',
        projectId: 'p1',
        entityType: 'chapter',
        entityId: 'chap1',
        content: 'Chapter content',
        similarity: 0.9,
      },
      {
        id: 'v3',
        projectId: 'p1',
        entityType: 'character',
        entityId: 'char2',
        content: 'Character content',
        similarity: 0.85,
      },
    ];

    (vectorService.semanticSearch as any).mockResolvedValue(mockVectorResults);
    (characterService.getById as any).mockImplementation(async (id: string) => ({
      id,
      name: `Character ${id}`,
    }));

    // Measure filtered search time
    const startTime = performance.now();
    const results = await searchService.search('test query', 'p1', {
      entityTypes: ['character'],
    });
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should only return character results
    expect(results).toHaveLength(2);
    expect(results.every(r => r.entityType === 'character')).toBe(true);

    // Performance: filtering should be fast
    expect(duration).toBeLessThan(200);
  });

  it('should handle missing entities without significant slowdown', async () => {
    // Mock vector results where some entities are missing
    const mockVectorResults = Array.from({ length: 20 }, (_, i) => ({
      id: `v${i}`,
      projectId: 'p1',
      entityType: 'character',
      entityId: `char${i}`,
      content: `Character ${i} content`,
      similarity: 0.9 - i * 0.01,
    }));

    (vectorService.semanticSearch as any).mockResolvedValue(mockVectorResults);

    // Only half the entities exist
    (characterService.getById as any).mockImplementation(async (id: string) => {
      const charNum = parseInt(id.replace('char', ''), 10);
      if (charNum % 2 === 0) {
        return { id, name: `Character ${id}`, description: 'A test character' };
      }
      return null;
    });

    // Measure search time
    const startTime = performance.now();
    const results = await searchService.search('test query', 'p1');
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should only return existing entities
    expect(results).toHaveLength(10);

    // Performance: handling missing entities shouldn't slow down significantly
    expect(duration).toBeLessThan(500);
  });

  it('should provide performance metrics for query complexity', async () => {
    const testCases = [
      { query: 'simple', expectedResults: 5 },
      { query: 'more complex query with multiple words', expectedResults: 10 },
      { query: 'very long and complex query with many words that might affect performance', expectedResults: 15 },
    ];

    for (const testCase of testCases) {
      const mockVectorResults = Array.from({ length: testCase.expectedResults }, (_, i) => ({
        id: `v${i}`,
        projectId: 'p1',
        entityType: 'character',
        entityId: `char${i}`,
        content: `Content ${i}`,
        similarity: 0.9 - i * 0.01,
      }));

      (vectorService.semanticSearch as any).mockResolvedValue(mockVectorResults);
      (characterService.getById as any).mockResolvedValue({
        id: 'test',
        name: 'Test',
      });

      const startTime = performance.now();
      await searchService.search(testCase.query, 'p1');
      const endTime = performance.now();
      const duration = endTime - startTime;

      // All queries should complete reasonably fast
      expect(duration).toBeLessThan(1000);
    }
  });
});
