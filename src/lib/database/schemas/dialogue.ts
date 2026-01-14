/**
 * Drizzle ORM schema for dialogue tracking
 * Stores dialogue lines, character voice profiles, and analysis results
 */
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

import { projects } from './projects';

/**
 * Dialogue lines extracted from chapters
 */
export const dialogueLines = sqliteTable('dialogue_lines', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  chapterId: text('chapter_id').notNull(),
  characterId: text('character_id'), // Nullable if speaker is unknown
  characterName: text('character_name').notNull(),
  text: text('text').notNull(),
  tag: text('tag').notNull(), // 'said', 'asked', 'whispered', etc.
  action: text('action'), // Associated action beat
  startOffset: integer('start_offset').notNull(),
  endOffset: integer('end_offset').notNull(),
  lineNumber: integer('line_number').notNull(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Character voice profiles - tracks speech patterns per character
 */
export const characterVoiceProfiles = sqliteTable('character_voice_profiles', {
  id: text('id').primaryKey(),
  characterId: text('character_id').notNull().unique(),
  characterName: text('character_name').notNull(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  totalLines: integer('total_lines').notNull().default(0),

  // Speech pattern analysis (stored as JSON)
  speechPattern: text('speech_pattern', { mode: 'json' }).$type<{
    averageWordCount: number;
    sentenceComplexity: 'simple' | 'moderate' | 'complex';
    vocabularyLevel: 'basic' | 'intermediate' | 'advanced' | 'technical';
    commonPhrases: string[];
    speechTics: string[];
    formalityScore: number;
    emotionalRange: string[];
    dialectMarkers?: string[];
  }>(),

  // Favorite words (stored as JSON array)
  favoriteWords: text('favorite_words', { mode: 'json' }).$type<
    Array<{ word: string; count: number }>
  >(),

  // Common dialogue tags (stored as JSON)
  commonTags: text('common_tags', { mode: 'json' }).$type<
    Array<{ tag: string; count: number; percentage: number }>
  >(),

  voiceConsistencyScore: real('voice_consistency_score').notNull().default(0),
  lastAnalyzedAt: text('last_analyzed_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Dialogue analysis results - cached analysis per chapter or project
 */
export const dialogueAnalyses = sqliteTable('dialogue_analyses', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  chapterId: text('chapter_id'), // Nullable for project-wide analysis
  totalLines: integer('total_lines').notNull(),

  // Speaker distribution (stored as JSON)
  speakerDistribution: text('speaker_distribution', { mode: 'json' }).$type<
    Array<{ characterName: string; count: number; percentage: number }>
  >(),

  averageLineLength: real('average_line_length').notNull(),

  // Tag distribution (stored as JSON)
  tagDistribution: text('tag_distribution', { mode: 'json' }).$type<
    Array<{ tag: string; count: number; percentage: number }>
  >(),

  // Issues found (stored as JSON)
  issues: text('issues', { mode: 'json' }).$type<
    Array<{
      type: string;
      severity: 'info' | 'warning' | 'error';
      lineId: string;
      characterName: string;
      message: string;
      suggestion?: string;
      affectedText: string;
    }>
  >(),

  overallQualityScore: real('overall_quality_score').notNull().default(0),
  analyzedAt: text('analyzed_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Conversations - grouped dialogue exchanges
 */
export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  chapterId: text('chapter_id').notNull(),
  title: text('title'),

  // Participants (stored as JSON array of character names)
  participants: text('participants', { mode: 'json' }).$type<string[]>(),

  // Conversation turns (stored as JSON)
  turns: text('turns', { mode: 'json' }).$type<
    Array<{
      id: string;
      characterId: string | null;
      characterName: string;
      dialogueLineId: string;
      text: string;
      order: number;
      responseTime?: 'immediate' | 'pause' | 'delayed';
      tension: number;
    }>
  >(),

  startPosition: integer('start_position').notNull(),
  endPosition: integer('end_position').notNull(),
  averageTension: real('average_tension').notNull().default(5),
  dominantSpeaker: text('dominant_speaker'),
  conversationType: text('conversation_type').notNull(), // 'argument', 'casual', etc.

  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Type inference helpers
 */
export type DialogueLineRow = typeof dialogueLines.$inferSelect;
export type NewDialogueLineRow = typeof dialogueLines.$inferInsert;

export type CharacterVoiceProfileRow = typeof characterVoiceProfiles.$inferSelect;
export type NewCharacterVoiceProfileRow = typeof characterVoiceProfiles.$inferInsert;

export type DialogueAnalysisRow = typeof dialogueAnalyses.$inferSelect;
export type NewDialogueAnalysisRow = typeof dialogueAnalyses.$inferInsert;

export type ConversationRow = typeof conversations.$inferSelect;
export type NewConversationRow = typeof conversations.$inferInsert;
