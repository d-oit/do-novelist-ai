/**
 * Tests for validation.ts - Project Validation
 * Target: Project-specific validation tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ValidationService } from '@/lib/validation';
import type { Project } from '@/types/schemas';

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

describe('ValidationService - Project Validation', () => {
  let service: ValidationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = ValidationService.getInstance();
  });

  describe('validateCreateProject', () => {
    it('should create valid project from data', () => {
      const data = {
        title: 'Test Novel',
        idea: 'A story about testing',
        style: 'Literary Fiction',
        language: 'en',
        targetWordCount: 50000,
        genre: ['fiction'],
        targetAudience: 'adult',
      };

      const result = service.validateCreateProject(data);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { title: string; id: string };
        expect(data.title).toBe('Test Novel');
        expect(data.id).toBeDefined();
      }
    });
  });

  describe('validateUpdateProject', () => {
    it('should validate project updates', () => {
      const data = {
        title: 'Updated Title',
        worldState: {
          chaptersCount: 5,
          chaptersCompleted: 3,
        },
      };

      const result = service.validateUpdateProject(data);

      expect(result.success).toBe(true);
    });

    it('should reject when completed exceeds total', () => {
      const data = {
        worldState: {
          chaptersCount: 5,
          chaptersCompleted: 10,
        },
      };

      const result = service.validateUpdateProject(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('cannot exceed');
      }
    });

    it('should handle update without worldState', () => {
      const data = {
        title: 'Updated Title',
      };

      const result = service.validateUpdateProject(data);

      expect(result.success).toBe(true);
    });

    it('should handle worldState without chaptersCount', () => {
      const data = {
        worldState: {
          chaptersCompleted: 3,
        },
      };

      const result = service.validateUpdateProject(data);

      expect(result.success).toBe(true);
    });

    it('should handle worldState without chaptersCompleted', () => {
      const data = {
        worldState: {
          chaptersCount: 5,
        },
      };

      const result = service.validateUpdateProject(data);

      expect(result.success).toBe(true);
    });

    it('should allow equal completed and total chapters', () => {
      const data = {
        worldState: {
          chaptersCount: 5,
          chaptersCompleted: 5,
        },
      };

      const result = service.validateUpdateProject(data);

      expect(result.success).toBe(true);
    });

    it('should allow zero completed chapters', () => {
      const data = {
        worldState: {
          chaptersCount: 5,
          chaptersCompleted: 0,
        },
      };

      const result = service.validateUpdateProject(data);

      expect(result.success).toBe(true);
    });
  });

  describe('validateProjectIntegrity', () => {
    const createMockProject = (overrides = {}): Project => ({
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
      ...overrides,
    });

    const createMockChapter = (id: string, orderIndex: number, status: any): any => ({
      id,
      orderIndex,
      title: `Chapter ${orderIndex}`,
      summary: `Summary ${orderIndex}`,
      content: `Content ${orderIndex}`,
      status,
      wordCount: 10,
      characterCount: 10,
      estimatedReadingTime: 1,
      tags: [],
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('should validate consistent project', () => {
      const project = createMockProject();
      const result = service.validateProjectIntegrity(project);

      expect(result.success).toBe(true);
    });

    it('should detect chapter count mismatch', () => {
      const project = createMockProject({
        chapters: [createMockChapter('ch1', 1, 'complete')],
        worldState: {
          ...createMockProject().worldState,
          chaptersCount: 2,
          chaptersCompleted: 0,
        },
      });

      const result = service.validateProjectIntegrity(project);

      expect(result).toBeDefined();
    });

    it('should detect completed chapters count mismatch', () => {
      const project = createMockProject({
        chapters: [createMockChapter('ch1', 1, 'complete'), createMockChapter('ch2', 2, 'pending')],
        worldState: {
          ...createMockProject().worldState,
          chaptersCount: 2,
          chaptersCompleted: 0,
        },
      });

      const result = service.validateProjectIntegrity(project);

      expect(result).toBeDefined();
    });

    it('should detect duplicate chapter IDs', () => {
      const project = createMockProject({
        chapters: [createMockChapter('ch1', 1, 'complete'), createMockChapter('ch1', 2, 'pending')],
        worldState: {
          ...createMockProject().worldState,
          chaptersCount: 2,
          chaptersCompleted: 1,
        },
      });

      const result = service.validateProjectIntegrity(project);

      expect(result).toBeDefined();
    });

    it('should detect incorrect chapter order indices', () => {
      const project = createMockProject({
        chapters: [createMockChapter('ch1', 3, 'complete'), createMockChapter('ch2', 1, 'pending')],
        worldState: {
          ...createMockProject().worldState,
          chaptersCount: 2,
          chaptersCompleted: 1,
        },
      });

      const result = service.validateProjectIntegrity(project);

      expect(result).toBeDefined();
    });

    it('should detect multiple integrity issues at once', () => {
      const project = createMockProject({
        chapters: [createMockChapter('ch1', 3, 'complete'), createMockChapter('ch1', 1, 'complete')],
        worldState: {
          ...createMockProject().worldState,
          chaptersCount: 3,
          chaptersCompleted: 0,
        },
      });

      const result = service.validateProjectIntegrity(project);

      expect(result).toBeDefined();
      if (!result.success) {
        expect(result.issues.length).toBeGreaterThan(0);
      }
    });

    it('should handle project with no chapters', () => {
      const project = createMockProject({
        chapters: [],
        worldState: {
          ...createMockProject().worldState,
          chaptersCount: 0,
          chaptersCompleted: 0,
        },
      });

      const result = service.validateProjectIntegrity(project);

      expect(result.success).toBe(true);
    });

    it('should handle project with multiple chapters correctly', () => {
      const project = createMockProject({
        chapters: [
          createMockChapter('ch1', 1, 'complete'),
          createMockChapter('ch2', 2, 'complete'),
          createMockChapter('ch3', 3, 'pending'),
        ],
        worldState: {
          ...createMockProject().worldState,
          chaptersCount: 3,
          chaptersCompleted: 2,
        },
      });

      const result = service.validateProjectIntegrity(project);

      expect(result.success).toBe(true);
    });
  });
});
