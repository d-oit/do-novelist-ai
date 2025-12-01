/**
 * Editor Feature Types
 *
 * Type definitions for the editor module, including content state,
 * UI state, refine options, and image generation.
 */

import { z } from 'zod';

// ============================================================================
// Refine Options
// ============================================================================

export const RefineOptionsSchema = z.object({
  model: z.enum(['gemini-2.5-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash']),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().min(100).max(8000).default(2000),
  topP: z.number().min(0).max(1).default(0.95),
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

export type RefineOptions = z.infer<typeof RefineOptionsSchema>;
export type AIModel = z.infer<typeof RefineOptionsSchema.shape.model>;

// ============================================================================
// Editor Content State
// ============================================================================

export interface EditorContent {
  summary: string;
  content: string;
  wordCount: number;
  characterCount: number;
  lastSaved: number | null;
}

// ============================================================================
// Editor UI State
// ============================================================================

export interface EditorUIState {
  isSidebarOpen: boolean;
  isFocusMode: boolean;
  isGeneratingImage: boolean;
  showVersionHistory: boolean;
  showVersionComparison: boolean;
  showAnalytics: boolean;
}

// ============================================================================
// Editor State (Combined)
// ============================================================================

export interface EditorState extends EditorContent, EditorUIState {
  hasUnsavedChanges: boolean;
  lastSavedSummary: string;
  lastSavedContent: string;
  comparisonVersions: [EditorContent, EditorContent] | null;
  refineSettings: RefineOptions;
}

// ============================================================================
// Image Generation
// ============================================================================

export const ImageStyleSchema = z.enum([
  'realistic',
  'illustration',
  'anime',
  'sketch',
  'watercolor',
  'oil-painting',
]);
export const AspectRatioSchema = z.enum(['16:9', '4:3', '1:1', '9:16', '3:4']);

export const ImageGenerationOptionsSchema = z.object({
  prompt: z.string().min(10).max(1000),
  style: ImageStyleSchema.default('illustration'),
  aspectRatio: AspectRatioSchema.default('16:9'),
  negativePrompt: z.string().max(500).optional(),
  seed: z.number().int().optional(),
});

export type ImageGenerationOptions = z.infer<typeof ImageGenerationOptionsSchema>;

export interface GeneratedImage {
  url: string;
  prompt: string;
  style: z.infer<typeof ImageStyleSchema>;
  aspectRatio: z.infer<typeof AspectRatioSchema>;
  generatedAt: number;
  seed?: number;
}

// ============================================================================
// Editor Actions
// ============================================================================

export type EditorAction =
  | { type: 'SET_CHAPTER'; payload: { summary: string; content: string } }
  | { type: 'UPDATE_SUMMARY'; payload: string }
  | { type: 'UPDATE_CONTENT'; payload: string }
  | { type: 'MARK_SAVED' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_FOCUS_MODE' }
  | { type: 'SET_GENERATING_IMAGE'; payload: boolean }
  | { type: 'TOGGLE_VERSION_HISTORY'; payload: boolean }
  | { type: 'TOGGLE_ANALYTICS'; payload: boolean }
  | { type: 'SHOW_COMPARISON'; payload: [EditorContent, EditorContent] }
  | { type: 'CLOSE_COMPARISON' }
  | { type: 'UPDATE_REFINE_SETTINGS'; payload: Partial<RefineOptions> }
  | { type: 'RESET' };

// ============================================================================
// Draft Persistence
// ============================================================================

export interface DraftMetadata {
  chapterId: string;
  projectId: string;
  savedAt: number;
  wordCount: number;
  version: number;
}

export interface SavedDraft extends DraftMetadata {
  content: string;
  summary: string;
}

// ============================================================================
// AI Generation Results
// ============================================================================

export interface OutlineChapter {
  orderIndex: number;
  title: string;
  summary: string;
}

export interface OutlineResult {
  title: string;
  chapters: OutlineChapter[];
}

// ============================================================================
// Type Guards
// ============================================================================

export function isRefineOptions(value: unknown): value is RefineOptions {
  return RefineOptionsSchema.safeParse(value).success;
}

export function isImageGenerationOptions(value: unknown): value is ImageGenerationOptions {
  return ImageGenerationOptionsSchema.safeParse(value).success;
}
