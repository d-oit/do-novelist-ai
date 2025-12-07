/**
 * Validation service for runtime type safety and error handling
 * Integrates Zod schemas with application logic
 */

import { ChapterStatus, PublishStatus } from '../shared/types';
import { createChapterId, createProjectId, isProjectId } from '../types/guards';
import {
  ChapterSchema,
  CreateProjectSchema,
  ProjectSchema,
  RefineOptionsSchema,
  UpdateChapterSchema,
  UpdateProjectSchema,
  validateData,
  type Chapter,
  type Project,
  type ValidationResult,
} from '../types/schemas';

// =============================================================================
// VALIDATION SERVICE CLASS
// =============================================================================

export class ValidationService {
  private static instance: ValidationService;

  private constructor() {}

  public static getInstance(): ValidationService {
    ValidationService.instance ??= new ValidationService();
    return ValidationService.instance;
  }

  // ==========================================================================
  // PROJECT VALIDATION
  // ==========================================================================

  /**
   * Validates and creates a new project from form data
   */
  public validateCreateProject(data: unknown): ValidationResult {
    try {
      // First validate the create project schema
      const createValidation = validateData(CreateProjectSchema, data, 'create project');
      if (!createValidation.success) {
        return createValidation;
      }

      // Transform to full project
      const projectId = createProjectId();
      const now = new Date();

      const fullProject: Project = {
        id: projectId,
        title: createValidation.data.title,
        idea: createValidation.data.idea,
        style: createValidation.data.style,
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
        language: createValidation.data.language,
        targetWordCount: createValidation.data.targetWordCount,
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
        genre: createValidation.data.genre,
        targetAudience: createValidation.data.targetAudience,
        contentWarnings: [],
        keywords: [],
        synopsis: '',
        createdAt: now,
        updatedAt: now,
        authors: [],
        analytics: {
          totalWordCount: 0,
          averageChapterLength: 0,
          estimatedReadingTime: 0,
          generationCost: 0,
          editingRounds: 0,
        },
        version: '1.0.0',
        changeLog: [
          {
            version: '1.0.0',
            changes: ['Project created'],
            timestamp: now,
          },
        ],
        timeline: {
          id: crypto.randomUUID(),
          projectId: projectId,
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

      // Validate the complete project
      return validateData(ProjectSchema, fullProject, 'full project');
    } catch (error) {
      return {
        success: false,
        error: `Project creation validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        issues: [],
      };
    }
  }

  /**
   * Validates project updates
   */
  public validateUpdateProject(data: unknown): ValidationResult {
    const validation = validateData(UpdateProjectSchema, data, 'update project');
    if (!validation.success) {
      return validation;
    }

    // Additional business logic validation
    if (validation.data.worldState) {
      const { chaptersCount, chaptersCompleted } = validation.data.worldState;
      if (chaptersCount !== undefined && chaptersCompleted !== undefined) {
        if (chaptersCompleted > chaptersCount) {
          return {
            success: false,
            error: 'Completed chapters cannot exceed total chapters',
            issues: [
              {
                path: ['worldState', 'chaptersCompleted'],
                message: 'Cannot exceed total chapters',
                code: 'custom' as const,
              },
            ],
          };
        }
      }
    }

    return validation;
  }

  /**
   * Validates complete project integrity
   */
  public validateProjectIntegrity(project: Project): ValidationResult {
    try {
      // Basic schema validation
      const schemaValidation = validateData(ProjectSchema, project, 'project integrity');
      if (!schemaValidation.success) {
        return schemaValidation;
      }

      const validatedProject = schemaValidation.data;

      // Cross-field validation
      const issues: { path: (string | number)[]; message: string; code: 'custom' }[] = [];

      // Check chapters consistency
      const actualChapterCount = validatedProject.chapters.length;
      const worldStateChapterCount = validatedProject.worldState.chaptersCount;
      if (actualChapterCount !== worldStateChapterCount) {
        issues.push({
          path: ['worldState', 'chaptersCount'],
          message: `World state shows ${worldStateChapterCount} chapters but project has ${actualChapterCount}`,
          code: 'custom' as const,
        });
      }

      // Check completed chapters consistency
      const actualCompletedCount = validatedProject.chapters.filter(
        c => c.status === ChapterStatus.COMPLETE,
      ).length;

      const worldStateCompletedCount = validatedProject.worldState.chaptersCompleted;
      if (actualCompletedCount !== worldStateCompletedCount) {
        issues.push({
          path: ['worldState', 'chaptersCompleted'],
          message: `World state shows ${worldStateCompletedCount} completed chapters but ${actualCompletedCount} are actually complete`,
          code: 'custom' as const,
        });
      }

      // Check chapter order indices
      const orderIndices = validatedProject.chapters.map(c => c.orderIndex).sort((a, b) => a - b);
      for (let i = 0; i < orderIndices.length; i++) {
        if (orderIndices[i] !== i + 1) {
          issues.push({
            path: ['chapters', i, 'orderIndex'],
            message: `Chapter order index should be ${i + 1} but is ${orderIndices[i]}`,
            code: 'custom' as const,
          });
          break;
        }
      }

      // Check for duplicate chapter IDs
      const chapterIds = new Set();
      validatedProject.chapters.forEach((chapter, index) => {
        if (chapterIds.has(chapter.id)) {
          issues.push({
            path: ['chapters', index, 'id'],
            message: `Duplicate chapter ID: ${chapter.id}`,
            code: 'custom' as const,
          });
        }
        chapterIds.add(chapter.id);
      });

      if (issues.length > 0) {
        return {
          success: false,
          error: `Project integrity validation failed: ${issues.length} issue(s) found`,
          issues,
        };
      }

      return { success: true, data: validatedProject };
    } catch (error) {
      return {
        success: false,
        error: `Project integrity validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        issues: [],
      };
    }
  }

  // ==========================================================================
  // CHAPTER VALIDATION
  // ==========================================================================

  /**
   * Validates chapter creation/updates
   */
  public validateChapter(data: unknown, projectId?: string): ValidationResult {
    try {
      const validation = validateData(ChapterSchema, data, 'chapter');
      if (!validation.success) {
        return validation;
      }

      const chapter = validation.data;

      // Additional business logic validation
      if (projectId != null && !chapter.id.startsWith(projectId)) {
        return {
          success: false,
          error: 'Chapter ID must start with project ID',
          issues: [
            {
              path: ['id'],
              message: `Chapter ID must start with project ID: ${projectId}`,
              code: 'custom' as const,
            },
          ],
        };
      }

      // Validate word count matches content
      const actualWordCount = this.countWords(chapter.content);
      if (Math.abs(chapter.wordCount - actualWordCount) > 5) {
        // Allow small variance
        return {
          success: false,
          error: 'Chapter word count does not match content',
          issues: [
            {
              path: ['wordCount'],
              message: `Word count is ${chapter.wordCount} but content has ${actualWordCount} words`,
              code: 'custom' as const,
            },
          ],
        };
      }

      return { success: true, data: chapter };
    } catch (error) {
      return {
        success: false,
        error: `Chapter validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        issues: [],
      };
    }
  }

  /**
   * Validates chapter updates
   */
  public validateUpdateChapter(data: unknown): ValidationResult {
    const validation = validateData(UpdateChapterSchema, data, 'update chapter');
    if (!validation.success) {
      return validation;
    }

    // If content is being updated, validate word count
    if (validation.data.content !== undefined) {
      const wordCount = this.countWords(validation.data.content);
      if (
        validation.data.wordCount !== undefined &&
        Math.abs(validation.data.wordCount - wordCount) > 5
      ) {
        return {
          success: false,
          error: 'Word count does not match content',
          issues: [
            {
              path: ['wordCount'],
              message: `Provided word count ${validation.data.wordCount} does not match actual word count ${wordCount}`,
              code: 'custom' as const,
            },
          ],
        };
      }
    }

    return validation;
  }

  // ==========================================================================
  // AI VALIDATION
  // ==========================================================================

  /**
   * Validates refine options for AI operations
   */
  public validateRefineOptions(data: unknown): ValidationResult {
    return validateData(RefineOptionsSchema, data, 'refine options');
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Counts words in text content
   */
  private countWords(text: string): number {
    if (!text || text.trim().length === 0) return 0;
    return text.trim().split(/\s+/).length;
  }

  /**
   * Calculates estimated reading time (average 250 words per minute)
   */
  public calculateReadingTime(wordCount: number): number {
    return Math.ceil(wordCount / 250);
  }

  /**
   * Validates and updates analytics for a project
   */
  public updateProjectAnalytics(project: Project): Project {
    const totalWordCount = project.chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0);
    const averageChapterLength =
      project.chapters.length > 0 ? totalWordCount / project.chapters.length : 0;
    const estimatedReadingTime = this.calculateReadingTime(totalWordCount);

    return {
      ...project,
      analytics: {
        ...project.analytics,
        totalWordCount,
        averageChapterLength: Math.round(averageChapterLength),
        estimatedReadingTime,
      },
      updatedAt: new Date(),
    };
  }

  /**
   * Creates a new chapter with proper validation
   */
  public createChapter(
    projectId: string,
    title: string,
    orderIndex: number,
    content = '',
    summary = '',
  ): ValidationResult {
    try {
      if (!isProjectId(projectId)) {
        return {
          success: false,
          error: 'Invalid project ID',
          issues: [],
        };
      }

      const chapterId = createChapterId(projectId);
      const now = new Date();
      const wordCount = this.countWords(content);

      const chapter: Chapter = {
        id: chapterId,
        orderIndex,
        title,
        summary,
        content,
        status: ChapterStatus.PENDING,

        wordCount,
        characterCount: content.length,
        estimatedReadingTime: this.calculateReadingTime(wordCount),
        tags: [],
        notes: '',
        createdAt: now,
        updatedAt: now,
      };

      return this.validateChapter(chapter, projectId);
    } catch (error) {
      return {
        success: false,
        error: `Chapter creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        issues: [],
      };
    }
  }

  /**
   * Validates data structure matches expected type
   */
  public validateType<T>(
    data: unknown,
    guard: (value: unknown) => value is T,
    typeName: string,
  ): ValidationResult {
    if (guard(data)) {
      return { success: true, data };
    }
    return {
      success: false,
      error: `Invalid ${typeName}`,
      issues: [],
    };
  }

  /**
   * Sanitizes HTML content for chapters
   */
  public sanitizeContent(content: string): string {
    // Basic HTML sanitization (in production, use a proper library like DOMPurify)
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/javascript:/gi, '');
  }

  /**
   * Validates and formats chapter content
   */
  public validateAndFormatContent(content: string): ValidationResult {
    try {
      if (typeof content !== 'string') {
        return {
          success: false,
          error: 'Content must be a string',
          issues: [],
        };
      }

      if (content.length > 50000) {
        return {
          success: false,
          error: 'Content exceeds maximum length of 50,000 characters',
          issues: [
            {
              path: ['content'],
              message: 'Content too long',
              code: 'custom' as const,
            },
          ],
        };
      }

      const sanitizedContent = this.sanitizeContent(content);
      return { success: true, data: sanitizedContent };
    } catch (error) {
      return {
        success: false,
        error: `Content validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        issues: [],
      };
    }
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const validationService = ValidationService.getInstance();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick validation functions for common use cases
 */
export const validate = {
  project: (data: unknown): ValidationResult =>
    validationService.validateProjectIntegrity(data as Project),
  chapter: (data: unknown, projectId?: string): ValidationResult =>
    validationService.validateChapter(data, projectId),
  createProject: (data: unknown): ValidationResult => validationService.validateCreateProject(data),
  updateProject: (data: unknown): ValidationResult => validationService.validateUpdateProject(data),
  updateChapter: (data: unknown): ValidationResult => validationService.validateUpdateChapter(data),
  refineOptions: (data: unknown): ValidationResult => validationService.validateRefineOptions(data),
  content: (content: string): ValidationResult =>
    validationService.validateAndFormatContent(content),
};

/**
 * Type assertion helpers with validation
 */
export const assertValid = {
  project: (data: unknown): asserts data is Project => {
    const result = validate.project(data);
    if (!result.success) {
      throw new Error(`Invalid project: ${result.error}`);
    }
  },
  chapter: (data: unknown): asserts data is Chapter => {
    const result = validate.chapter(data);
    if (!result.success) {
      throw new Error(`Invalid chapter: ${result.error}`);
    }
  },
};

/**
 * Safe conversion helpers
 */
export const safeConvert = {
  toProject: (data: unknown): Project | null => {
    const result = validate.project(data);
    return result.success ? (result.data as Project) : null;
  },
  toChapter: (data: unknown): Chapter | null => {
    const result = validate.chapter(data);
    return result.success ? (result.data as Chapter) : null;
  },
};
