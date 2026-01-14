/**
 * Dialogue Service - Database operations for dialogue feature
 */

import { eq, and, desc, isNull } from 'drizzle-orm';

import type {
  DialogueLine,
  CharacterVoiceProfile,
  DialogueAnalysisResult,
  Conversation,
} from '@/features/dialogue/types';
import { getDrizzleClient } from '@/lib/database/drizzle';
import {
  dialogueLines,
  characterVoiceProfiles,
  dialogueAnalyses,
  conversations,
  type DialogueLineRow,
  type CharacterVoiceProfileRow,
  type DialogueAnalysisRow,
  type ConversationRow,
} from '@/lib/database/schemas/dialogue';

/**
 * Save dialogue lines to database
 */
export async function saveDialogueLines(lines: DialogueLine[]): Promise<void> {
  if (lines.length === 0) return;

  const db = getDrizzleClient();
  if (!db) throw new Error('Database not initialized');
  const rows = lines.map(line => ({
    id: line.id,
    projectId: line.chapterId.split('_')[0] ?? '', // Extract project ID from chapter ID
    chapterId: line.chapterId,
    characterId: line.characterId,
    characterName: line.characterName,
    text: line.text,
    tag: line.tag,
    action: line.action,
    startOffset: line.position.startOffset,
    endOffset: line.position.endOffset,
    lineNumber: line.lineNumber,
    createdAt: new Date(line.createdAt).toISOString(),
  }));

  await db
    .insert(dialogueLines)
    .values(rows)
    .onConflictDoUpdate({
      target: dialogueLines.id,
      set: {
        text: rows[0]?.text ?? '',
        tag: rows[0]?.tag ?? 'said',
        action: rows[0]?.action,
        characterName: rows[0]?.characterName ?? '',
      },
    });
}

/**
 * Get dialogue lines for a chapter
 */
export async function getDialogueLinesByChapter(chapterId: string): Promise<DialogueLine[]> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not initialized');
  const rows = await db
    .select()
    .from(dialogueLines)
    .where(eq(dialogueLines.chapterId, chapterId))
    .orderBy(dialogueLines.lineNumber);

  return rows.map(rowToDialogueLine);
}

/**
 * Get dialogue lines for a project
 */
export async function getDialogueLinesByProject(projectId: string): Promise<DialogueLine[]> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not initialized');
  const rows = await db
    .select()
    .from(dialogueLines)
    .where(eq(dialogueLines.projectId, projectId))
    .orderBy(dialogueLines.chapterId, dialogueLines.lineNumber);

  return rows.map(rowToDialogueLine);
}

/**
 * Delete dialogue lines for a chapter
 */
export async function deleteDialogueLinesByChapter(chapterId: string): Promise<void> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not initialized');
  await db.delete(dialogueLines).where(eq(dialogueLines.chapterId, chapterId));
}

/**
 * Save character voice profile
 */
export async function saveCharacterVoiceProfile(profile: CharacterVoiceProfile): Promise<void> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not initialized');
  const row = {
    id: profile.characterId,
    characterId: profile.characterId,
    characterName: profile.characterName,
    projectId: profile.projectId,
    totalLines: profile.totalLines,
    speechPattern: profile.speechPattern,
    favoriteWords: profile.favoriteWords,
    commonTags: profile.commonTags,
    voiceConsistencyScore: profile.voiceConsistencyScore,
    lastAnalyzedAt: new Date(profile.lastAnalyzedAt).toISOString(),
    updatedAt: new Date(profile.updatedAt).toISOString(),
  };

  await db
    .insert(characterVoiceProfiles)
    .values(row)
    .onConflictDoUpdate({
      target: characterVoiceProfiles.characterId,
      set: {
        totalLines: row.totalLines,
        speechPattern: row.speechPattern,
        favoriteWords: row.favoriteWords,
        commonTags: row.commonTags,
        voiceConsistencyScore: row.voiceConsistencyScore,
        lastAnalyzedAt: row.lastAnalyzedAt,
        updatedAt: row.updatedAt,
      },
    });
}

/**
 * Get character voice profile
 */
export async function getCharacterVoiceProfile(
  characterId: string,
): Promise<CharacterVoiceProfile | null> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not initialized');
  const rows = await db
    .select()
    .from(characterVoiceProfiles)
    .where(eq(characterVoiceProfiles.characterId, characterId))
    .limit(1);

  const row = rows[0];
  return row ? rowToVoiceProfile(row) : null;
}

/**
 * Get all voice profiles for a project
 */
export async function getVoiceProfilesByProject(
  projectId: string,
): Promise<CharacterVoiceProfile[]> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not initialized');
  const rows = await db
    .select()
    .from(characterVoiceProfiles)
    .where(eq(characterVoiceProfiles.projectId, projectId))
    .orderBy(desc(characterVoiceProfiles.totalLines));

  return rows.map(rowToVoiceProfile);
}

/**
 * Save dialogue analysis result
 */
export async function saveDialogueAnalysis(analysis: DialogueAnalysisResult): Promise<void> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not initialized');
  const row = {
    id: analysis.chapterId
      ? `analysis_${analysis.chapterId}`
      : `analysis_project_${analysis.projectId}`,
    projectId: analysis.projectId,
    chapterId: analysis.chapterId ?? null,
    totalLines: analysis.totalLines,
    speakerDistribution: analysis.speakerDistribution,
    averageLineLength: analysis.averageLineLength,
    tagDistribution: analysis.tagDistribution,
    issues: analysis.issues,
    overallQualityScore: analysis.overallQualityScore,
    analyzedAt: new Date(analysis.analyzedAt).toISOString(),
  };

  await db
    .insert(dialogueAnalyses)
    .values(row)
    .onConflictDoUpdate({
      target: dialogueAnalyses.id,
      set: {
        totalLines: row.totalLines,
        speakerDistribution: row.speakerDistribution,
        averageLineLength: row.averageLineLength,
        tagDistribution: row.tagDistribution,
        issues: row.issues,
        overallQualityScore: row.overallQualityScore,
        analyzedAt: row.analyzedAt,
      },
    });
}

