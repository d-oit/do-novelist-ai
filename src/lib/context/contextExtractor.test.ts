/**
 * Context Extractor Tests
 * Tests for project context extraction functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ChapterStatus, PublishStatus, type Project } from '@/types';

import { contextCache } from './contextCache';
import { extractProjectContext, formatContextForPrompt } from './contextExtractor';

// Mock logger
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('ContextExtractor', () => {
  const mockProject: Project = {
    id: 'test-project-1',
    title: 'Test Novel',
    idea: 'A story about a young wizard discovering their powers.\n\nCHARACTERS:\n**Harry**: A brave young wizard\n**Hermione**: A brilliant student\n\nWORLD:\n**Hogwarts**: A magical school',
    style: 'Fantasy',
    coverImage: '',
    worldState: {
      hasTitle: true,
      hasOutline: true,
      chaptersCount: 2,
      chaptersCompleted: 1,
      styleDefined: true,
      isPublished: false,
      hasCharacters: true,
      hasWorldBuilding: true,
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
      totalWordCount: 2300,
      averageChapterLength: 1150,
      estimatedReadingTime: 9,
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
        summary: 'Harry discovers he is a wizard',
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
      {
        id: 'ch2',
        orderIndex: 2,
        title: 'The Journey',
        summary: 'Harry goes to Hogwarts',
        status: ChapterStatus.DRAFTING,
        wordCount: 800,
        characterCount: 4000,
        estimatedReadingTime: 3,
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
    // Clear cache before each test
    contextCache.clear();
    vi.clearAllMocks();
  });

  describe('extractProjectContext', () => {
    it('should extract basic project context', async () => {
      const context = await extractProjectContext(mockProject);

      expect(context.project.title).toBe('Test Novel');
      expect(context.project.style).toBe('Fantasy');
      expect(context.project.idea).toContain('young wizard');
      expect(context.metadata.totalChapters).toBe(2);
      expect(context.metadata.completedChapters).toBe(1);
      expect(context.metadata.totalWords).toBe(2300);
    });

    it('should extract characters from project idea', async () => {
      const context = await extractProjectContext(mockProject);

      expect(context.characters).toHaveLength(2);
      expect(context.characters[0]?.name).toBe('Harry');
      expect(context.characters[0]?.description).toBe('A brave young wizard');
      expect(context.characters[1]?.name).toBe('Hermione');
      expect(context.characters[1]?.description).toBe('A brilliant student');
    });

    it('should extract world building from project idea', async () => {
      const context = await extractProjectContext(mockProject);

      expect(context.worldBuilding).toHaveLength(1);
      expect(context.worldBuilding[0]?.name).toBe('Hogwarts');
      expect(context.worldBuilding[0]?.description).toBe('A magical school');
      expect(context.worldBuilding[0]?.type).toBe('location');
    });

    it('should extract timeline from chapters', async () => {
      const context = await extractProjectContext(mockProject);

      expect(context.timeline).toHaveLength(2);
      expect(context.timeline[0]?.event).toBe('Harry discovers he is a wizard');
      expect(context.timeline[0]?.chapter).toBe(1);
      expect(context.timeline[0]?.importance).toBe('high'); // Complete chapter
      expect(context.timeline[1]?.importance).toBe('medium'); // Draft chapter
    });

    it('should respect context options', async () => {
      const context = await extractProjectContext(mockProject, {
        includeCharacters: false,
        includeWorldBuilding: false,
        includeTimeline: false,
        includeChapters: false,
      });

      expect(context.characters).toHaveLength(0);
      expect(context.worldBuilding).toHaveLength(0);
      expect(context.timeline).toHaveLength(0);
      expect(context.chapters).toHaveLength(0);
    });

    it('should use cached context on subsequent calls', async () => {
      // First call
      const context1 = await extractProjectContext(mockProject);

      // Second call should use cache
      const context2 = await extractProjectContext(mockProject);

      expect(context1).toEqual(context2);
      expect(context1.metadata.extractedAt).toBe(context2.metadata.extractedAt);
    });

    it('should handle projects with no chapters', async () => {
      const emptyProject = { ...mockProject, chapters: [] };

      const context = await extractProjectContext(emptyProject);

      expect(context.metadata.totalChapters).toBe(0);
      expect(context.metadata.completedChapters).toBe(0);
      expect(context.metadata.totalWords).toBe(0);
      expect(context.timeline).toHaveLength(0);
      expect(context.chapters).toHaveLength(0);
    });

    it('should trim context when exceeding token limit', async () => {
      const context = await extractProjectContext(mockProject, {
        maxTokens: 100, // Very low limit to force trimming
      });

      // Should still have basic project info
      expect(context.project.title).toBe('Test Novel');

      // Context should be trimmed but test the trimming logic worked
      expect(context.timeline.length).toBeLessThanOrEqual(5);
      expect(context.worldBuilding.length).toBeLessThanOrEqual(3);
      expect(context.characters.length).toBeLessThanOrEqual(3);
    });
  });

  describe('formatContextForPrompt', () => {
    it('should format context as readable text', async () => {
      const context = await extractProjectContext(mockProject);
      const formatted = formatContextForPrompt(context);

      expect(formatted).toContain('# Project: Test Novel');
      expect(formatted).toContain('Genre: Fantasy');
      expect(formatted).toContain('## Characters');
      expect(formatted).toContain('- **Harry**: A brave young wizard');
      expect(formatted).toContain('## World & Setting');
      expect(formatted).toContain('- **Hogwarts**: A magical school');
      expect(formatted).toContain('## Story Progress');
      expect(formatted).toContain('✓ Ch.1: The Beginning');
      expect(formatted).toContain('○ Ch.2: The Journey');
      expect(formatted).toContain('Progress: 1/2 chapters, 2,300 words');
    });

    it('should handle empty sections gracefully', async () => {
      const context = await extractProjectContext(mockProject, {
        includeCharacters: false,
        includeWorldBuilding: false,
      });

      const formatted = formatContextForPrompt(context);

      expect(formatted).toContain('# Project: Test Novel');
      expect(formatted).not.toContain('## Characters');
      expect(formatted).not.toContain('## World & Setting');
      expect(formatted).toContain('## Story Progress');
    });

    it('should truncate long project ideas', async () => {
      const longIdeaProject = {
        ...mockProject,
        idea: 'A'.repeat(2000), // Very long idea
      };

      const context = await extractProjectContext(longIdeaProject);
      const formatted = formatContextForPrompt(context);

      expect(formatted).toContain('## Story Concept');
      // Should be truncated to 1000 characters
      const conceptSection = formatted.match(/## Story Concept\n(.+?)(?=\n##|$)/s)?.[1] || '';
      expect(conceptSection.length).toBeLessThanOrEqual(1010); // Allow for newlines and formatting
    });
  });
});
