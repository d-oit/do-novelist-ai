/**
 * Dialogue Extraction Service
 *
 * Extracts dialogue lines from chapter content using regex patterns
 */

import type { DialogueLine, DialogueTag } from '@/features/dialogue/types';

interface ExtractionResult {
  lines: DialogueLine[];
  totalDialogueCount: number;
  charactersFound: string[];
}

/**
 * Dialogue patterns to match different dialogue formats:
 * - "Hello," she said.
 * - "What?" John asked.
 * - She whispered, "Be quiet."
 *
 * Note: These patterns are designed to match common English dialogue formats.
 * They may have performance implications on very large texts but are optimized
 * for typical chapter lengths (5k-15k words).
 */
const DIALOGUE_PATTERNS = [
  // Pattern 1: "text," character said/asked/etc.
  // eslint-disable-next-line security/detect-unsafe-regex
  /"([^"]+)",?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(said|asked|whispered|shouted|murmured|replied|exclaimed|muttered|stammered|declared|demanded|pleaded|teased|joked|sighed|gasped|growled|hissed|snapped|continued)/gi,

  // Pattern 2: Character said/asked, "text"
  // eslint-disable-next-line security/detect-unsafe-regex
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(said|asked|whispered|shouted|murmured|replied|exclaimed|muttered|stammered|declared|demanded|pleaded|teased|joked|sighed|gasped|growled|hissed|snapped|continued),?\s+"([^"]+)"/gi,

  // Pattern 3: "text" (standalone dialogue, need to infer speaker)
  /"([^"]+)"/g,
];

const DEFAULT_TAGS: DialogueTag[] = [
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
];

function isValidDialogueTag(tag: string): tag is DialogueTag {
  return DEFAULT_TAGS.includes(tag as DialogueTag);
}

/**
 * Extract dialogue lines from chapter content
 */
export function extractDialogueLines(content: string, chapterId: string): ExtractionResult {
  const lines: DialogueLine[] = [];
  const charactersFound = new Set<string>();
  let lineNumber = 0;

  // Split content into paragraphs for better context
  const paragraphs = content.split(/\n\n+/);
  let currentOffset = 0;
  let lastSpeaker = 'Unknown';

  paragraphs.forEach(paragraph => {
    // Pattern 1: "text," character tag
    const pattern1 = DIALOGUE_PATTERNS[0];
    if (!pattern1) return;
    const pattern1Matches = Array.from(paragraph.matchAll(pattern1));

    pattern1Matches.forEach(match => {
      const text = match[1]?.trim();
      const characterName = match[2]?.trim();
      const tag = match[3]?.toLowerCase();

      if (text && characterName && tag && isValidDialogueTag(tag)) {
        const startOffset = currentOffset + (match.index ?? 0);
        const endOffset = startOffset + match[0].length;

        lines.push({
          id: `dialogue_${chapterId}_${lineNumber}`,
          chapterId,
          characterId: null, // Will be linked later
          characterName,
          text,
          tag,
          position: { startOffset, endOffset },
          lineNumber: lineNumber++,
          createdAt: Date.now(),
        });

        charactersFound.add(characterName);
        lastSpeaker = characterName;
      }
    });

    // Pattern 2: character tag, "text"
    const pattern2 = DIALOGUE_PATTERNS[1];
    if (!pattern2) return;
    const pattern2Matches = Array.from(paragraph.matchAll(pattern2));

    pattern2Matches.forEach(match => {
      const characterName = match[1]?.trim();
      const tag = match[2]?.toLowerCase();
      const text = match[3]?.trim();

      if (text && characterName && tag && isValidDialogueTag(tag)) {
        const startOffset = currentOffset + (match.index ?? 0);
        const endOffset = startOffset + match[0].length;

        lines.push({
          id: `dialogue_${chapterId}_${lineNumber}`,
          chapterId,
          characterId: null,
          characterName,
          text,
          tag,
          position: { startOffset, endOffset },
          lineNumber: lineNumber++,
          createdAt: Date.now(),
        });

        charactersFound.add(characterName);
        lastSpeaker = characterName;
      }
    });

    // Pattern 3: Standalone quotes (infer speaker from context)
    // Only process if we haven't already matched this quote
    const allMatchedOffsets = new Set(
      [...pattern1Matches, ...pattern2Matches].map(m => m.index ?? 0).filter(idx => idx >= 0),
    );

    const pattern3 = DIALOGUE_PATTERNS[2];
    if (!pattern3) return;
    const pattern3Matches = Array.from(paragraph.matchAll(pattern3));

    pattern3Matches.forEach(match => {
      const matchOffset = match.index ?? 0;

      // Skip if already matched by pattern 1 or 2
      if (allMatchedOffsets.has(matchOffset)) {
        return;
      }

      const text = match[1]?.trim() ?? '';

      // Skip very short quotes (likely not dialogue)
      if (text.length < 3) {
        return;
      }

      const startOffset = currentOffset + matchOffset;
      const endOffset = startOffset + match[0].length;

      lines.push({
        id: `dialogue_${chapterId}_${lineNumber}`,
        chapterId,
        characterId: null,
        characterName: lastSpeaker, // Use last known speaker
        text,
        tag: 'said', // Default tag
        position: { startOffset, endOffset },
        lineNumber: lineNumber++,
        createdAt: Date.now(),
      });
    });

    currentOffset += paragraph.length + 2; // +2 for \n\n
  });

  return {
    lines,
    totalDialogueCount: lines.length,
    charactersFound: Array.from(charactersFound),
  };
}