/**
 * Get dialogue analysis for a chapter
 */
export async function getDialogueAnalysisByChapter(
  chapterId: string,
): Promise<DialogueAnalysisResult | null> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not initialized');
  const rows = await db
    .select()
    .from(dialogueAnalyses)
    .where(eq(dialogueAnalyses.chapterId, chapterId))
    .limit(1);

  const row = rows[0];
  return row ? rowToAnalysisResult(row) : null;
}

/**
 * Get dialogue analysis for a project
 */
export async function getDialogueAnalysisByProject(
  projectId: string,
): Promise<DialogueAnalysisResult | null> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not initialized');
  const rows = await db
    .select()
    .from(dialogueAnalyses)
    .where(and(eq(dialogueAnalyses.projectId, projectId), isNull(dialogueAnalyses.chapterId)))
    .limit(1);

  const row = rows[0];
  return row ? rowToAnalysisResult(row) : null;
}

/**
 * Save conversation
 */
export async function saveConversation(conversation: Conversation): Promise<void> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not initialized');
  const row = {
    id: conversation.id,
    projectId: conversation.chapterId.split('_')[0] ?? '',
    chapterId: conversation.chapterId,
    title: conversation.title ?? null,
    participants: conversation.participants,
    turns: conversation.turns,
    startPosition: conversation.startPosition,
    endPosition: conversation.endPosition,
    averageTension: conversation.averageTension,
    dominantSpeaker: conversation.dominantSpeaker ?? null,
    conversationType: conversation.conversationType,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db
    .insert(conversations)
    .values(row)
    .onConflictDoUpdate({
      target: conversations.id,
      set: {
        title: row.title,
        participants: row.participants,
        turns: row.turns,
        averageTension: row.averageTension,
        dominantSpeaker: row.dominantSpeaker,
        conversationType: row.conversationType,
        updatedAt: row.updatedAt,
      },
    });
}

/**
 * Get conversations for a chapter
 */
export async function getConversationsByChapter(chapterId: string): Promise<Conversation[]> {
  const db = getDrizzleClient();
  if (!db) throw new Error('Database not initialized');
  const rows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.chapterId, chapterId))
    .orderBy(conversations.startPosition);

  return rows.map(rowToConversation);
}

// ============================================================================
// Type Converters
// ============================================================================

function rowToDialogueLine(row: DialogueLineRow): DialogueLine {
  return {
    id: row.id,
    chapterId: row.chapterId,
    characterId: row.characterId,
    characterName: row.characterName,
    text: row.text,
    tag: row.tag as DialogueLine['tag'],
    action: row.action ?? undefined,
    position: {
      startOffset: row.startOffset,
      endOffset: row.endOffset,
    },
    lineNumber: row.lineNumber,
    createdAt: new Date(row.createdAt).getTime(),
  };
}

function rowToVoiceProfile(row: CharacterVoiceProfileRow): CharacterVoiceProfile {
  const defaultSpeechPattern = {
    averageWordCount: 0,
    sentenceComplexity: 'moderate' as const,
    vocabularyLevel: 'intermediate' as const,
    commonPhrases: [],
    speechTics: [],
    formalityScore: 5,
    emotionalRange: ['neutral' as const],
  };

  // Ensure speech pattern has the correct emotional range type
  const speechPattern = row.speechPattern ?? defaultSpeechPattern;
  const validatedSpeechPattern = {
    ...speechPattern,
    emotionalRange: (speechPattern.emotionalRange ?? ['neutral']) as Array<
      'angry' | 'happy' | 'sad' | 'neutral' | 'excited' | 'fearful'
    >,
  };

  return {
    characterId: row.characterId,
    characterName: row.characterName,
    projectId: row.projectId,
    totalLines: row.totalLines,
    speechPattern: validatedSpeechPattern,
    favoriteWords: row.favoriteWords ?? [],
    commonTags: (row.commonTags ?? []) as CharacterVoiceProfile['commonTags'],
    voiceConsistencyScore: row.voiceConsistencyScore,
    lastAnalyzedAt: new Date(row.lastAnalyzedAt).getTime(),
    updatedAt: new Date(row.updatedAt).getTime(),
  };
}

function rowToAnalysisResult(row: DialogueAnalysisRow): DialogueAnalysisResult {
  return {
    projectId: row.projectId,
    chapterId: row.chapterId ?? undefined,
    totalLines: row.totalLines,
    speakerDistribution: row.speakerDistribution ?? [],
    averageLineLength: row.averageLineLength,
    tagDistribution: (row.tagDistribution ?? []) as DialogueAnalysisResult['tagDistribution'],
    issues: (row.issues ?? []) as DialogueAnalysisResult['issues'],
    overallQualityScore: row.overallQualityScore,
    analyzedAt: new Date(row.analyzedAt).getTime(),
  };
}

function rowToConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    chapterId: row.chapterId,
    title: row.title ?? undefined,
    participants: row.participants ?? [],
    turns: row.turns ?? [],
    startPosition: row.startPosition,
    endPosition: row.endPosition,
    averageTension: row.averageTension,
    dominantSpeaker: row.dominantSpeaker ?? undefined,
    conversationType: row.conversationType as Conversation['conversationType'],
  };
}
