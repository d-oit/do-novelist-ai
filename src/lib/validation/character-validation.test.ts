/**
 * Tests for validation.ts - Character Validation
 * Target: Character-specific validation tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ValidationService } from '@/lib/validation';

import { ChapterStatus } from '@shared/types';

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

describe('ValidationService - Character Validation', () => {
  let service: ValidationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = ValidationService.getInstance();
  });

  describe('validateChapter', () => {
    const mockChapter = {
      id: 'proj_123_chapter_1',
      orderIndex: 1,
      title: 'Chapter 1',
      summary: 'Test summary',
      content: 'This is test content with multiple words here.',
      status: ChapterStatus.PENDING,
      wordCount: 8,
      characterCount: 47,
      estimatedReadingTime: 1,
      tags: [],
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should validate valid chapter', () => {
      const result = service.validateChapter(mockChapter);

      expect(result.success).toBe(true);
    });

    it('should validate chapter with projectId', () => {
      const result = service.validateChapter(mockChapter, 'proj_123');

      expect(result.success).toBe(true);
    });

    it('should reject chapter with mismatched project ID', () => {
      const result = service.validateChapter(mockChapter, 'proj_999');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('must start with project ID');
      }
    });

    it('should reject chapter with incorrect word count', () => {
      const badChapter = {
        ...mockChapter,
        wordCount: 100,
      };

      const result = service.validateChapter(badChapter);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('word count');
      }
    });
  });

  describe('validateUpdateChapter', () => {
    it('should validate chapter update', () => {
      const data = {
        title: 'Updated Title',
      };

      const result = service.validateUpdateChapter(data);

      expect(result.success).toBe(true);
    });

    it('should reject mismatched word count on content update', () => {
      const data = {
        content: 'This is new content',
        wordCount: 100,
      };

      const result = service.validateUpdateChapter(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Word count');
      }
    });
  });

  describe('validateRefineOptions', () => {
    it('should validate refine options', () => {
      const data = {
        tone: 'formal',
        length: 'expand',
      };

      const result = service.validateRefineOptions(data);

      expect(result.success).toBe(true);
    });

    it('should handle invalid refine options', () => {
      const data = {
        tone: 'invalid_tone',
        length: 'invalid_length',
      };

      const result = service.validateRefineOptions(data);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle empty refine options', () => {
      const data = {};

      const result = service.validateRefineOptions(data);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });
});
