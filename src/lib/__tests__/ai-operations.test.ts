import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import * as aiOperations from '@/lib/ai-operations';
import type { Chapter, Project, RefineOptions } from '@/types';
import { ChapterStatus, PublishStatus } from '@/types';

// Mock dependencies
vi.mock('@/features/settings/services/settingsService', () => ({
  settingsService: {
    load: vi.fn(() => ({
      enableContextInjection: false,
      contextTokenLimit: 4000,
    })),
  },
}));

vi.mock('@/lib/cache', () => ({
  withCache: vi.fn(fn => fn),
}));

vi.mock('@/lib/context', () => ({
  ContextAwarePrompts: vi.fn().mockImplementation(() => ({
    createOutlinePrompt: vi.fn().mockResolvedValue({
      systemPrompt: 'System prompt',
      userPrompt: 'User prompt',
    }),
    createChapterPrompt: vi.fn().mockResolvedValue({
      systemPrompt: 'System prompt',
      userPrompt: 'User prompt',
    }),
  })),
}));

vi.mock('@/lib/ai-core', () => ({
  aiLogger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    })),
  },
  isTestEnvironment: vi.fn(() => false),
  isValidOutline: vi.fn(outline => {
    return outline && outline.title && Array.isArray(outline.chapters);
  }),
  config: {
    defaultProvider: 'openrouter',
  },
}));

