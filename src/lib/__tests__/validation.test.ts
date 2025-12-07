/**
 * Tests for the ValidationService
 * Ensures proper integration of schemas with business logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { z } from 'zod';

import { createProjectId } from '../../types/guards';
import type { Project } from '../../types';
import { ChapterStatus } from '../../shared/types';
import { validationService, validate, assertValid, safeConvert } from '../validation';

describe('ValidationService', () => {
  describe('Project Creation Validation', () => {
    it('should validate and create a complete project from minimal data', () => {
      const createData = {
        title: 'My Novel',
        style: 'Science Fiction',
        idea: 'A story about space exploration and the human spirit.',
        genre: ['science_fiction', 'adventure'],
        targetAudience: 'adult',
        language: 'en',
        targetWordCount: 75000,
      };

      const result = validationService.validateCreateProject(createData);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect((result.data as any).title).toBe('My Novel');
        expect((result.data as any).id).toMatch(/^proj_\d+$/);
        expect((result.data as any).worldState.hasTitle).toBe(true);
        expect((result.data as any).worldState.styleDefined).toBe(true);
        expect((result.data as any).worldState.targetAudienceDefined).toBe(true);
        expect((result.data as any).settings.enableDropCaps).toBe(true);
        expect((result.data as any).analytics.totalWordCount).toBe(0);
        expect((result.data as any).version).toBe('1.0.0');
        expect((result.data as any).changeLog).toHaveLength(1);
      }
    });

    it('should apply defaults for optional fields', () => {
      const createData = {
        title: 'Simple Novel',
        style: 'General Fiction',
        idea: 'A simple story.',
        genre: ['fiction'],
      };

      const result = validationService.validateCreateProject(createData);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect((result.data as any).targetWordCount).toBe(50000);
        expect((result.data as any).language).toBe('en');
        expect((result.data as any).targetAudience).toBe('adult');
        expect((result.data as any).settings.autoSave).toBe(true);
        expect((result.data as any).settings.autoSaveInterval).toBe(120);
      }
    });

    it('should reject invalid create data', () => {
      const invalidData = {
        title: '', // Empty title
        style: 'Invalid Style',
        idea: 'Too short',
        genre: [], // Empty genre array
      };

      const result = validationService.validateCreateProject(invalidData);
      expect(result.success).toBe(false);
      if (!result.success && 'error' in result) {
        expect(result.error).toContain('Validation failed');
      }
    });
  });

  describe('Project Integrity Validation', () => {
    let validProject: Project;

    beforeEach(() => {
      const createResult = validationService.validateCreateProject({
        title: 'Test Novel',
        style: 'General Fiction',
        idea: 'A test story for validation.',
        genre: ['fiction'],
      });

      if (createResult.success) {
        validProject = createResult.data as Project;
      }
    });

    it('should validate project integrity successfully', () => {
      const result = validationService.validateProjectIntegrity(validProject);
      expect(result.success).toBe(true);
    });

    it('should detect chapter count inconsistencies', () => {
      const testProject = structuredClone(validProject);
      testProject.chapters = [
        {
          id: `${testProject.id}_ch_manual_123`,
          orderIndex: 1,
          title: 'Chapter 1',
          summary: 'First chapter',
          content: 'Content here',
          status: ChapterStatus.COMPLETE,
          wordCount: 500,
          characterCount: 2500,
          estimatedReadingTime: 2,
          tags: [],
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      testProject.worldState.chaptersCount = 2; // Should be 1

      const result = validationService.validateProjectIntegrity(testProject);
      expect(result.success).toBe(false);
      if (!result.success && 'issues' in result) {
        expect(result.issues).toBeDefined();
        expect(result.issues?.length).toBeGreaterThan(0);

        // The validation should detect the chapter count inconsistency
        // (1 chapter in array but worldState says 2)
        const hasChapterCountIssue = result.issues?.some(
          (issue: z.ZodIssue) =>
            issue.code === 'custom' || issue.message?.includes('chapter') || issue.message?.includes('count'),
        );
        expect(hasChapterCountIssue).toBe(true);
      }
    });

    it('should detect completed chapters inconsistencies', () => {
      const testProject = structuredClone(validProject);
      testProject.chapters = [
        {
          id: `${testProject.id}_ch_manual_123`,
          orderIndex: 1,
          title: 'Chapter 1',
          summary: 'First chapter',
          content: 'Content here',
          status: ChapterStatus.COMPLETE,
          wordCount: 500,
          characterCount: 2500,
          estimatedReadingTime: 2,
          tags: [],
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      testProject.worldState.chaptersCount = 1;
      testProject.worldState.chaptersCompleted = 0; // Should be 1

      const result = validationService.validateProjectIntegrity(testProject);
      expect(result.success).toBe(false);
      if (!result.success && 'issues' in result) {
        // The validation should detect the completed count inconsistency
        // (1 complete chapter but worldState says 0 completed)
        const hasCompletedIssue = result.issues?.some(
          (issue: z.ZodIssue) =>
            issue.code === 'custom' || issue.message?.includes('completed') || issue.message?.includes('complete'),
        );
        expect(hasCompletedIssue).toBe(true);
      }
    });

    it('should detect duplicate chapter IDs', () => {
      const testProject = structuredClone(validProject);
      const chapterId = `${testProject.id}_ch_manual_123`;
      testProject.chapters = [
        {
          id: chapterId,
          orderIndex: 1,
          title: 'Chapter 1',
          summary: 'First chapter',
          content: 'Content here',
          status: ChapterStatus.PENDING,
          wordCount: 500,
          characterCount: 2500,
          estimatedReadingTime: 2,
          tags: [],
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: chapterId, // Duplicate ID
          orderIndex: 2,
          title: 'Chapter 2',
          summary: 'Second chapter',
          content: 'More content',
          status: ChapterStatus.PENDING,
          wordCount: 600,
          characterCount: 3000,
          estimatedReadingTime: 3,
          tags: [],
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      testProject.worldState.chaptersCount = 2;

      const result = validationService.validateProjectIntegrity(testProject);
      expect(result.success).toBe(false);
      if (!result.success && 'issues' in result) {
        expect(result.issues?.some((issue: z.ZodIssue) => issue.code === 'custom')).toBe(true);
      }
    });
  });

  describe('Chapter Validation', () => {
    it('should validate a complete chapter', () => {
      const chapterData = {
        id: 'proj_123_ch_manual_456',
        orderIndex: 1,
        title: 'Chapter 1: The Beginning',
        summary: 'Our story begins',
        content: 'Once upon a time, in a land far, far away...',
        status: ChapterStatus.PENDING,
        wordCount: 10,
        characterCount: 45,
        estimatedReadingTime: 1,
        tags: ['beginning'],
        notes: 'Important chapter',
      };

      const result = validationService.validateChapter(chapterData, 'proj_123');
      expect(result.success).toBe(true);
    });

    it('should reject chapter with mismatched word count', () => {
      const chapterData = {
        id: 'proj_123_ch_manual_456',
        orderIndex: 1,
        title: 'Chapter 1',
        summary: 'Summary',
        content: 'This is a test chapter with some content that should be counted.',
        status: ChapterStatus.PENDING,
        wordCount: 5, // Should be much higher
      };

      const result = validationService.validateChapter(chapterData);
      expect(result.success).toBe(false);
      if (!result.success && 'error' in result) {
        expect(result.error).toContain('word count does not match');
      }
    });

    it('should reject chapter with wrong project ID prefix', () => {
      const chapterData = {
        id: 'proj_456_ch_manual_789', // Wrong project ID
        orderIndex: 1,
        title: 'Chapter 1',
        summary: 'Summary',
        content: 'Content',
        status: ChapterStatus.PENDING,
        wordCount: 1,
      };

      const result = validationService.validateChapter(chapterData, 'proj_123');
      expect(result.success).toBe(false);
      if (!result.success && 'error' in result) {
        expect(result.error).toContain('Chapter ID must start with project ID');
      }
    });
  });

  describe('Chapter Creation Helper', () => {
    it('should create a valid chapter', () => {
      const projectId = createProjectId();
      const result = validationService.createChapter(
        projectId,
        'Chapter 1: The Adventure Begins',
        1,
        'This is the beginning of our tale. The hero awakens in a strange land.',
        'Hero awakens in strange land',
      );

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect((result.data as any).title).toBe('Chapter 1: The Adventure Begins');
        expect((result.data as any).orderIndex).toBe(1);
        expect((result.data as any).status).toBe('pending');
        expect((result.data as any).wordCount).toBeGreaterThan(0);
        expect((result.data as any).estimatedReadingTime).toBeGreaterThan(0);
      }
    });

    it('should reject invalid project ID', () => {
      const result = validationService.createChapter('invalid_id', 'Chapter 1', 1, 'Content');

      expect(result.success).toBe(false);
      if (!result.success && 'error' in result) {
        expect(result.error).toContain('Invalid project ID');
      }
    });
  });

  describe('Analytics Updates', () => {
    it('should calculate project analytics correctly', () => {
      const project = {
        id: 'proj_123',
        title: 'Test',
        idea: 'Test idea',
        style: 'General Fiction',
        chapters: [
          {
            id: 'proj_123_ch_manual_1',
            orderIndex: 1,
            title: 'Chapter 1',
            summary: 'First',
            content: 'Content',
            status: ChapterStatus.COMPLETE,
            wordCount: 1000,
            characterCount: 5000,
            estimatedReadingTime: 4,
            tags: [],
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'proj_123_ch_manual_2',
            orderIndex: 2,
            title: 'Chapter 2',
            summary: 'Second',
            content: 'More content',
            status: ChapterStatus.PENDING,
            wordCount: 1500,
            characterCount: 7500,
            estimatedReadingTime: 6,
            tags: [],
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        worldState: {
          hasTitle: true,
          hasOutline: false,
          chaptersCount: 2,
          chaptersCompleted: 1,
          styleDefined: true,
          isPublished: false,
        },
        isGenerating: false,
        status: 'Draft',
        language: 'en',
        targetWordCount: 50000,
        settings: { enableDropCaps: true },
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
          id: '550e8400-e29b-41d4-a716-446655440007',
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

      const result = validate.project(project);
      expect(result.success).toBe(true);
    });

    it('should validate content', () => {
      const result = validate.content('This is valid content.');
      expect(result.success).toBe(true);

      const longResult = validate.content('a'.repeat(50001));
      expect(longResult.success).toBe(false);
    });
  });

  describe('assertValid functions', () => {
    it('should assert valid projects without throwing', () => {
      const validProject = {
        id: 'proj_123',
        title: 'Test',
        idea: 'Test idea',
        style: 'General Fiction',
        chapters: [],
        worldState: {
          hasTitle: true,
          hasOutline: false,
          chaptersCount: 0,
          chaptersCompleted: 0,
          styleDefined: true,
          isPublished: false,
        },
        isGenerating: false,
        status: 'Draft',
        language: 'en',
        targetWordCount: 50000,
        settings: { enableDropCaps: true },
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
          id: '550e8400-e29b-41d4-a716-446655440006',
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

      expect(() => assertValid.project(validProject as any)).not.toThrow();
    });

    it('should throw for invalid projects', () => {
      const invalidProject = { invalid: 'data' };

      expect(() => assertValid.project(invalidProject as any)).toThrow('Invalid project');
    });
  });

  describe('safeConvert functions', () => {
    it('should safely convert valid data', () => {
      const validProject = {
        id: 'proj_123',
        title: 'Test',
        idea: 'Test idea',
        style: 'General Fiction',
        chapters: [],
        worldState: {
          hasTitle: true,
          hasOutline: false,
          chaptersCount: 0,
          chaptersCompleted: 0,
          styleDefined: true,
          isPublished: false,
        },
        isGenerating: false,
        status: 'Draft',
        language: 'en',
        targetWordCount: 50000,
        settings: { enableDropCaps: true },
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
          id: '550e8400-e29b-41d4-a716-446655440007',
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

      const result = safeConvert.toProject(validProject);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('proj_123');
    });

    it('should return null for invalid data', () => {
      const invalidProject = { invalid: 'data' };
      const result = safeConvert.toProject(invalidProject);
      expect(result).toBeNull();
    });
  });
});
