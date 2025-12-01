/**
 * Zod schemas for runtime validation and type inference
 * Following feature-based architecture with strict type safety
 */

import { z } from 'zod';

import { ChapterStatus, PublishStatus } from '../shared/types';

// Re-export enums for convenience
export { ChapterStatus, PublishStatus };

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export const WRITING_STYLES = [
  'General Fiction',
  'Literary Fiction',
  'Mystery & Thriller',
  'Romance',
  'Science Fiction',
  'Fantasy',
  'Horror',
  'Historical Fiction',
  'Young Adult',
  "Children's Literature",
  'Non-Fiction',
  'Biography & Memoir',
  'Self-Help',
  'Business & Economics',
  'Technical Writing',
] as const;

export const LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'] as const;

// Chapter status enum values - must match the enum in ../shared/types
export const CHAPTER_STATUSES = ['pending', 'drafting', 'review', 'complete'] as const;

export const AgentModeSchema = z.enum(['SINGLE', 'PARALLEL', 'HYBRID', 'SWARM']);
export const ChapterStatusSchema = z.nativeEnum(ChapterStatus);
export const PublishStatusSchema = z.nativeEnum(PublishStatus);
export const LogTypeSchema = z.enum(['info', 'success', 'warning', 'error', 'thought']);
export const LanguageSchema = z.enum(LANGUAGES);

// Writing styles with proper validation
export const WritingStyleSchema = z.enum(WRITING_STYLES);

// =============================================================================
// BASE SCHEMAS
// =============================================================================

// Enhanced ID validation with specific patterns
export const ProjectIdSchema = z.string().regex(/^proj_\d+$/, 'Invalid project ID format');
export const ChapterIdSchema = z.string().regex(/^.+_ch_.+_\d+$/, 'Invalid chapter ID format');
export const LogIdSchema = z.string().uuid('Invalid log ID format');

// Base64 image validation
export const Base64ImageSchema = z
  .string()
  .regex(/^data:image\/(png|jpg|jpeg|gif|webp);base64,/, 'Invalid base64 image format')
  .optional();

// Word count validation
export const WordCountSchema = z.number().int().min(1000).max(500000);

// Temperature validation for AI models
export const TemperatureSchema = z.number().min(0).max(2);

// =============================================================================
// CORE DOMAIN SCHEMAS
// =============================================================================

export const WorldStateSchema = z
  .object({
    hasTitle: z.boolean(),
    hasOutline: z.boolean(),
    chaptersCount: z.number().int().min(0).max(100),
    chaptersCompleted: z.number().int().min(0),
    styleDefined: z.boolean(),
    isPublished: z.boolean(),
    // Enhanced world state
    hasCharacters: z.boolean().default(false),
    hasWorldBuilding: z.boolean().default(false),
    hasThemes: z.boolean().default(false),
    plotStructureDefined: z.boolean().default(false),
    targetAudienceDefined: z.boolean().default(false),
  })
  .refine(data => data.chaptersCompleted <= data.chaptersCount, {
    message: 'Completed chapters cannot exceed total chapters',
    path: ['chaptersCompleted'],
  });

export const ProjectSettingsSchema = z
  .object({
    enableDropCaps: z.boolean().default(true),
    autoSave: z.boolean().default(true),
    autoSaveInterval: z.number().int().min(30).max(3600).default(120), // seconds
    showWordCount: z.boolean().default(true),
    enableSpellCheck: z.boolean().default(true),
    darkMode: z.boolean().default(false),
    fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
    lineHeight: z.enum(['compact', 'normal', 'relaxed']).default('normal'),
    editorTheme: z.enum(['default', 'minimal', 'typewriter']).default('default'),
  })
  .partial();

export const ChapterSchema = z.object({
  id: ChapterIdSchema,
  orderIndex: z.number().int().min(1),
  title: z.string().min(1).max(200),
  summary: z.string().max(1000),
  content: z.string().max(50000),
  status: ChapterStatusSchema,
  illustration: Base64ImageSchema,
  // Enhanced chapter metadata
  wordCount: z.number().int().min(0).default(0),
  characterCount: z.number().int().min(0).default(0),
  estimatedReadingTime: z.number().int().min(0).default(0), // minutes
  tags: z.array(z.string()).default([]),
  notes: z.string().max(2000).default(''),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  // AI generation metadata
  generationPrompt: z.string().optional(),
  aiModel: z.string().optional(),
  generationSettings: z
    .object({
      temperature: TemperatureSchema.optional(),
      maxTokens: z.number().int().min(100).max(8000).optional(),
      topP: z.number().min(0).max(1).optional(),
    })
    .optional(),
  // Optional extended metadata
  plotPoints: z.array(z.string()).optional(),
  characters: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  scenes: z.array(z.string()).optional(),
});

