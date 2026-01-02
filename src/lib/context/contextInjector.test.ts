/**
 * Context Injector Tests
 * Tests for project context injection functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ChapterStatus, PublishStatus, type Project } from '@/types';

import { contextCache } from './contextCache';
import { injectProjectContext, ContextAwarePrompts } from './contextInjector';

// Mock logger
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('ContextInjector', () => {
  const mockProject: Project = {
    id: 'test-project-1',
    title: 'Test Novel',
    idea: 'A story about a young wizard.\n\nCHARACTERS:\n**Harry**: A brave wizard',
    style: 'Fantasy',
    coverImage: '',
    worldState: {
      hasTitle: true,
      hasOutline: true,
      chaptersCount: 1,
      chaptersCompleted: 1,
      styleDefined: true,
      isPublished: false,
      hasCharacters: true,
      hasWorldBuilding: false,
      hasThemes: false,
      plotStructureDefined: true,
      targetAudienceDefined: true,
    },
    isGenerating: false,
    status: PublishStatus.DRAFT,
    language: 'en',
    targetWordCount: 80000,
    settings: {
      enableDropCaps: true,
    },
    genre: ['Fantasy'],
    targetAudience: 'adult',
    contentWarnings: [],
    keywords: [],
    synopsis: '',
    authors: [],
    analytics: {
      totalWordCount: 1500,
      averageChapterLength: 1500,
      estimatedReadingTime: 6,
      generationCost: 0,
      editingRounds: 0,
    },
    version: '1.0.0',
    changeLog: [],
    timeline: {
      id: 'timeline-1',
      projectId: 'test-project-1',
      events: [],
      eras: [],
      settings: {
        viewMode: 'chronological',
        zoomLevel: 1,
        showCharacters: true,
        showImplicitEvents: false,
      },
    },
    chapters: [
      {
        id: 'ch1',
        orderIndex: 1,
        title: 'The Beginning',
        summary: 'Harry discovers magic',
        status: ChapterStatus.COMPLETE,
        wordCount: 1500,
        characterCount: 7500,
        estimatedReadingTime: 6,
        content: '',
        illustration: '',
        tags: [],
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    contextCache.clear();
    vi.clearAllMocks();
  });

  describe('injectProjectContext', () => {
    it('should inject context into system prompt by default', async () => {
      const originalPrompt = 'Write a chapter about magic.';
      const systemPrompt = 'You are a fantasy writer.';

      const enhanced = await injectProjectContext(mockProject, originalPrompt, systemPrompt);

      expect(enhanced.systemPrompt).toContain('# Project Context');
      expect(enhanced.systemPrompt).toContain('Test Novel');
      expect(enhanced.systemPrompt).toContain('Harry');
      expect(enhanced.systemPrompt).toContain('You are a fantasy writer.');
      expect(enhanced.userPrompt).toBe(originalPrompt);
      expect(enhanced.context).toBeDefined();
      expect(enhanced.estimatedTokens).toBeGreaterThan(0);
    });

    it('should inject context before user prompt when specified', async () => {
      const originalPrompt = 'Write a chapter about magic.';

      const enhanced = await injectProjectContext(mockProject, originalPrompt, undefined, {
        contextPlacement: 'before',
      });

      expect(enhanced.userPrompt).toContain('# Project: Test Novel');
      expect(enhanced.userPrompt).toContain('---');
      expect(enhanced.userPrompt).toContain('Write a chapter about magic.');
      expect(enhanced.systemPrompt).toBeUndefined();
    });

    it('should inject context after user prompt when specified', async () => {
      const originalPrompt = 'Write a chapter about magic.';

      const enhanced = await injectProjectContext(mockProject, originalPrompt, undefined, {
        contextPlacement: 'after',
      });

      expect(enhanced.userPrompt).toContain('Write a chapter about magic.');
      expect(enhanced.userPrompt).toContain('---');
      expect(enhanced.userPrompt).toContain('# Project: Test Novel');
      expect(enhanced.systemPrompt).toBeUndefined();
    });

    it('should skip context injection when disabled', async () => {
      const originalPrompt = 'Write a chapter about magic.';
      const systemPrompt = 'You are a fantasy writer.';

      const enhanced = await injectProjectContext(mockProject, originalPrompt, systemPrompt, { includeContext: false });

      expect(enhanced.systemPrompt).toBe(systemPrompt);
      expect(enhanced.userPrompt).toBe(originalPrompt);
      expect(enhanced.context).toBeUndefined();
    });

    it('should handle context extraction errors gracefully', async () => {
      // Mock a project that would cause extraction to fail
      const badProject = { ...mockProject, chapters: null as any };

      const enhanced = await injectProjectContext(badProject, 'Write something.', 'You are a writer.');

      // Should fallback to original prompts
      expect(enhanced.systemPrompt).toBe('You are a writer.');
      expect(enhanced.userPrompt).toBe('Write something.');
      expect(enhanced.context).toBeUndefined();
    });

    it('should respect context options', async () => {
      const enhanced = await injectProjectContext(mockProject, 'Write something.', undefined, {
        contextOptions: {
          includeCharacters: false,
          includeWorldBuilding: false,
          maxTokens: 1000,
        },
      });

      expect(enhanced.context?.characters).toHaveLength(0);
      expect(enhanced.context?.worldBuilding).toHaveLength(0);
    });
  });

  describe('ContextAwarePrompts', () => {
    let contextPrompts: ContextAwarePrompts;

    beforeEach(() => {
      contextPrompts = new ContextAwarePrompts(mockProject);
    });

    describe('createOutlinePrompt', () => {
      it('should create context-aware outline prompt', async () => {
        const enhanced = await contextPrompts.createOutlinePrompt('A wizard story', 'Fantasy');

        expect(enhanced.systemPrompt).toContain('story architect');
        expect(enhanced.systemPrompt).toContain('Fantasy');
        expect(enhanced.systemPrompt).toContain('Test Novel');
        expect(enhanced.userPrompt).toContain('A wizard story');
        expect(enhanced.userPrompt).toContain('8-12 chapters');
        expect(enhanced.context).toBeDefined();
      });
    });

    describe('createChapterPrompt', () => {
      it('should create context-aware chapter prompt', async () => {
        const enhanced = await contextPrompts.createChapterPrompt(
          'The Magic Lesson',
          'Harry learns his first spell',
          'Fantasy',
          'Harry arrived at school',
        );

        expect(enhanced.systemPrompt).toContain('Fantasy writer');
        expect(enhanced.systemPrompt).toContain('Test Novel');
        expect(enhanced.userPrompt).toContain('The Magic Lesson');
        expect(enhanced.userPrompt).toContain('Harry learns his first spell');
        expect(enhanced.userPrompt).toContain('Harry arrived at school');
        expect(enhanced.context).toBeDefined();
      });

      it('should work without previous chapter summary', async () => {
        const enhanced = await contextPrompts.createChapterPrompt(
          'The Magic Lesson',
          'Harry learns his first spell',
          'Fantasy',
        );

        expect(enhanced.userPrompt).toContain('The Magic Lesson');
        expect(enhanced.userPrompt).not.toContain('Previous chapter context');
      });
    });

    describe('createCharacterPrompt', () => {
      it('should create context-aware character prompt', async () => {
        const enhanced = await contextPrompts.createCharacterPrompt('A wizard story', 'Fantasy');

        expect(enhanced.systemPrompt).toContain('character developer');
        expect(enhanced.systemPrompt).toContain('Fantasy');
        expect(enhanced.userPrompt).toContain('A wizard story');
        expect(enhanced.userPrompt).toContain('4-6 main characters');
        expect(enhanced.context).toBeDefined();
        // Should not include existing characters to avoid duplication
        expect(enhanced.context?.characters).toHaveLength(0);
      });
    });

    describe('createConsistencyPrompt', () => {
      it('should create context-aware consistency prompt', async () => {
        const chapters = [
          { orderIndex: 1, title: 'Chapter 1', summary: 'Beginning' },
          { orderIndex: 2, title: 'Chapter 2', summary: 'Middle' },
        ];

        const enhanced = await contextPrompts.createConsistencyPrompt(chapters);

        expect(enhanced.systemPrompt).toContain('story editor');
        expect(enhanced.systemPrompt).toContain('consistency');
        expect(enhanced.userPrompt).toContain('Chapter 1');
        expect(enhanced.userPrompt).toContain('Chapter 2');
        expect(enhanced.userPrompt).toContain('consistency issues');
        expect(enhanced.context).toBeDefined();
        // Should not include chapters in context since they're in the prompt
        expect(enhanced.context?.chapters).toHaveLength(0);
      });
    });
  });

  describe('token estimation', () => {
    it('should provide reasonable token estimates', async () => {
      const enhanced = await injectProjectContext(mockProject, 'Write a short story.');

      expect(enhanced.estimatedTokens).toBeGreaterThan(50);
      expect(enhanced.estimatedTokens).toBeLessThan(10000);
    });

    it('should warn about large prompts', async () => {
      const longPrompt = 'A'.repeat(50000); // Very long prompt

      const enhanced = await injectProjectContext(mockProject, longPrompt);

      // Should still work but with a large token count
      expect(enhanced.estimatedTokens).toBeGreaterThan(10000);
    });
  });
});
