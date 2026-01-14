/**
 * useDialogue Hook
 *
 * React hook for dialogue feature data and operations
 */

import { useCallback, useEffect, useState } from 'react';

import {
  extractDialogueLines,
  groupIntoConversations,
  analyzeDialogue,
  buildVoiceProfile,
} from '@/features/dialogue/services';
import type {
  DialogueLine,
  CharacterVoiceProfile,
  DialogueAnalysisResult,
  Conversation,
} from '@/features/dialogue/types';
import {
  getDialogueLinesByChapter,
  getDialogueLinesByProject,
  getVoiceProfilesByProject,
  getDialogueAnalysisByChapter,
  getDialogueAnalysisByProject,
  getConversationsByChapter,
  saveDialogueLines,
  saveCharacterVoiceProfile,
  saveDialogueAnalysis,
  saveConversation,
  deleteDialogueLinesByChapter,
} from '@/lib/database/services/dialogue-service';
import { logger } from '@/lib/logging/logger';

interface UseDialogueOptions {
  projectId: string;
  chapterId?: string;
  autoLoad?: boolean;
}

interface UseDialogueReturn {
  lines: DialogueLine[];
  voiceProfiles: CharacterVoiceProfile[];
  analysis: DialogueAnalysisResult | null;
  conversations: Conversation[];
  isLoading: boolean;
  error: Error | null;
  extractAndAnalyze: (chapterContent: string, chapterId: string) => Promise<void>;
  refreshAnalysis: () => Promise<void>;
  updateLine: (lineId: string, updates: Partial<DialogueLine>) => Promise<void>;
}

/**
 * Hook for managing dialogue data
 */