export const RefineOptionsSchema = z.object({
  model: z.enum(['gemini-2.5-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash']),
  temperature: TemperatureSchema.default(0.7),
  maxTokens: z.number().int().min(100).max(8000).default(2000),
  topP: z.number().min(0).max(1).default(0.95),
  // Enhanced refine options
  focusAreas: z
    .array(
      z.enum([
        'grammar',
        'style',
        'pacing',
        'character_development',
        'dialogue',
        'description',
        'plot_consistency',
        'tone',
      ]),
    )
    .default(['grammar', 'style']),
  preserveLength: z.boolean().default(false),
  targetTone: z.enum(['formal', 'casual', 'dramatic', 'humorous', 'mysterious']).optional(),
});

export const AgentActionSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1).max(500),
  cost: z.number().min(0),
  preconditions: WorldStateSchema.partial(),
  effects: WorldStateSchema.partial(),
  agentMode: AgentModeSchema,
  promptTemplate: z.string().min(1),
  // Enhanced action metadata
  category: z.enum(['generation', 'editing', 'analysis', 'publishing']).default('generation'),
  estimatedDuration: z.number().int().min(1).max(3600).default(60), // seconds
  requiredPermissions: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export const LogEntrySchema = z.object({
  id: LogIdSchema,
  timestamp: z.date(),
  agentName: z.string().min(1),
  message: z.string().min(1),
  type: LogTypeSchema,
  // Enhanced logging
  level: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  context: z.record(z.string(), z.any()).optional(),
  duration: z.number().min(0).optional(), // milliseconds
  actionName: z.string().optional(),
});

// =============================================================================
// PROJECT SCHEMA (Main Entity)
// =============================================================================

export const ProjectSchema = z
  .object({
    id: ProjectIdSchema,
    title: z.string().min(1).max(200),
    idea: z.string().max(5000),
    style: WritingStyleSchema,
    coverImage: Base64ImageSchema,
    chapters: z.array(ChapterSchema).default([]),
    worldState: WorldStateSchema,
    isGenerating: z.boolean().default(false),

    // Publishing Metadata
    status: PublishStatusSchema,
    language: LanguageSchema,
    targetWordCount: WordCountSchema,
    settings: ProjectSettingsSchema,

    // Enhanced project metadata
    genre: z.array(z.string()).default([]),
    targetAudience: z.enum(['children', 'young_adult', 'adult', 'all_ages']).default('adult'),
    contentWarnings: z.array(z.string()).default([]),
    keywords: z.array(z.string()).default([]),
    synopsis: z.string().max(2000).default(''),

    // Timestamps
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
    publishedAt: z.date().optional(),

    // Collaboration
    authors: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          email: z.string().email(),
          role: z.enum(['owner', 'collaborator', 'editor', 'viewer']).default('collaborator'),
        }),
      )
      .default([]),

    // Analytics
    analytics: z
      .object({
        totalWordCount: z.number().int().min(0).default(0),
        averageChapterLength: z.number().min(0).default(0),
        estimatedReadingTime: z.number().int().min(0).default(0), // minutes
        generationCost: z.number().min(0).default(0), // abstract cost units
        editingRounds: z.number().int().min(0).default(0),
      })
      .default({
        totalWordCount: 0,
        averageChapterLength: 0,
        estimatedReadingTime: 0,
        generationCost: 0,
        editingRounds: 0,
      }),

    // Version control
    version: z
      .string()
      .regex(/^\d+\.\d+\.\d+$/)
      .default('1.0.0'),
    changeLog: z
      .array(
        z.object({
          version: z.string(),
          changes: z.array(z.string()),
          timestamp: z.date(),
        }),
      )
      .default([]),
  })
  .refine(data => data.worldState.chaptersCount === data.chapters.length, {
    message: 'World state chapters count must match actual chapters length',
    path: ['worldState', 'chaptersCount'],
  })
  .refine(
    data => {
      const completedCount = data.chapters.filter(c => c.status === ChapterStatus.COMPLETE).length;
      return data.worldState.chaptersCompleted === completedCount;
    },
    {
      message: 'World state completed count must match actual completed chapters',
      path: ['worldState', 'chaptersCompleted'],
    },
  );

