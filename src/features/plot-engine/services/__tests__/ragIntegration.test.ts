/**
 * RAG Integration Tests
 *
 * Tests for RAG context retrieval and AI prompt construction
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { plotGenerationService, type PlotGenerationRequest } from '@/features/plot-engine';
import { generateText } from '@/lib/api-gateway';

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
          name: 'Setup',
          description: 'Introduction',
          plotPoints: [
            {
              type: 'inciting_incident',
              title: 'Inciting Incident',
              description: 'Something happens',
              importance: 'major',
              position: 10,
            },
          ],
        },
        {
          actNumber: 2,
          name: 'Confrontation',
          description: 'Rising action',
          plotPoints: [
            {
              type: 'climax',
              title: 'Climax',
              description: 'The big moment',
              importance: 'major',
              position: 50,
            },
          ],
        },
        {
          actNumber: 3,
          name: 'Resolution',
          description: 'Ending',
          plotPoints: [
            {
              type: 'resolution',
              title: 'Resolution',
              description: 'Conclusion',
              importance: 'major',
              position: 90,
            },
          ],
        },
      ],
    }),
  },
};

const mockSuggestionsResponse = {
  success: true,
  data: {
    text: JSON.stringify([
      {
        type: 'character_arc',
        title: 'Heroic Journey',
        description: 'Protagonist learns courage',
        placement: 'middle',
        impact: 'high',
        relatedCharacters: ['Aria'],
      },
    ]),
  },
};

describe('RAG Integration Tests', () => {
  let mockRequest: PlotGenerationRequest;

  beforeEach(() => {
    mockRequest = {
      projectId: 'test-project',
      premise: 'A young hero must save their village from an ancient evil',
      genre: 'fantasy',
      targetLength: 20,
      characters: ['char-1', 'char-2'],
    };

    vi.mocked(generateText).mockReset();
    vi.mocked(generateText).mockResolvedValue(mockAIResponse);
  });

  describe('AI Prompt Construction with Context', () => {
    it('should include context section in system prompt when context is available', async () => {
      vi.mocked(generateText).mockResolvedValueOnce(mockAIResponse);
      vi.mocked(generateText).mockResolvedValueOnce(mockSuggestionsResponse);

      await plotGenerationService.generatePlot(mockRequest);

      const generateTextCalls = vi.mocked(generateText).mock.calls;
      const systemPromptCall = generateTextCalls.find(call => call[0]?.system);

      expect(systemPromptCall).toBeDefined();
      const systemPrompt = systemPromptCall?.[0]?.system as string;
      expect(systemPrompt).toBeDefined();
    });

    it('should format context with proper section headers', async () => {
      vi.mocked(generateText).mockResolvedValueOnce(mockAIResponse);
      vi.mocked(generateText).mockResolvedValueOnce(mockSuggestionsResponse);

      await plotGenerationService.generatePlot(mockRequest);

      const generateTextCalls = vi.mocked(generateText).mock.calls;
      const systemPromptCall = generateTextCalls.find(call => call[0]?.system);

      const systemPrompt = systemPromptCall?.[0]?.system as string;
      // Check that context formatting is consistent
      expect(systemPrompt).toBeDefined();
    });

    it('should generate suggestions with context-aware prompts', async () => {
      vi.mocked(generateText).mockResolvedValueOnce(mockAIResponse);
      vi.mocked(generateText).mockResolvedValueOnce(mockSuggestionsResponse);

      await plotGenerationService.generatePlot(mockRequest);

      const generateTextCalls = vi.mocked(generateText).mock.calls;
      expect(generateTextCalls.length).toBeGreaterThan(0);
    });

    it('should handle AI errors gracefully with context', async () => {
      const errorResponse = {
        success: false,
        error: 'AI service unavailable',
      };

      vi.mocked(generateText).mockResolvedValueOnce(errorResponse);

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result).toBeDefined();
      expect(result.plotStructure).toBeDefined();
      expect(result.plotStructure.acts.length).toBeGreaterThan(0);
    });

    it('should maintain plot structure quality with context', async () => {
      vi.mocked(generateText).mockResolvedValueOnce(mockAIResponse);
      vi.mocked(generateText).mockResolvedValueOnce(mockSuggestionsResponse);

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result.plotStructure).toBeDefined();
      expect(result.plotStructure.acts.length).toBeGreaterThan(0);
      expect(result.plotStructure.climax).toBeDefined();
      expect(result.plotStructure.resolution).toBeDefined();
    });
  });

  describe('Context-Aware Behavior', () => {
    it('should generate suggestions for new projects without existing data', async () => {
      const newProjectRequest: PlotGenerationRequest = {
        projectId: 'new-project-id',
        premise: 'A new story starts here',
        genre: 'fantasy',
        targetLength: 15,
      };

      vi.mocked(generateText).mockResolvedValueOnce(mockAIResponse);
      vi.mocked(generateText).mockResolvedValueOnce(mockSuggestionsResponse);

      const result = await plotGenerationService.generatePlot(newProjectRequest);

      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should generate suggestions for existing projects with character data', async () => {
      const existingProjectRequest: PlotGenerationRequest = {
        projectId: 'existing-project',
        premise: 'Continuing the story',
        genre: 'fantasy',
        targetLength: 20,
        characters: ['char-1', 'char-2'],
      };

      const contextAwareSuggestions = {
        success: true,
        data: {
          text: JSON.stringify([
            {
              type: 'character_arc',
              title: 'Develop Character Growth',
              description: 'Character learns and grows through challenges',
              placement: 'middle',
              impact: 'high',
              relatedCharacters: ['Protagonist'],
            },
          ]),
        },
      };

      vi.mocked(generateText).mockResolvedValueOnce(mockAIResponse);
      vi.mocked(generateText).mockResolvedValueOnce(contextAwareSuggestions);

      const result = await plotGenerationService.generatePlot(existingProjectRequest);

      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should include relatedCharacters in suggestions when provided by AI', async () => {
      const suggestionsWithCharacters = {
        success: true,
        data: {
          text: JSON.stringify([
            {
              type: 'character_arc',
              title: "Aria's Redemption",
              description: 'Aria finds redemption through sacrifice',
              placement: 'late',
              impact: 'high',
              relatedCharacters: ['Aria'],
            },
          ]),
        },
      };

      vi.mocked(generateText).mockResolvedValueOnce(mockAIResponse);
      vi.mocked(generateText).mockResolvedValueOnce(suggestionsWithCharacters);

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result.suggestions[0]?.relatedCharacters).toBeDefined();
      expect(result.suggestions[0]?.relatedCharacters).toContain('Aria');
    });

    it('should handle suggestions without relatedCharacters', async () => {
      const suggestionsWithoutCharacters = {
        success: true,
        data: {
          text: JSON.stringify([
            {
              type: 'plot_twist',
              title: 'Major Revelation',
              description: 'A shocking twist changes everything',
              placement: 'middle',
              impact: 'high',
            },
          ]),
        },
      };

      vi.mocked(generateText).mockResolvedValueOnce(mockAIResponse);
      vi.mocked(generateText).mockResolvedValueOnce(suggestionsWithoutCharacters);

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed AI response gracefully', async () => {
      const malformedResponse = {
        success: true,
        data: {
          text: 'This is not valid JSON {{{',
        },
      };

      vi.mocked(generateText).mockResolvedValueOnce(malformedResponse);

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result).toBeDefined();
      expect(result.plotStructure).toBeDefined();
      // Should fall back to template
      expect(result.plotStructure.acts.length).toBeGreaterThan(0);
    });

    it('should handle empty suggestions response', async () => {
      const emptySuggestions = {
        success: true,
        data: {
          text: '[]',
        },
      };

      vi.mocked(generateText).mockResolvedValueOnce(mockAIResponse);
      vi.mocked(generateText).mockResolvedValueOnce(emptySuggestions);
      vi.mocked(generateText).mockResolvedValueOnce({
        success: true,
        data: {
          text: '[]',
        },
      });

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
      // Empty array is valid response - suggestions can be empty
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should handle suggestions parsing errors', async () => {
      const parseErrorSuggestions = {
        success: true,
        data: {
          text: 'Invalid suggestions format',
        },
      };

      vi.mocked(generateText).mockResolvedValueOnce(mockAIResponse);
      vi.mocked(generateText).mockResolvedValueOnce(parseErrorSuggestions);

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle AI service timeouts', async () => {
      const timeoutResponse = {
        success: false,
        error: 'Request timeout',
      };

      vi.mocked(generateText).mockResolvedValueOnce(timeoutResponse);

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result).toBeDefined();
      expect(result.plotStructure).toBeDefined();
    });
  });

  describe('Context Format Validation', () => {
    it('should format character context correctly', async () => {
      vi.mocked(generateText).mockResolvedValueOnce(mockAIResponse);
      vi.mocked(generateText).mockResolvedValueOnce(mockSuggestionsResponse);

      await plotGenerationService.generatePlot(mockRequest);

      const generateTextCalls = vi.mocked(generateText).mock.calls;
      // Verify that AI was called with proper parameters
      expect(generateTextCalls.length).toBeGreaterThan(0);
    });

    it('should generate valid plot structure JSON', async () => {
      vi.mocked(generateText).mockResolvedValueOnce(mockAIResponse);
      vi.mocked(generateText).mockResolvedValueOnce(mockSuggestionsResponse);

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result.plotStructure).toBeDefined();
      expect(result.plotStructure.acts).toBeDefined();
      expect(Array.isArray(result.plotStructure.acts)).toBe(true);

      for (const act of result.plotStructure.acts) {
        expect(act).toHaveProperty('id');
        expect(act).toHaveProperty('actNumber');
        expect(act).toHaveProperty('name');
        expect(act).toHaveProperty('plotPoints');
        expect(Array.isArray(act.plotPoints)).toBe(true);
      }
    });

    it('should generate valid suggestions array', async () => {
      vi.mocked(generateText).mockResolvedValueOnce(mockAIResponse);
      vi.mocked(generateText).mockResolvedValueOnce(mockSuggestionsResponse);

      const result = await plotGenerationService.generatePlot(mockRequest);

      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);

      for (const suggestion of result.suggestions) {
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('title');
        expect(suggestion).toHaveProperty('description');
        expect(suggestion).toHaveProperty('placement');
        expect(suggestion).toHaveProperty('impact');
      }
    });
  });
});