describe('ai-operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateOutline', () => {
    it('should generate outline successfully', async () => {
      const mockResponse = {
        title: 'Test Book',
        chapters: [
          { orderIndex: 1, title: 'Chapter 1', summary: 'First chapter' },
          { orderIndex: 2, title: 'Chapter 2', summary: 'Second chapter' },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await aiOperations.generateOutline('Test idea', 'Fantasy');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai/outline',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

      await expect(aiOperations.generateOutline('Test idea', 'Fantasy')).rejects.toThrow('Internal server error');
    });

    it('should validate outline structure', async () => {
      const invalidResponse = {
        title: 'Test Book',
        // Missing chapters array
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => invalidResponse,
      });

      await expect(aiOperations.generateOutline('Test idea', 'Fantasy')).rejects.toThrow();
    });
  });

  describe('writeChapterContent', () => {
    const mockProject: Project = {
      id: 'proj_123',
      title: 'Test Project',
      idea: 'Test idea',
      style: 'Fantasy',
      coverImage: undefined,
      chapters: [],
      worldState: {
        hasTitle: true,
        hasOutline: true,
        chaptersCount: 3,
        chaptersCompleted: 0,
        styleDefined: true,
        isPublished: false,
        hasCharacters: false,
        hasWorldBuilding: false,
        hasThemes: false,
        plotStructureDefined: false,
        targetAudienceDefined: false,
      },
      isGenerating: false,
      status: PublishStatus.DRAFT,
      language: 'en',
      targetWordCount: 50000,
      settings: {},
      genre: [],
      targetAudience: 'adult',
      contentWarnings: [],
      keywords: [],
      synopsis: '',
      createdAt: new Date(),
      updatedAt: new Date(),
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
        projectId: 'proj_123',
        events: [],
        eras: [],
        settings: {
          viewMode: 'chronological',
          zoomLevel: 1,
          showCharacters: true,
          showImplicitEvents: false,
        },
      },
    };

    const mockChapter: Chapter = {
      id: 'proj_123_ch_chapter_1',
      orderIndex: 1,
      title: 'Chapter 1',
      summary: 'First chapter',
      content: '',
      status: ChapterStatus.PENDING,
      wordCount: 0,
      characterCount: 0,
      estimatedReadingTime: 0,
      tags: [],
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should write chapter content successfully', async () => {
      const mockContent = 'This is the chapter content...';

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      const result = await aiOperations.writeChapterContent(
        mockChapter.title,
        mockChapter.summary,
        mockProject.style,
        undefined,
        mockProject,
      );

      expect(result).toBe(mockContent);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai/chapter',
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });

    it('should handle missing chapter title', async () => {
      const chapterWithoutTitle = { ...mockChapter, title: '' };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: 'Content' }),
      });

      const result = await aiOperations.writeChapterContent(
        chapterWithoutTitle.title,
        chapterWithoutTitle.summary,
        mockProject.style,
        undefined,
        mockProject,
      );

      expect(result).toBeDefined();
    });

    it('should handle API errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limit exceeded' }),
      });

      await expect(
        aiOperations.writeChapterContent(
          mockChapter.title,
          mockChapter.summary,
          mockProject.style,
          undefined,
          mockProject,
        ),
      ).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('continueWriting', () => {
    it('should continue writing from existing content', async () => {
      const existingContent = 'The story begins...';
      const continuation = '\n\nAnd then something amazing happened...';

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: continuation }),
      });

      const result = await aiOperations.continueWriting(existingContent, 'Chapter summary', 'Fantasy');

      expect(result).toBe(continuation);
    });

    it('should handle empty content', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: 'New content' }),
      });

      const result = await aiOperations.continueWriting('', 'Summary', 'Fantasy');

      expect(result).toBe('New content');
    });
  });

  describe('refineChapterContent', () => {
    it('should refine content with default options', async () => {
      const originalContent = 'Original content';
      const refinedContent = 'Refined content';

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: refinedContent }),
      });

      const defaultOptions: RefineOptions = {
        model: 'gemini-2.5-flash',
        temperature: 0.7,
        maxTokens: 4000,
        topP: 0.9,
        focusAreas: ['grammar', 'style'],
        preserveLength: true,
      };

      const result = await aiOperations.refineChapterContent(
        originalContent,
        'Chapter summary',
        'Fantasy',
        defaultOptions,
      );

      expect(result).toBe(refinedContent);
    });

    it('should apply custom refine options', async () => {
      const options: RefineOptions = {
        model: 'gemini-1.5-pro',
        temperature: 0.8,
        maxTokens: 2000,
        topP: 0.95,
        focusAreas: ['grammar', 'dialogue', 'pacing'],
        preserveLength: false,
        targetTone: 'dramatic',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: 'Refined' }),
      });

      await aiOperations.refineChapterContent('Content', 'Summary', 'Fantasy', options);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai/refine',
        expect.objectContaining({
          body: expect.stringContaining('"temperature":0.8'),
        }),
      );
    });

    it('should handle refinement errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid content' }),
      });

      const invalidOptions: RefineOptions = {
        model: 'gemini-2.5-flash',
        temperature: 0.7,
        maxTokens: 4000,
        topP: 0.9,
        focusAreas: ['grammar'],
        preserveLength: true,
      };

      await expect(aiOperations.refineChapterContent('Content', 'Summary', 'Fantasy', invalidOptions)).rejects.toThrow(
        'Invalid content',
      );
    });
  });

  describe('analyzeConsistency', () => {
    const mockChapters: Chapter[] = [
      {
        id: 'proj_123_ch_chapter_1',
        orderIndex: 1,
        title: 'Chapter 1',
        summary: 'First',
        content: 'Content 1',
        status: ChapterStatus.COMPLETE,
        wordCount: 1000,
        characterCount: 5000,
        estimatedReadingTime: 5,
        tags: [],
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'proj_123_ch_chapter_2',
        orderIndex: 2,
        title: 'Chapter 2',
        summary: 'Second',
        content: 'Content 2',
        status: ChapterStatus.COMPLETE,
        wordCount: 1200,
        characterCount: 6000,
        estimatedReadingTime: 6,
        tags: [],
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should analyze consistency across chapters', async () => {
      const mockAnalysis = {
        analysis: 'Consistency analysis result',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalysis,
      });

      const result = await aiOperations.analyzeConsistency(mockChapters, 'Fantasy');

      expect(result).toBe(mockAnalysis.analysis);
    });

    it('should handle empty chapters array', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analysis: 'No chapters to analyze' }),
      });

      const result = await aiOperations.analyzeConsistency([], 'Fantasy');

      expect(result).toBe('No chapters to analyze');
    });
  });

  describe('brainstormProject', () => {
    it('should generate project ideas', async () => {
      const mockText = 'A fantasy story about dragons and magic';

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: mockText }),
      });

      const result = await aiOperations.brainstormProject('fantasy context', 'idea');

      expect(result).toBe(mockText);
    });
  });

  describe('generateCoverImage', () => {
    it('should generate cover image URL', async () => {
      const mockImageUrl = 'https://example.com/cover.jpg';

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ imageUrl: mockImageUrl }),
      });

      const result = await aiOperations.generateCoverImage('Test Book', 'Fantasy', 'A fantasy adventure');

      expect(result).toBe(mockImageUrl);
    });

    it('should return null on image generation errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Image generation failed' }),
      });

      const result = await aiOperations.generateCoverImage('Test', 'Fantasy', 'Idea');

      expect(result).toBeNull();
    });
  });

  describe('generateChapterIllustration', () => {
    it('should generate chapter illustration', async () => {
      const mockImageUrl = 'https://example.com/illustration.jpg';

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ imageUrl: mockImageUrl }),
      });

      const result = await aiOperations.generateChapterIllustration('Chapter 1', 'Chapter summary', 'Fantasy');

      expect(result).toBe(mockImageUrl);
    });
  });

  describe('translateContent', () => {
    it('should translate content to target language', async () => {
      const originalText = 'Hello, world!';
      const translatedText = 'Hola, mundo!';

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ translatedContent: translatedText }),
      });

      const result = await aiOperations.translateContent(`${originalText} (from en to es)`, 'es');

      expect(result).toBe(translatedText);
    });

    it('should handle translation errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Unsupported language' }),
      });

      await expect(aiOperations.translateContent('Text', 'xyz')).rejects.toThrow('Unsupported language');
    });
  });

  describe('developCharacters', () => {
    it('should develop character profiles', async () => {
      const mockCharacters = 'Character profiles...';

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ characters: mockCharacters }),
      });

      const result = await aiOperations.developCharacters('Fantasy story', 'Epic');

      expect(result).toBe(mockCharacters);
    });
  });

  describe('buildWorld', () => {
    it('should build world lore and settings', async () => {
      const mockWorld = 'World description...';

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ worldBuilding: mockWorld }),
      });

      const result = await aiOperations.buildWorld('Fantasy realm', 'Medieval');

      expect(result).toBe(mockWorld);
    });
  });

  describe('polishDialogue', () => {
    it('should polish dialogue content', async () => {
      const originalDialogue = '"Hi," said Bob.';
      const polishedDialogue = '"Hello," Bob said warmly.';

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ polishedContent: polishedDialogue }),
      });

      const result = await aiOperations.polishDialogue(originalDialogue, 'Formal');

      expect(result).toBe(polishedDialogue);
    });

    it('should handle empty dialogue', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ polishedContent: '' }),
      });

      const result = await aiOperations.polishDialogue('', 'Casual');

      expect(result).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      await expect(aiOperations.generateOutline('Test', 'Fantasy')).rejects.toThrow('Network error');
    });

    it('should handle malformed JSON responses', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(aiOperations.generateOutline('Test', 'Fantasy')).rejects.toThrow();
    });

    it('should handle missing error messages in response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Failed to parse');
        },
      });

      await expect(aiOperations.generateOutline('Test', 'Fantasy')).rejects.toThrow();
    });
  });
});