export function useDialogue(options: UseDialogueOptions): UseDialogueReturn {
  const { projectId, chapterId, autoLoad = true } = options;

  const [lines, setLines] = useState<DialogueLine[]>([]);
  const [voiceProfiles, setVoiceProfiles] = useState<CharacterVoiceProfile[]>([]);
  const [analysis, setAnalysis] = useState<DialogueAnalysisResult | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load dialogue data from database
   */
  const loadData = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load dialogue lines
      const loadedLines = chapterId
        ? await getDialogueLinesByChapter(chapterId)
        : await getDialogueLinesByProject(projectId);

      setLines(loadedLines);

      // Load voice profiles
      const profiles = await getVoiceProfilesByProject(projectId);
      setVoiceProfiles(profiles);

      // Load analysis
      const loadedAnalysis = chapterId
        ? await getDialogueAnalysisByChapter(chapterId)
        : await getDialogueAnalysisByProject(projectId);

      setAnalysis(loadedAnalysis);

      // Load conversations (only for specific chapters)
      if (chapterId) {
        const loadedConversations = await getConversationsByChapter(chapterId);
        setConversations(loadedConversations);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load dialogue data');
      setError(error);
      logger.error('Failed to load dialogue data', {
        component: 'useDialogue',
        error,
        projectId,
        chapterId,
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, chapterId]);

  /**
   * Extract and analyze dialogue from chapter content
   */
  const extractAndAnalyze = useCallback(
    async (chapterContent: string, targetChapterId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Delete old dialogue lines for this chapter
        await deleteDialogueLinesByChapter(targetChapterId);

        // 2. Extract dialogue lines
        const extractionResult = extractDialogueLines(chapterContent, targetChapterId);

        if (extractionResult.lines.length === 0) {
          logger.info('No dialogue found in chapter', {
            component: 'useDialogue',
            chapterId: targetChapterId,
          });
          setLines([]);
          setAnalysis(null);
          setConversations([]);
          return;
        }

        // 3. Save dialogue lines
        await saveDialogueLines(extractionResult.lines);

        // 4. Build/update voice profiles for each character
        const characterIds = new Set(
          extractionResult.lines
            .filter(line => line.characterId)
            .map(line => line.characterId as string),
        );

        const voiceProfilesMap = new Map<string, CharacterVoiceProfile>();

        for (const characterId of characterIds) {
          const characterLines = extractionResult.lines.filter(
            line => line.characterId === characterId,
          );
          const characterName = characterLines[0]?.characterName ?? 'Unknown';

          const profile = buildVoiceProfile(characterId, characterName, projectId, characterLines);

          await saveCharacterVoiceProfile(profile);
          voiceProfilesMap.set(characterId, profile);
        }

        // 5. Analyze dialogue
        const analysisResult = await analyzeDialogue(
          extractionResult.lines,
          projectId,
          targetChapterId,
          voiceProfilesMap,
        );

        await saveDialogueAnalysis(analysisResult);

        // 6. Group into conversations
        const conversationGroups = groupIntoConversations(extractionResult.lines);

        const conversationData: Conversation[] = conversationGroups.map((group, idx) => {
          const participants = Array.from(new Set(group.lines.map(line => line.characterName)));

          const turns = group.lines.map((line, turnIdx) => ({
            id: `turn_${line.id}`,
            characterId: line.characterId,
            characterName: line.characterName,
            dialogueLineId: line.id,
            text: line.text,
            order: turnIdx,
            tension: 5, // Default tension, can be enhanced later
          }));

          const avgTension = turns.reduce((sum, turn) => sum + turn.tension, 0) / turns.length;

          // Determine dominant speaker
          const speakerCounts = new Map<string, number>();
          turns.forEach(turn => {
            speakerCounts.set(turn.characterName, (speakerCounts.get(turn.characterName) ?? 0) + 1);
          });

          const dominantSpeaker = Array.from(speakerCounts.entries()).sort(
            (a, b) => b[1] - a[1],
          )[0]?.[0];

          return {
            id: `conv_${targetChapterId}_${idx}`,
            chapterId: targetChapterId,
            title: `Conversation ${idx + 1}`,
            participants,
            turns,
            startPosition: group.startOffset,
            endPosition: group.endOffset,
            averageTension: avgTension,
            dominantSpeaker,
            conversationType: 'casual' as const, // Can be enhanced with AI
          };
        });

        // Save conversations
        for (const conversation of conversationData) {
          await saveConversation(conversation);
        }

        // 7. Update state
        setLines(extractionResult.lines);
        setAnalysis(analysisResult);
        setConversations(conversationData);

        // Reload voice profiles to include updates
        const updatedProfiles = await getVoiceProfilesByProject(projectId);
        setVoiceProfiles(updatedProfiles);

        logger.info('Dialogue extraction and analysis completed', {
          component: 'useDialogue',
          chapterId: targetChapterId,
          linesFound: extractionResult.lines.length,
          conversationsFound: conversationData.length,
        });
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to extract and analyze dialogue');
        setError(error);
        logger.error('Failed to extract and analyze dialogue', {
          component: 'useDialogue',
          error,
          chapterId: targetChapterId,
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [projectId],
  );

  /**
   * Refresh analysis with current data
   */
  const refreshAnalysis = useCallback(async () => {
    if (lines.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // Rebuild voice profiles
      const voiceProfilesMap = new Map<string, CharacterVoiceProfile>();
      const characterIds = new Set(
        lines.filter(line => line.characterId).map(line => line.characterId as string),
      );

      for (const characterId of characterIds) {
        const characterLines = lines.filter(line => line.characterId === characterId);
        const characterName = characterLines[0]?.characterName ?? 'Unknown';

        const profile = buildVoiceProfile(characterId, characterName, projectId, characterLines);

        await saveCharacterVoiceProfile(profile);
        voiceProfilesMap.set(characterId, profile);
      }

      // Re-analyze
      const analysisResult = await analyzeDialogue(lines, projectId, chapterId, voiceProfilesMap);

      await saveDialogueAnalysis(analysisResult);
      setAnalysis(analysisResult);

      // Reload voice profiles
      const updatedProfiles = await getVoiceProfilesByProject(projectId);
      setVoiceProfiles(updatedProfiles);

      logger.info('Dialogue analysis refreshed', {
        component: 'useDialogue',
        projectId,
        chapterId,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to refresh analysis');
      setError(error);
      logger.error('Failed to refresh analysis', {
        component: 'useDialogue',
        error,
        projectId,
        chapterId,
      });
    } finally {
      setIsLoading(false);
    }
  }, [lines, projectId, chapterId]);

  /**
   * Update a dialogue line
   */
  const updateLine = useCallback(
    async (lineId: string, updates: Partial<DialogueLine>) => {
      try {
        const updatedLines = lines.map(line =>
          line.id === lineId ? { ...line, ...updates } : line,
        );

        setLines(updatedLines);

        // Save updated line
        const updatedLine = updatedLines.find(line => line.id === lineId);
        if (updatedLine) {
          await saveDialogueLines([updatedLine]);
        }

        // Refresh analysis after update
        await refreshAnalysis();

        logger.info('Dialogue line updated', {
          component: 'useDialogue',
          lineId,
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update dialogue line');
        setError(error);
        logger.error('Failed to update dialogue line', {
          component: 'useDialogue',
          error,
          lineId,
        });
      }
    },
    [lines, refreshAnalysis],
  );

  // Auto-load data on mount
  useEffect(() => {
    if (autoLoad) {
      void loadData();
    }
  }, [autoLoad, loadData]);

  return {
    lines,
    voiceProfiles,
    analysis,
    conversations,
    isLoading,
    error,
    extractAndAnalyze,
    refreshAnalysis,
    updateLine,
  };
}