// =============================================================================
// API & FORM SCHEMAS
// =============================================================================

// Project creation form
export const CreateProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  style: WritingStyleSchema,
  idea: z.string().min(10, 'Idea must be at least 10 characters').max(5000, 'Idea too long'),
  targetWordCount: WordCountSchema.default(50000),
  language: LanguageSchema.default('en'),
  genre: z.array(z.string()).min(1, 'At least one genre is required'),
  targetAudience: z.enum(['children', 'young_adult', 'adult', 'all_ages']).default('adult'),
});

// Chapter update form
export const UpdateChapterSchema = ChapterSchema.partial().extend({
  id: ChapterIdSchema,
});

// Project update form
export const UpdateProjectSchema = ProjectSchema.partial().extend({
  id: ProjectIdSchema,
});

// Settings update form
export const UpdateSettingsSchema = ProjectSettingsSchema.partial();

// Search and filter schemas
export const ProjectFilterSchema = z.object({
  status: PublishStatusSchema.optional(),
  language: LanguageSchema.optional(),
  style: WritingStyleSchema.optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
  wordCountMin: z.number().int().min(0).optional(),
  wordCountMax: z.number().int().min(0).optional(),
  searchTerm: z.string().optional(),
});

// =============================================================================
// TYPE EXPORTS (Inferred from schemas)
// =============================================================================

export type AgentMode = z.infer<typeof AgentModeSchema>;
export type LogType = z.infer<typeof LogTypeSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type WritingStyle = z.infer<typeof WritingStyleSchema>;

export type WorldState = z.infer<typeof WorldStateSchema>;
export type ProjectSettings = z.infer<typeof ProjectSettingsSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type RefineOptions = z.infer<typeof RefineOptionsSchema>;
export type AgentAction = z.infer<typeof AgentActionSchema>;
export type LogEntry = z.infer<typeof LogEntrySchema>;
export type Project = z.infer<typeof ProjectSchema>;

// Form types
export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type UpdateChapter = z.infer<typeof UpdateChapterSchema>;
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;
export type UpdateSettings = z.infer<typeof UpdateSettingsSchema>;
export type ProjectFilter = z.infer<typeof ProjectFilterSchema>;

// Primitive types
export type WordCount = number & { readonly __brand: unique symbol }; // Branded type for safety
export type ValidationResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; issues: z.ZodIssue[] };
export type ProjectId = z.infer<typeof ProjectIdSchema>;
export type ChapterId = z.infer<typeof ChapterIdSchema>;
export type LogId = z.infer<typeof LogIdSchema>;
export type Base64Image = string; // Simplified for now
export type Temperature = number;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validates and parses data using a Zod schema with enhanced error handling
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string,
): { success: true; data: T } | { success: false; error: string; issues: z.ZodIssue[] } {
  try {
    const result = schema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    }

    const errorMessage =
      (context?.length ?? 0) > 0
        ? `Validation failed for ${context}: ${result.error.message}`
        : `Validation failed: ${result.error.message}`;

    return {
      success: false,
      error: errorMessage,
      issues: result.error.issues,
    };
  } catch (error) {
    return {
      success: false,
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      issues: [],
    };
  }
}

/**
 * Type guard to check if data matches a schema
 */
export function isValidData<T>(schema: z.ZodSchema<T>, data: unknown): data is T {
  return schema.safeParse(data).success;
}

/**
 * Transforms and validates data in one step
 */
export function transformAndValidate<TInput, TOutput>(
  inputSchema: z.ZodSchema<TInput>,
  outputSchema: z.ZodSchema<TOutput>,
  data: unknown,
  transformer: (input: TInput) => TOutput,
): { success: true; data: TOutput } | { success: false; error: string; issues: z.ZodIssue[] } {
  const inputValidation = validateData(inputSchema, data, 'input');
  if (!inputValidation.success) {
    return inputValidation;
  }

  try {
    const transformed = transformer(inputValidation.data);
    return validateData(outputSchema, transformed, 'output');
  } catch (error) {
    return {
      success: false,
      error: `Transformation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      issues: [],
    };
  }
}
