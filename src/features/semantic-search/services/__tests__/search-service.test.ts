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

describe('SearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should orchestrate search and hydration for characters', async () => {
    // Mock Vector Search
    const mockVectorResults = [
      {
        id: 'v1',
        projectId: 'p1',
        entityType: 'character',
        entityId: 'char1',
        content: 'some context',
        similarity: 0.9,
      },
    ];
    (vectorService.semanticSearch as any).mockResolvedValue(mockVectorResults);

    // Mock Character Service
    const mockCharacter = {
      id: 'char1',
      name: 'John Doe',
      description: 'A protagonist',
      backstory: 'Born in ...',
    };
    (characterService.getById as any).mockResolvedValue(mockCharacter);

    // Execute
    const results = await searchService.search('query', 'p1');

    // Verify
    expect(vectorService.semanticSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'p1',
        queryText: 'query',
      }),
    );
    expect(characterService.getById).toHaveBeenCalledWith('char1');
    expect(results).toHaveLength(1);
    expect(results[0]!.entity).toEqual(mockCharacter);
    expect(results[0]!.context).toContain('Character: John Doe');
    expect(results[0]!.context).toContain('Description: A protagonist');
  });

  it('should handle missing entities and filter them out', async () => {
    const mockVectorResults = [
      {
        id: 'v1',
        projectId: 'p1',
        entityType: 'character',
        entityId: 'missing_char',
        content: 'content',
        similarity: 0.8,
      },
    ];
    (vectorService.semanticSearch as any).mockResolvedValue(mockVectorResults);
    (characterService.getById as any).mockResolvedValue(null);

    const results = await searchService.search('query', 'p1');

    expect(results).toHaveLength(0);
  });

  it('should apply EntityType filters correctly', async () => {
    const mockVectorResults = [{ entityType: 'character', entityId: 'c1', similarity: 0.9 }];
    (vectorService.semanticSearch as any).mockResolvedValue(mockVectorResults);
    (characterService.getById as any).mockResolvedValue({ name: 'Char' });

    // Test with matching filter
    const resultsMatch = await searchService.search('query', 'p1', { entityTypes: ['character'] });
    expect(resultsMatch).toHaveLength(1);

    // Explicitly check that we optimized the call (SearchService line 38)
    // Actually, line 38 logic passes single type if array length is 1.
    expect(vectorService.semanticSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'character',
      }),
    );

    // Test filtering post-search if multiple types (not implemented in optimization, but useful to test logic)
    // Reset mocks
    vi.clearAllMocks();
    (vectorService.semanticSearch as any).mockResolvedValue(mockVectorResults); // Returns character
    (characterService.getById as any).mockResolvedValue({ name: 'Char' });

    const resultsMismatch = await searchService.search('query', 'p1', { entityTypes: ['chapter'] });
    expect(resultsMismatch).toHaveLength(0);
  });
});
