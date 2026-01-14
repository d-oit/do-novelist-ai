/**
 * Dialogue Feature Type Definitions
 *
 * Types for dialogue analysis, character voice tracking, and conversation flow
 */

import { z } from 'zod';

// ============================================================================
// Dialogue Line Types
// ============================================================================

export const DialogueTagSchema = z.enum([
  'said',
  'asked',
  'whispered',
  'shouted',
  'murmured',
  'replied',
  'exclaimed',
  'muttered',
  'stammered',
  'declared',
  'demanded',
  'pleaded',
  'teased',
  'joked',
  'sighed',
  'gasped',
  'growled',
  'hissed',
  'snapped',
  'continued',
]);

export type DialogueTag = z.infer<typeof DialogueTagSchema>;

export const DialogueLineSchema = z.object({
  id: z.string(),
  chapterId: z.string(),
  characterId: z.string().nullable(),
  characterName: z.string(),
  text: z.string().min(1),
  tag: DialogueTagSchema,
  action: z.string().optional(), // Associated action beat (e.g., "he crossed his arms")
  position: z.object({
    startOffset: z.number(),
    endOffset: z.number(),
  }),
  lineNumber: z.number(),
  createdAt: z.number(),
});

export type DialogueLine = z.infer<typeof DialogueLineSchema>;

// ============================================================================
// Character Voice Profile
// ============================================================================

export const SpeechPatternSchema = z.object({
  averageWordCount: z.number(), // Average words per dialogue line
  sentenceComplexity: z.enum(['simple', 'moderate', 'complex']),
  vocabularyLevel: z.enum(['basic', 'intermediate', 'advanced', 'technical']),
  commonPhrases: z.array(z.string()).max(20),
  speechTics: z.array(z.string()).max(10), // "um", "you know", etc.
  formalityScore: z.number().min(0).max(10), // 0 = very casual, 10 = very formal
  emotionalRange: z.array(z.enum(['angry', 'happy', 'sad', 'neutral', 'excited', 'fearful'])),
  dialectMarkers: z.array(z.string()).optional(),
});

export type SpeechPattern = z.infer<typeof SpeechPatternSchema>;

export const CharacterVoiceProfileSchema = z.object({
  characterId: z.string(),
  characterName: z.string(),
  projectId: z.string(),
  totalLines: z.number(),
  speechPattern: SpeechPatternSchema,
  favoriteWords: z
    .array(
      z.object({
        word: z.string(),
        count: z.number(),
      }),
    )
    .max(50),
  commonTags: z.array(
    z.object({
      tag: DialogueTagSchema,
      count: z.number(),
      percentage: z.number(),
    }),
  ),
  voiceConsistencyScore: z.number().min(0).max(100),
  lastAnalyzedAt: z.number(),
  updatedAt: z.number(),
});

export type CharacterVoiceProfile = z.infer<typeof CharacterVoiceProfileSchema>;

// ============================================================================
// Dialogue Analysis Results
// ============================================================================

export const DialogueIssueSchema = z.object({
  type: z.enum([
    'voice_inconsistency',
    'repetitive_tag',
    'overused_phrase',
    'missing_tag',
    'unclear_speaker',
    'unnatural_speech',
    'formality_shift',
  ]),
  severity: z.enum(['info', 'warning', 'error']),
  lineId: z.string(),
  characterName: z.string(),
  message: z.string(),
  suggestion: z.string().optional(),
  affectedText: z.string(),
});

export type DialogueIssue = z.infer<typeof DialogueIssueSchema>;

export const DialogueAnalysisResultSchema = z.object({
  projectId: z.string(),
  chapterId: z.string().optional(),
  totalLines: z.number(),
  speakerDistribution: z.array(
    z.object({
      characterName: z.string(),
      count: z.number(),
      percentage: z.number(),
    }),
  ),
  averageLineLength: z.number(),
  tagDistribution: z.array(
    z.object({
      tag: DialogueTagSchema,
      count: z.number(),
      percentage: z.number(),
    }),
  ),
  issues: z.array(DialogueIssueSchema),
  overallQualityScore: z.number().min(0).max(100),
  analyzedAt: z.number(),
});

export type DialogueAnalysisResult = z.infer<typeof DialogueAnalysisResultSchema>;

// ============================================================================
// Conversation Flow
// ============================================================================

export const ConversationTurnSchema = z.object({
  id: z.string(),
  characterId: z.string().nullable(),
  characterName: z.string(),
  dialogueLineId: z.string(),
  text: z.string(),
  order: z.number(),
  responseTime: z.enum(['immediate', 'pause', 'delayed']).optional(),
  tension: z.number().min(0).max(10), // Conversation tension level
});

export type ConversationTurn = z.infer<typeof ConversationTurnSchema>;

export const ConversationSchema = z.object({
  id: z.string(),
  chapterId: z.string(),
  title: z.string().optional(),
  participants: z.array(z.string()), // Character names
  turns: z.array(ConversationTurnSchema),
  startPosition: z.number(),
  endPosition: z.number(),
  averageTension: z.number().min(0).max(10),
  dominantSpeaker: z.string().optional(),
  conversationType: z.enum(['argument', 'casual', 'negotiation', 'exposition', 'confrontation']),
});

export type Conversation = z.infer<typeof ConversationSchema>;

// ============================================================================
// Dialogue Suggestion
// ============================================================================

export const DialogueSuggestionSchema = z.object({
  id: z.string(),
  lineId: z.string(),
  type: z.enum(['tag', 'phrasing', 'voice', 'action']),
  originalText: z.string(),
  suggestedText: z.string(),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
  createdAt: z.number(),
});

export type DialogueSuggestion = z.infer<typeof DialogueSuggestionSchema>;

// ============================================================================
// Filter and Display Types
// ============================================================================

export interface DialogueFilters {
  search: string;
  characterIds: string[];
  tags: DialogueTag[];
  issueTypes: DialogueIssue['type'][];
  chapterIds: string[];
}

export interface DialogueEditorSettings {
  showLineNumbers: boolean;
  highlightIssues: boolean;
  autoSuggestTags: boolean;
  showCharacterColors: boolean;
  focusMode: boolean;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isDialogueLine(value: unknown): value is DialogueLine {
  return DialogueLineSchema.safeParse(value).success;
}

export function isCharacterVoiceProfile(value: unknown): value is CharacterVoiceProfile {
  return CharacterVoiceProfileSchema.safeParse(value).success;
}

export function isDialogueAnalysisResult(value: unknown): value is DialogueAnalysisResult {
  return DialogueAnalysisResultSchema.safeParse(value).success;
}
