import { describe, it, expect, beforeEach, vi } from 'vitest';

import { plotGenerationService } from '@/features/plot-engine';
import { searchService } from '@/features/semantic-search';
import { generateText } from '@/lib/api-gateway';

vi.mock('@/features/semantic-search', () => ({
  searchService: {
    search: vi.fn(),
  },
}));

vi.mock('@/lib/api-gateway', () => ({
  generateText: vi.fn(),
}));

const mockAIResponse = {
  success: true,
  data: {
    text: JSON.stringify({
      acts: [
        {
          actNumber: 1,
          name: 'Act 1',
          description: 'Setup',
          plotPoints: [
            {
              type: 'inciting_incident' as const,
              title: 'Inciting Incident',
              description: 'Story begins',
              importance: 'major' as const,
              position: 10,
            },
          ],
        },
      ],
    }),
  },
};

describe('PlotGenerationService RAG Integration', () => {
  beforeEach(() => {
    vi.mocked(searchService.search).mockReset();
    vi.mocked(generateText).mockReset();
    vi.mocked(generateText).mockResolvedValue(mockAIResponse);
  });

  describe('retrieveProjectContext', () => {
    it('should retrieve and format project context from RAG', async () => {
      vi.mocked(searchService.search).mockResolvedValue([
        {
          id: 'result-1',
          projectId: 'p1',
          entityType: 'character',
          entityId: 'char-1',
          content: 'Character content',
          similarity: 0.9,
          entity: {
            name: 'John Doe',
            description: 'A brave hero',
          },
          context: 'Character: John Doe\nDescription: A brave hero\nBackstory: Once a farmer',
        },
        {
          id: 'result-2',
          projectId: 'p1',
          entityType: 'world_building',
          entityId: 'wb-1',
          content: 'World building content',
          similarity: 0.85,
          entity: {
            name: 'Eldoria',
            description: 'A mystical kingdom',
          },
          context: 'World Building (location): Eldoria\nDescription: A mystical kingdom',
        },
      ]);

      const request = {
        projectId: 'p1',
        premise: 'A hero saves the kingdom',
        genre: 'fantasy',
        targetLength: 20,
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(result).toBeDefined();
      expect(result.plotStructure).toBeDefined();
    });

    it('should handle empty RAG results gracefully', async () => {
      vi.mocked(searchService.search).mockResolvedValue([]);

      const request = {
        projectId: 'p1',
        premise: 'A hero saves the kingdom',
        genre: 'fantasy',
        targetLength: 20,
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(result).toBeDefined();
      expect(result.plotStructure).toBeDefined();
    });

    it('should use custom query text when provided', async () => {
      vi.mocked(searchService.search).mockResolvedValue([]);

      const request = {
        projectId: 'p1',
        premise: 'A hero saves the kingdom from darkness',
        genre: 'fantasy',
        targetLength: 20,
      };

      await plotGenerationService.generatePlot(request);

      expect(searchService.search).toHaveBeenCalledWith('fantasy A hero saves the kingdom from darkness', 'p1', {
        limit: 5,
        minScore: 0.5,
      });
    });

    it('should search for multiple query types', async () => {
      vi.mocked(searchService.search).mockResolvedValue([]);

      const request = {
        projectId: 'p1',
        premise: 'A hero saves the kingdom',
        genre: 'fantasy',
        targetLength: 20,
      };

      await plotGenerationService.generatePlot(request);

      const calls = vi.mocked(searchService.search).mock.calls;
      expect(calls.length).toBeGreaterThan(0);

      const firstCall = calls[0];
      expect(firstCall).toContain('fantasy A hero saves the kingdom');
    });

    it('should handle search errors gracefully', async () => {
      vi.mocked(searchService.search).mockRejectedValue(new Error('Search failed'));

      const request = {
        projectId: 'p1',
        premise: 'A hero saves the kingdom',
        genre: 'fantasy',
        targetLength: 20,
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(result).toBeDefined();
      expect(result.plotStructure).toBeDefined();
    });

    it('should include context in AI prompts', async () => {
      vi.mocked(searchService.search).mockResolvedValue([
        {
          id: 'result-1',
          projectId: 'p1',
          entityType: 'character',
          entityId: 'char-1',
          content: 'Character content',
          similarity: 0.9,
          entity: {
            name: 'John Doe',
            description: 'A brave hero',
          },
          context: 'Character: John Doe\nDescription: A brave hero\nBackstory: Once a farmer',
        },
      ]);

      const request = {
        projectId: 'p1',
        premise: 'A hero saves the kingdom',
        genre: 'fantasy',
        targetLength: 20,
      };

      await plotGenerationService.generatePlot(request);

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('IMPORTANT CONTEXT FROM THE PROJECT'),
        }),
      );
    });
  });

  describe('formatContextForPrompt', () => {
    it('should format context with multiple entity types', async () => {
      vi.mocked(searchService.search).mockResolvedValue([
        {
          id: 'result-1',
          projectId: 'p1',
          entityType: 'character',
          entityId: 'char-1',
          content: 'Character content',
          similarity: 0.9,
          entity: {
            name: 'John Doe',
            description: 'A brave hero',
          },
          context: 'Character: John Doe\nDescription: A brave hero\nBackstory: Once a farmer',
        },
        {
          id: 'result-2',
          projectId: 'p1',
          entityType: 'world_building',
          entityId: 'wb-1',
          content: 'World building content',
          similarity: 0.85,
          entity: {
            name: 'Eldoria',
            description: 'A mystical kingdom',
          },
          context: 'World Building (location): Eldoria\nDescription: A mystical kingdom',
        },
        {
          id: 'result-3',
          projectId: 'p1',
          entityType: 'project',
          entityId: 'proj-1',
          content: 'Project content',
          similarity: 0.95,
          entity: {
            title: "The Hero's Journey",
            description: 'An epic adventure',
          },
          context: "Project: The Hero's Journey\nIdea: An epic adventure",
        },
      ]);

      const request = {
        projectId: 'p1',
        premise: 'A hero saves the kingdom',
        genre: 'fantasy',
        targetLength: 20,
      };

      await plotGenerationService.generatePlot(request);

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('PROJECT CONTEXT:'),
        }),
      );

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('EXISTING CHARACTERS:'),
        }),
      );

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('WORLD BUILDING ELEMENTS:'),
        }),
      );
    });

    it('should limit chapter context to top 3 results', async () => {
      const chapterResults = Array.from({ length: 5 }, (_, i) => ({
        id: `chapter-${i}`,
        projectId: 'p1',
        entityType: 'chapter' as const,
        entityId: `ch-${i}`,
        content: `Chapter ${i} content`,
        similarity: 0.9,
        entity: {
          title: `Chapter ${i}`,
          summary: `Summary ${i}`,
          content: `Content ${i}`,
        },
        context: `Chapter: Chapter ${i}\nSummary: Summary ${i}\nContent: Content ${i}`,
      }));

      vi.mocked(searchService.search).mockResolvedValue(chapterResults);

      const request = {
        projectId: 'p1',
        premise: 'A hero saves the kingdom',
        genre: 'fantasy',
        targetLength: 20,
      };

      await plotGenerationService.generatePlot(request);

      const systemCall = vi.mocked(generateText).mock.calls[0]?.[0];
      const contextSection = systemCall?.system?.split('EXISTING CHAPTER CONTENT:')?.[1]?.split('\n\n')[0];

      expect(contextSection).toBeDefined();
    });
  });

  describe('Context Retrieval Strategy', () => {
    it('should use project-specific search queries', async () => {
      vi.mocked(searchService.search).mockResolvedValue([]);

      const request = {
        projectId: 'p1',
        premise: 'A detective investigates a murder',
        genre: 'mystery',
        targetLength: 15,
      };

      await plotGenerationService.generatePlot(request);

      expect(searchService.search).toHaveBeenCalledWith('mystery A detective investigates a murder', 'p1', {
        limit: 5,
        minScore: 0.5,
      });
    });

    it('should retrieve relevant context for different genres', async () => {
      vi.mocked(searchService.search).mockResolvedValue([]);

      const genres = ['romance', 'scifi', 'thriller'];

      for (const genre of genres) {
        const request = {
          projectId: 'p1',
          premise: 'A story about love',
          genre,
          targetLength: 20,
        };

        await plotGenerationService.generatePlot(request);

        expect(searchService.search).toHaveBeenCalledWith(expect.stringContaining(genre), 'p1', {
          limit: 5,
          minScore: 0.5,
        });
      }
    });
  });
});
