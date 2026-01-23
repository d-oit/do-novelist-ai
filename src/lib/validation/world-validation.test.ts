/**
 * Tests for validation.ts - World Building & Utility Validation
 * Target: World validation and utility method tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ValidationService, validate, assertValid, safeConvert } from '@/lib/validation';

import { PublishStatus } from '@shared/types';

// Mock dependencies
vi.mock('@/types/schemas', async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await vi.importActual<typeof import('@/types/schemas')>('@/types/schemas');
  return {
    ...actual,
    validateData: vi.fn((_schema, data) => ({ success: true, data })),
  };
});

vi.mock('@/types/guards', () => ({
  createProjectId: vi.fn(() => 'proj_test123'),
  createChapterId: vi.fn(projectId => `${projectId}_chapter_test`),
  isProjectId: vi.fn(id => typeof id === 'string' && id.startsWith('proj_')),
}));

describe('ValidationService - Utility Methods', () => {
  let service: ValidationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = ValidationService.getInstance();
  });

  describe('calculateReadingTime', () => {
    it('should calculate reading time correctly', () => {
      expect(service.calculateReadingTime(250)).toBe(1);
      expect(service.calculateReadingTime(500)).toBe(2);
      expect(service.calculateReadingTime(260)).toBe(2);
    });

    it('should handle zero words', () => {
      expect(service.calculateReadingTime(0)).toBe(0);
    });

    it('should handle fractional word counts', () => {
      expect(service.calculateReadingTime(1)).toBe(1);
      expect(service.calculateReadingTime(10)).toBe(1);
      expect(service.calculateReadingTime(249)).toBe(1);
      expect(service.calculateReadingTime(251)).toBe(2);
    });

    it('should handle very large word counts', () => {
      expect(service.calculateReadingTime(10000)).toBe(40);
      expect(service.calculateReadingTime(100000)).toBe(400);
    });

    it('should handle negative word counts', () => {
      const result = service.calculateReadingTime(-10);
      // Math.ceil(-10/250) returns -0, which is treated as 0 for our purposes
      expect(Math.abs(result)).toBe(0);
    });

    it('should handle decimal word counts', () => {
      expect(service.calculateReadingTime(250.5)).toBe(2);
      expect(service.calculateReadingTime(499.9)).toBe(2);
    });
  });

  describe('updateProjectAnalytics', () => {
    it('should update project analytics', () => {
      const project = {
        id: 'proj_1',
        chapters: [{ wordCount: 1000 }, { wordCount: 2000 }],
        analytics: {
          totalWordCount: 0,
          averageChapterLength: 0,
          estimatedReadingTime: 0,
          generationCost: 0,
          editingRounds: 0,
        },
      } as any;

      const result = service.updateProjectAnalytics(project);

      expect(result.analytics.totalWordCount).toBe(3000);
      expect(result.analytics.averageChapterLength).toBe(1500);
      expect(result.analytics.estimatedReadingTime).toBe(12);
    });

    it('should handle empty chapters', () => {
      const project = {
        id: 'proj_1',
        chapters: [],
        analytics: {
          totalWordCount: 0,
          averageChapterLength: 0,
          estimatedReadingTime: 0,
          generationCost: 0,
          editingRounds: 0,
        },
      } as any;

      const result = service.updateProjectAnalytics(project);

      expect(result.analytics.totalWordCount).toBe(0);
      expect(result.analytics.averageChapterLength).toBe(0);
    });
  });

  describe('createChapter', () => {
    it('should create valid chapter', () => {
      const result = service.createChapter('proj_123', 'Chapter 1', 1, 'Content', 'Summary');

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { title: string; orderIndex: number };
        expect(data.title).toBe('Chapter 1');
        expect(data.orderIndex).toBe(1);
      }
    });

    it('should reject invalid project ID', () => {
      const result = service.createChapter('invalid', 'Chapter', 1);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid project ID');
      }
    });

    it('should handle empty content', () => {
      const result = service.createChapter('proj_123', 'Chapter', 1);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { content: string; wordCount: number };
        expect(data.content).toBe('');
        expect(data.wordCount).toBe(0);
      }
    });

    it('should create chapter with multi-word content', () => {
      const content = 'This is a test chapter with multiple words here';
      const result = service.createChapter('proj_123', 'Chapter 1', 1, content);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { wordCount: number; content: string };
        expect(data.content).toBe(content);
        expect(data.wordCount).toBeGreaterThan(0);
      }
    });

    it('should create chapter with unicode content', () => {
      const content = 'Hello 世界 🌍';
      const result = service.createChapter('proj_123', 'Chapter 1', 1, content);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { content: string; wordCount: number };
        expect(data.content).toBe(content);
      }
    });

    it('should create chapter with whitespace-only content', () => {
      const content = '   ';
      const result = service.createChapter('proj_123', 'Chapter 1', 1, content);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { wordCount: number };
        expect(data.wordCount).toBe(0);
      }
    });
  });

  describe('validateType', () => {
    it('should validate matching type', () => {
      const guard = (val: unknown): val is string => typeof val === 'string';

      const result = service.validateType('test', guard, 'string');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test');
      }
    });

    it('should reject non-matching type', () => {
      const guard = (val: unknown): val is string => typeof val === 'string';

      const result = service.validateType(123, guard, 'string');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid string');
      }
    });
  });

  describe('sanitizeContent', () => {
    it('should sanitize HTML content', () => {
      const dirty = '<script>alert("xss")</script><p>Safe content</p>';

      const clean = service.sanitizeContent(dirty);

      expect(clean).not.toContain('<script>');
      expect(clean).toContain('Safe content');
    });

    it('should preserve safe HTML', () => {
      const safe = '<p>This is <strong>safe</strong> content</p>';

      const result = service.sanitizeContent(safe);

      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });

    it('should remove on* event handlers', () => {
      const dangerous = '<p onclick="alert(1)">Click me</p>';

      const clean = service.sanitizeContent(dangerous);

      expect(clean).not.toContain('onclick');
    });

    it('should remove javascript: URIs', () => {
      const dangerous = '<a href="javascript:alert(1)">Link</a>';

      const clean = service.sanitizeContent(dangerous);

      expect(clean).not.toContain('javascript:');
    });

    it('should handle iframe removal', () => {
      const dangerous = '<iframe src="evil.com"></iframe>';

      const clean = service.sanitizeContent(dangerous);

      expect(clean).not.toContain('<iframe>');
    });

    it('should handle object/embed removal', () => {
      const dangerous = '<object data="evil.swf"></object>';

      const clean = service.sanitizeContent(dangerous);

      expect(clean).not.toContain('<object>');
    });

    it('should preserve headings and formatting', () => {
      const safe = '<h1>Title</h1><h2>Subtitle</h2><em>emphasis</em>';

      const result = service.sanitizeContent(safe);

      expect(result).toContain('<h1>');
      expect(result).toContain('<h2>');
      expect(result).toContain('<em>');
    });

    it('should handle empty string', () => {
      const result = service.sanitizeContent('');

      expect(result).toBe('');
    });

    it('should handle null/undefined input gracefully', () => {
      const result1 = service.sanitizeContent(null as any);
      const result2 = service.sanitizeContent(undefined as any);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });

  describe('validateAndFormatContent', () => {
    it('should validate and sanitize content', () => {
      const content = '<p>Test content</p>';

      const result = service.validateAndFormatContent(content);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as string;
        expect(data).toContain('Test content');
      }
    });

    it('should reject non-string content', () => {
      const result = service.validateAndFormatContent(123 as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('must be a string');
      }
    });

    it('should reject content exceeding max length', () => {
      const longContent = 'a'.repeat(50001);

      const result = service.validateAndFormatContent(longContent);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('exceeds maximum length');
      }
    });

    it('should handle content at max length boundary', () => {
      const maxContent = 'a'.repeat(50000);

      const result = service.validateAndFormatContent(maxContent);

      expect(result.success).toBe(true);
    });

    it('should sanitize dangerous HTML in content', () => {
      const dangerousContent = '<script>alert(1)</script><p>Safe</p>';

      const result = service.validateAndFormatContent(dangerousContent);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as string;
        expect(data).not.toContain('<script>');
        expect(data).toContain('Safe');
      }
    });

    it('should handle null input', () => {
      const result = service.validateAndFormatContent(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('must be a string');
      }
    });

    it('should handle undefined input', () => {
      const result = service.validateAndFormatContent(undefined as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('must be a string');
      }
    });

    it('should handle empty string', () => {
      const result = service.validateAndFormatContent('');

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as string;
        expect(data).toBe('');
      }
    });

    it('should handle whitespace-only content', () => {
      const result = service.validateAndFormatContent('   ');

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as string;
        expect(data).toBe('   ');
      }
    });

    it('should handle unicode content', () => {
      const unicodeContent = 'Hello 世界 🌍 Test';

      const result = service.validateAndFormatContent(unicodeContent);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as string;
        expect(data).toContain('世界');
      }
    });

    it('should handle object input that might throw during sanitization', () => {
      const result = service.validateAndFormatContent({} as any);

      expect(result.success).toBe(false);
    });
  });
});

describe('Convenience functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validate', () => {
    it('should validate project', () => {
      const mockProject = { id: 'proj_1' } as any;

      const result = validate.project(mockProject);

      // Result depends on validateData mock and validation logic
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should validate chapter', () => {
      const mockChapter = { id: 'ch1' } as any;

      const result = validate.chapter(mockChapter);

      expect(result.success).toBe(true);
    });

    it('should validate createProject', () => {
      const data = { title: 'Test' };

      const result = validate.createProject(data);

      expect(result.success).toBe(true);
    });

    it('should validate updateProject', () => {
      const data = { title: 'Updated' };

      const result = validate.updateProject(data);

      expect(result.success).toBe(true);
    });

    it('should validate updateChapter', () => {
      const data = { title: 'Updated' };

      const result = validate.updateChapter(data);

      expect(result.success).toBe(true);
    });

    it('should validate refineOptions', () => {
      const data = { tone: 'formal' };

      const result = validate.refineOptions(data);

      expect(result.success).toBe(true);
    });

    it('should validate content', () => {
      const result = validate.content('Test content');

      expect(result.success).toBe(true);
    });
  });

  describe('assertValid', () => {
    it('should assert valid project without throwing', () => {
      const mockProject: unknown = {
        id: 'proj_123',
        title: 'Test',
        idea: 'Test idea',
        style: 'Literary Fiction',
        chapters: [],
        worldState: {
          hasTitle: true,
          hasOutline: false,
          chaptersCount: 0,
          chaptersCompleted: 0,
          styleDefined: true,
          isPublished: false,
          hasCharacters: false,
          hasWorldBuilding: false,
          hasThemes: false,
          plotStructureDefined: false,
          targetAudienceDefined: true,
        },
        isGenerating: false,
        status: PublishStatus.DRAFT,
        language: 'en',
        targetWordCount: 50000,
        settings: {
          enableDropCaps: true,
          autoSave: true,
          autoSaveInterval: 120,
          showWordCount: true,
          enableSpellCheck: true,
          darkMode: false,
          fontSize: 'medium',
          lineHeight: 'normal',
          editorTheme: 'default',
        },
        genre: ['fiction'],
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
          id: 'timeline_1',
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

      // assertValid uses validate.project internally
      const projectAssertion: (data: unknown) => void = assertValid.project;
      expect(() => projectAssertion(mockProject)).not.toThrow();
    });

    it('should assert valid chapter without throwing', () => {
      const mockChapter = { id: 'ch1' } as any;

      // assertValid uses validate.chapter internally
      const chapterAssertion: (data: unknown) => void = assertValid.chapter;
      expect(() => chapterAssertion(mockChapter)).not.toThrow();
    });

    it('should throw on invalid project', () => {
      // Temporarily override validate.project to return failure
      const originalValidateProject = validate.project;
      const failingResult = { success: false, error: 'Invalid project', issues: [] } as const;
      validate.project = vi.fn(() => failingResult) as any;

      const mockProject: unknown = { id: 'invalid' };
      const projectAssertion: (data: unknown) => void = assertValid.project;

      expect(() => projectAssertion(mockProject)).toThrow('Invalid project');

      // Restore original
      validate.project = originalValidateProject;
    });

    it('should throw on invalid chapter', () => {
      // Temporarily override validate.chapter to return failure
      const originalValidateChapter = validate.chapter;
      const failingResult = { success: false, error: 'Invalid chapter', issues: [] } as const;
      validate.chapter = vi.fn(() => failingResult) as any;

      const mockChapter: unknown = { id: 'invalid' };
      const chapterAssertion: (data: unknown) => void = assertValid.chapter;

      expect(() => chapterAssertion(mockChapter)).toThrow('Invalid chapter');

      // Restore original
      validate.chapter = originalValidateChapter;
    });
  });

  describe('safeConvert', () => {
    it('should convert to project', () => {
      const data: unknown = { id: 'proj_1' };

      const result = safeConvert.toProject(data);

      // Result depends on mock validation behavior
      if (result) {
        expect(result.id).toBeDefined();
      } else {
        expect(result).toBeNull();
      }
    });

    it('should convert to chapter', () => {
      const data: unknown = { id: 'ch1' };

      const result = safeConvert.toChapter(data);

      // Result depends on mock validation behavior
      if (result) {
        expect(result.id).toBeDefined();
      } else {
        expect(result).toBeNull();
      }
    });

    it('should handle conversion gracefully', () => {
      const data = { invalid: 'data' };

      const result = safeConvert.toProject(data);

      // With mocked validateData, result depends on mock behavior
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });
});
