/**
 * Comprehensive tests for Zod schemas and type validation
 * Ensures runtime type safety and schema correctness
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  ProjectSchema,
  ChapterSchema,
  CreateProjectSchema,
  WorldStateSchema,
  validateData,
  ProjectSettingsSchema,
  RefineOptionsSchema,
  isValidData,
} from '../schemas';

describe('Schema Validation Tests', () => {
  describe('WorldStateSchema', () => {
    it('should validate a complete world state', () => {
      const validWorldState = {
        hasTitle: true,
        hasOutline: false,
        chaptersCount: 5,
        chaptersCompleted: 2,
        styleDefined: true,
        isPublished: false,
        hasCharacters: true,
        hasWorldBuilding: false,
        hasThemes: true,
        plotStructureDefined: false,
        targetAudienceDefined: true,
      };

      const result = validateData(WorldStateSchema, validWorldState);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect((result.data as any).chaptersCount).toBe(5);
        expect((result.data as any).hasCharacters).toBe(true);
      }
    });

    it('should apply defaults for missing optional fields', () => {
      const minimalWorldState = {
        hasTitle: true,
        hasOutline: false,
        chaptersCount: 0,
        chaptersCompleted: 0,
        styleDefined: true,
        isPublished: false,
      };

      const result = validateData(WorldStateSchema, minimalWorldState);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect((result.data as any).hasCharacters).toBe(false);
        expect((result.data as any).hasWorldBuilding).toBe(false);
        expect((result.data as any).hasThemes).toBe(false);
      }
    });

    it('should reject invalid chapter counts', () => {
      const invalidWorldState = {
        hasTitle: true,
        hasOutline: false,
        chaptersCount: 5,
        chaptersCompleted: 10, // More completed than total
        styleDefined: true,
        isPublished: false,
      };

      const result = validateData(WorldStateSchema, invalidWorldState);
      expect(result.success).toBe(false);
    });
  });

  describe('ChapterSchema', () => {
    it('should validate a complete chapter', () => {
      const validChapter = {
        id: 'proj_123_ch_manual_456',
        orderIndex: 1,
        title: 'Chapter 1: The Beginning',
        summary: 'Our hero starts their journey.',
        content: 'Once upon a time, in a land far, far away...',
        status: 'complete',
        wordCount: 2500,
        characterCount: 12500,
        estimatedReadingTime: 10,
        tags: ['adventure', 'beginning'],
        notes: 'This chapter sets the tone for the entire story.',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const result = validateData(ChapterSchema, validChapter);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.orderIndex).toBe(1);
        expect(result.data.tags).toEqual(['adventure', 'beginning']);
        expect(result.data.estimatedReadingTime).toBe(10);
      }
    });

    it('should apply defaults for optional fields', () => {
      const minimalChapter = {
        id: 'proj_123_ch_manual_456',
        orderIndex: 1,
        title: 'Chapter 1',
        summary: 'A chapter',
        content: 'Some content here',
        status: 'pending',
      };

      const result = validateData(ChapterSchema, minimalChapter);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.wordCount).toBe(0);
        expect(result.data.characterCount).toBe(0);
        expect(result.data.tags).toEqual([]);
        expect(result.data.notes).toBe('');
        expect(result.data.createdAt).toBeInstanceOf(Date);
        expect(result.data.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('should reject invalid chapter IDs', () => {
      const invalidChapter = {
        id: 'invalid_id_format',
        orderIndex: 1,
        title: 'Chapter 1',
        summary: 'A chapter',
        content: 'Some content',
        status: 'pending',
      };

      const result = validateData(ChapterSchema, invalidChapter);
      expect(result.success).toBe(false);
    });

    it('should reject content that is too long', () => {
      const longContent = 'a'.repeat(50001); // Exceeds 50,000 character limit

      const invalidChapter = {
        id: 'proj_123_ch_manual_456',
        orderIndex: 1,
        title: 'Chapter 1',
        summary: 'A chapter',
        content: longContent,
        status: 'pending',
      };

      const result = validateData(ChapterSchema, invalidChapter);
      expect(result.success).toBe(false);
    });
  });

  describe('ProjectSettingsSchema', () => {
    it('should validate complete project settings', () => {
      const validSettings = {
        enableDropCaps: true,
        autoSave: true,
        autoSaveInterval: 300,
        showWordCount: true,
        enableSpellCheck: false,
        darkMode: true,
        fontSize: 'large',
        lineHeight: 'relaxed',
        editorTheme: 'typewriter',
      };

      const result = validateData(ProjectSettingsSchema, validSettings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fontSize).toBe('large');
        expect(result.data.autoSaveInterval).toBe(300);
      }
    });

    it('should apply defaults for missing fields', () => {
      const minimalSettings = {};

      const result = validateData(ProjectSettingsSchema, minimalSettings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enableDropCaps).toBe(true);
        expect(result.data.autoSave).toBe(true);
        expect(result.data.autoSaveInterval).toBe(120);
        expect(result.data.fontSize).toBe('medium');
        expect(result.data.editorTheme).toBe('default');
      }
    });

    it('should reject invalid auto-save intervals', () => {
      const invalidSettings = {
        autoSaveInterval: 10, // Too short (minimum is 30)
      };

      const result = validateData(ProjectSettingsSchema, invalidSettings);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateProjectSchema', () => {
    it('should validate project creation data', () => {
      const validCreateData = {
        title: 'My Amazing Novel',
        style: 'Science Fiction',
        idea: 'A story about time travel and its consequences on humanity.',
        targetWordCount: 75000,
        language: 'en',
        genre: ['science_fiction', 'adventure'],
        targetAudience: 'adult',
      };

      const result = validateData(CreateProjectSchema, validCreateData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('My Amazing Novel');
        expect(result.data.targetWordCount).toBe(75000);
        expect(result.data.genre).toEqual(['science_fiction', 'adventure']);
      }
    });

    it('should apply defaults for optional fields', () => {
      const minimalCreateData = {
        title: 'Test Novel',
        style: 'General Fiction',
        idea: 'A simple story about life.',
        genre: ['fiction'],
      };

      const result = validateData(CreateProjectSchema, minimalCreateData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.targetWordCount).toBe(50000);
        expect(result.data.language).toBe('en');
        expect(result.data.targetAudience).toBe('adult');
      }
    });

    it('should reject titles that are too long', () => {
      const invalidCreateData = {
        title: 'a'.repeat(201), // Exceeds 200 character limit
        style: 'General Fiction',
        idea: 'A story',
        genre: ['fiction'],
      };

      const result = validateData(CreateProjectSchema, invalidCreateData);
      expect(result.success).toBe(false);
    });

    it('should require at least one genre', () => {
      const invalidCreateData = {
        title: 'Test Novel',
        style: 'General Fiction',
        idea: 'A story',
        genre: [], // Empty genre array
      };

      const result = validateData(CreateProjectSchema, invalidCreateData);
      expect(result.success).toBe(false);
    });
  });

  describe('RefineOptionsSchema', () => {
    it('should validate complete refine options', () => {
      const validOptions = {
        model: 'gemini-2.0-flash-exp',
        temperature: 0.8,
        maxTokens: 4000,
        topP: 0.9,
        focusAreas: ['grammar', 'style', 'pacing'],
        preserveLength: true,
        targetTone: 'dramatic',
      };

      const result = validateData(RefineOptionsSchema, validOptions);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe('gemini-2.0-flash-exp');
        expect(result.data.focusAreas).toEqual(['grammar', 'style', 'pacing']);
        expect(result.data.preserveLength).toBe(true);
      }
    });

    it('should apply defaults for optional fields', () => {
      const minimalOptions = {
        model: 'gemini-1.5-pro',
      };

      const result = validateData(RefineOptionsSchema, minimalOptions);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.temperature).toBe(0.7);
        expect(result.data.maxTokens).toBe(2000);
        expect(result.data.topP).toBe(0.95);
        expect(result.data.focusAreas).toEqual(['grammar', 'style']);
        expect(result.data.preserveLength).toBe(false);
      }
    });

    it('should reject invalid temperature values', () => {
      const invalidOptions = {
        model: 'gemini-1.5-pro',
        temperature: 3.0, // Exceeds maximum of 2.0
      };

      const result = validateData(RefineOptionsSchema, invalidOptions);
      expect(result.success).toBe(false);
    });

    it('should reject invalid models', () => {
      const invalidOptions = {
        model: 'gpt-4', // Not in allowed enum
      };

      const result = validateData(RefineOptionsSchema, invalidOptions);
      expect(result.success).toBe(false);
    });
  });

  describe('ProjectSchema', () => {
    let validProject: any;

    beforeEach(() => {
      validProject = {
        id: 'proj_1234567890',
        title: 'Test Novel',
        idea: 'A compelling story about adventure.',
        style: 'General Fiction',
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
        status: 'Draft',
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
      };
    });

    it('should validate a complete project', () => {
      const result = validateData(ProjectSchema, validProject);
      expect(result.success).toBe(true);
    });

    it('should enforce chapter count consistency', () => {
      validProject.chapters = [
        {
          id: 'proj_1234567890_ch_manual_001',
          orderIndex: 1,
          title: 'Chapter 1',
          summary: 'First chapter',
          content: 'Content here',
          status: 'complete',
          wordCount: 1000,
          characterCount: 5000,
          estimatedReadingTime: 4,
          tags: [],
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      validProject.worldState.chaptersCount = 2; // Inconsistent with actual chapters

      const result = validateData(ProjectSchema, validProject);
      expect(result.success).toBe(false);
    });

    it('should enforce completed chapters consistency', () => {
      validProject.chapters = [
        {
          id: 'proj_1234567890_ch_manual_001',
          orderIndex: 1,
          title: 'Chapter 1',
          summary: 'First chapter',
          content: 'Content here',
          status: 'complete',
          wordCount: 1000,
          characterCount: 5000,
          estimatedReadingTime: 4,
          tags: [],
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      validProject.worldState.chaptersCount = 1;
      validProject.worldState.chaptersCompleted = 0; // Should be 1

      const result = validateData(ProjectSchema, validProject);
      expect(result.success).toBe(false);
    });

    it('should reject invalid project IDs', () => {
      validProject.id = 'invalid_format';

      const result = validateData(ProjectSchema, validProject);
      expect(result.success).toBe(false);
    });

    it('should reject invalid word counts', () => {
      validProject.targetWordCount = 500; // Below minimum of 1000

      const result = validateData(ProjectSchema, validProject);
      expect(result.success).toBe(false);
    });
  });

  describe('isValidData helper', () => {
    it('should return true for valid data', () => {
      const validSettings = {
        enableDropCaps: true,
        autoSave: true,
      };

      expect(isValidData(ProjectSettingsSchema, validSettings)).toBe(true);
    });

    it('should return false for invalid data', () => {
      const invalidSettings = {
        enableDropCaps: 'yes', // Should be boolean
      };

      expect(isValidData(ProjectSettingsSchema, invalidSettings)).toBe(false);
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  it('should handle null and undefined inputs', () => {
    expect(isValidData(ProjectSchema, null)).toBe(false);
    expect(isValidData(ProjectSchema, undefined)).toBe(false);
    expect(isValidData(ChapterSchema, null)).toBe(false);
    expect(isValidData(ChapterSchema, undefined)).toBe(false);
  });

  it('should handle malformed data gracefully', () => {
    const malformedData = {
      id: 123, // Wrong type
      title: null, // Wrong type
      chapters: 'not an array', // Wrong type
    };

    const result = validateData(ProjectSchema, malformedData);
    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error('Expected validation failure for malformed project data');
    }

    expect(result.error).toContain('Validation failed');
  });

  it('should provide detailed error messages', () => {
    const invalidChapter = {
      id: 'valid_proj_123_ch_manual_456',
      orderIndex: 'one', // Wrong type
      title: '', // Empty string
      summary: 'A'.repeat(1001), // Too long
      content: 'Content',
      status: 'invalid_status', // Invalid enum
    };

    const result = validateData(ChapterSchema, invalidChapter);
    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error('Expected validation failure for invalid chapter data');
    }

    expect(result.issues.length).toBeGreaterThan(0);
  });
});
