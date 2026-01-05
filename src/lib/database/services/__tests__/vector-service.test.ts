import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as drizzle from '@/lib/database/drizzle';
import * as embeddingService from '@/lib/embeddings/embedding-service';

// eslint-disable-next-line import-x/no-relative-parent-imports
import * as vectorService from '../vector-service';

// Mock drizzle
vi.mock('@/lib/database/drizzle', () => ({
  getDrizzleClient: vi.fn(),
  schema: {
    vectors: {
      projectId: 'project_id',
      entityType: 'entity_type',
      entityId: 'entity_id',
      content: 'content',
      embedding: 'embedding',
      dimensions: 'dimensions',
      model: 'model',
      updatedAt: 'updated_at',
      id: 'id',
    },
  },
}));

// Mock embedding service
vi.mock('@/lib/embeddings/embedding-service', () => ({
  generateEmbedding: vi.fn(),
}));

// Mock logging
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Vector Service', () => {
  const mockDb: any = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (drizzle.getDrizzleClient as any).mockReturnValue(mockDb);
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue([]),
          orderBy: vi.fn().mockReturnValue([]),
        }),
      }),
    });
  });

  describe('getOrCreateVector', () => {
    it('should return existing vector if found', async () => {
      const mockVector = { id: 'v1', content: 'test' };
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue([mockVector]),
          }),
        }),
      });

      const result = await vectorService.getOrCreateVector({
        projectId: 'p1',
        entityType: 'chapter',
        entityId: 'c1',
        content: 'test',
      });

      expect(result).toEqual(mockVector);
      expect(embeddingService.generateEmbedding).not.toHaveBeenCalled();
    });

    it('should generate and store new vector if not found', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue([]),
          }),
        }),
      });

      (embeddingService.generateEmbedding as any).mockResolvedValue([0.1, 0.2]);

      const mockNewVector = { id: 'new-v' };
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue([mockNewVector]),
        }),
      });

      const result = await vectorService.getOrCreateVector({
        projectId: 'p1',
        entityType: 'chapter',
        entityId: 'c1',
        content: 'test',
      });

      expect(embeddingService.generateEmbedding).toHaveBeenCalledWith('test', 'text-embedding-3-small');
      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toEqual(mockNewVector);
    });
  });

  describe('semanticSearch', () => {
    it('should return similarity search results', async () => {
      (embeddingService.generateEmbedding as any).mockResolvedValue([1, 0]);

      const mockCandidate = {
        id: 'v1',
        embedding: JSON.stringify([1, 0]),
        content: 'match',
        projectId: 'p1',
        entityType: 'chapter',
        entityId: 'c1',
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue([mockCandidate]),
          }),
        }),
      });

      const results = await vectorService.semanticSearch({
        projectId: 'p1',
        queryText: 'test query',
        threshold: 0.5,
      });

      expect(results.length).toBe(1);
      const firstResult = results[0];
      expect(firstResult?.similarity).toBe(1);
      expect(firstResult?.content).toBe('match');
    });
  });
});