/**
 * Extract action beats associated with dialogue
 * Example: "Hello," she said, crossing her arms.
 */
export function extractActionBeats(content: string): Map<number, string> {
  const actionBeats = new Map<number, string>();

  // Pattern: dialogue tag followed by action (comma + verb phrase)
  const actionPattern =
    /(said|asked|whispered|shouted|murmured|replied|exclaimed|muttered|stammered|declared|demanded|pleaded|teased|joked|sighed|gasped|growled|hissed|snapped|continued),\s+([a-z][^.!?]+[.!?])/gi;

  const matches = Array.from(content.matchAll(actionPattern));

  matches.forEach(match => {
    const action = match[2]?.trim();
    if (!action) return;

    const offset = match.index ?? 0;
    actionBeats.set(offset, action);
  });

  return actionBeats;
}

/**
 * Link character names to character IDs
 */
export function linkCharacterIds(
  lines: DialogueLine[],
  characterMap: Map<string, string>, // name -> id
): DialogueLine[] {
  return lines.map(line => {
    const characterId = characterMap.get(line.characterName) ?? null;
    return { ...line, characterId };
  });
}

/**
 * Group dialogue lines into conversations
 * Conversation = sequence of dialogue with < 2 paragraphs of prose between
 */
export function groupIntoConversations(
  lines: DialogueLine[],
  maxGapLength: number = 500, // Max characters between dialogue to stay in same conversation
): Array<{ lines: DialogueLine[]; startOffset: number; endOffset: number }> {
  if (lines.length === 0) {
    return [];
  }

  const firstLine = lines[0];
  if (!firstLine) {
    return [];
  }

  const conversations: Array<{
    lines: DialogueLine[];
    startOffset: number;
    endOffset: number;
  }> = [];

  let currentConversation: DialogueLine[] = [firstLine];
  let conversationStart = firstLine.position.startOffset;

  for (let i = 1; i < lines.length; i++) {
    const prevLine = lines[i - 1];
    const currentLine = lines[i];

    if (!prevLine || !currentLine) {
      continue;
    }

    const gap = currentLine.position.startOffset - prevLine.position.endOffset;

    if (gap <= maxGapLength) {
      // Continue current conversation
      currentConversation.push(currentLine);
    } else {
      // Start new conversation
      conversations.push({
        lines: currentConversation,
        startOffset: conversationStart,
        endOffset: prevLine.position.endOffset,
      });

      currentConversation = [currentLine];
      conversationStart = currentLine.position.startOffset;
    }
  }

  // Add final conversation
  if (currentConversation.length > 0) {
    const lastLine = currentConversation[currentConversation.length - 1];
    if (!lastLine) {
      return conversations;
    }

    conversations.push({
      lines: currentConversation,
      startOffset: conversationStart,
      endOffset: lastLine.position.endOffset,
    });
  }

  return conversations;
}
