/**
 * Dialogue Analysis Service
 *
 * Analyzes dialogue quality, identifies issues, and generates insights
 */

import type {
  DialogueLine,
  DialogueAnalysisResult,
  DialogueIssue,
  CharacterVoiceProfile,
  DialogueTag,
} from '@/features/dialogue/types';

interface AnalysisOptions {
  checkVoiceConsistency: boolean;
  checkTagRepetition: boolean;
  checkUnclearSpeakers: boolean;
  checkNaturalness: boolean;
}

const DEFAULT_OPTIONS: AnalysisOptions = {
  checkVoiceConsistency: true,
  checkTagRepetition: true,
  checkUnclearSpeakers: true,
  checkNaturalness: true,
};

/**
 * Analyze dialogue lines for a chapter or project
 */
export async function analyzeDialogue(
  lines: DialogueLine[],
  projectId: string,
  chapterId?: string,
  voiceProfiles?: Map<string, CharacterVoiceProfile>,
  options: Partial<AnalysisOptions> = {},
): Promise<DialogueAnalysisResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const issues: DialogueIssue[] = [];

  // Calculate speaker distribution
  const speakerCounts = new Map<string, number>();
  lines.forEach(line => {
    speakerCounts.set(line.characterName, (speakerCounts.get(line.characterName) ?? 0) + 1);
  });

  const speakerDistribution = Array.from(speakerCounts.entries())
    .map(([characterName, count]) => ({
      characterName,
      count,
      percentage: (count / lines.length) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  // Calculate tag distribution
  const tagCounts = new Map<DialogueTag, number>();
  lines.forEach(line => {
    tagCounts.set(line.tag, (tagCounts.get(line.tag) ?? 0) + 1);
  });

  const tagDistribution = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({
      tag,
      count,
      percentage: (count / lines.length) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  // Calculate average line length
  const totalWords = lines.reduce((sum, line) => {
    return sum + line.text.split(/\s+/).length;
  }, 0);
  const averageLineLength = lines.length > 0 ? totalWords / lines.length : 0;

  // Check for issues
  if (opts.checkTagRepetition) {
    issues.push(...checkTagRepetition(lines));
  }

  if (opts.checkUnclearSpeakers) {
    issues.push(...checkUnclearSpeakers(lines));
  }

  if (opts.checkVoiceConsistency && voiceProfiles) {
    issues.push(...checkVoiceConsistency(lines, voiceProfiles));
  }

  if (opts.checkNaturalness) {
    issues.push(...checkNaturalness(lines));
  }

  // Calculate overall quality score
  const qualityScore = calculateQualityScore(lines, issues);

  return {
    projectId,
    chapterId,
    totalLines: lines.length,
    speakerDistribution,
    averageLineLength,
    tagDistribution,
    issues,
    overallQualityScore: qualityScore,
    analyzedAt: Date.now(),
  };
}

/**
 * Check for repetitive dialogue tags
 */
function checkTagRepetition(lines: DialogueLine[]): DialogueIssue[] {
  const issues: DialogueIssue[] = [];
  const REPETITION_THRESHOLD = 3; // Same tag 3+ times in a row

  for (let i = 0; i < lines.length - REPETITION_THRESHOLD + 1; i++) {
    const currentLine = lines[i];
    if (!currentLine) continue;

    const currentTag = currentLine.tag;
    let consecutiveCount = 1;

    for (let j = i + 1; j < lines.length && j < i + REPETITION_THRESHOLD; j++) {
      if (lines[j]?.tag === currentTag) {
        consecutiveCount++;
      } else {
        break;
      }
    }

    if (consecutiveCount >= REPETITION_THRESHOLD) {
      issues.push({
        type: 'repetitive_tag',
        severity: 'warning',
        lineId: currentLine.id,
        characterName: currentLine.characterName,
        message: `The tag "${currentTag}" is used ${consecutiveCount} times in a row`,
        suggestion: 'Try varying dialogue tags or using action beats instead',
        affectedText: currentLine.text,
      });

      i += consecutiveCount - 1; // Skip the repeated lines
    }
  }

  return issues;
}

/**
 * Check for unclear speakers (too many consecutive lines from "Unknown")
 */
function checkUnclearSpeakers(lines: DialogueLine[]): DialogueIssue[] {
  const issues: DialogueIssue[] = [];

  lines.forEach(line => {
    if (line.characterName === 'Unknown' && !line.characterId) {
      issues.push({
        type: 'unclear_speaker',
        severity: 'warning',
        lineId: line.id,
        characterName: line.characterName,
        message: 'The speaker of this dialogue is unclear',
        suggestion: 'Add a dialogue tag or action to clarify who is speaking',
        affectedText: line.text,
      });
    }
  });

  return issues;
}

/**
 * Check voice consistency against character profiles
 */
function checkVoiceConsistency(
  lines: DialogueLine[],
  voiceProfiles: Map<string, CharacterVoiceProfile>,
): DialogueIssue[] {
  const issues: DialogueIssue[] = [];

  lines.forEach(line => {
    if (!line.characterId) {
      return;
    }

    const profile = voiceProfiles.get(line.characterId);
    if (!profile) {
      return;
    }

    const wordCount = line.text.split(/\s+/).length;
    const avgWordCount = profile.speechPattern.averageWordCount;
    const deviation = Math.abs(wordCount - avgWordCount);

    // Check if line is significantly longer/shorter than character's norm
    if (deviation > avgWordCount * 0.5 && avgWordCount > 5) {
      issues.push({
        type: 'voice_inconsistency',
        severity: 'info',
        lineId: line.id,
        characterName: line.characterName,
        message: `This line (${wordCount} words) is ${wordCount > avgWordCount ? 'longer' : 'shorter'} than ${line.characterName}'s typical speech (avg: ${Math.round(avgWordCount)} words)`,
        suggestion: `Consider adjusting to match ${line.characterName}'s speech patterns`,
        affectedText: line.text,
      });
    }

    // Check formality consistency
    const hasFormalWords = /\b(indeed|moreover|furthermore|nevertheless|thus)\b/i.test(line.text);
    const hasInformalWords = /\b(yeah|nah|gonna|wanna|kinda|sorta)\b/i.test(line.text);

    if (profile.speechPattern.formalityScore > 7 && hasInformalWords) {
      issues.push({
        type: 'formality_shift',
        severity: 'warning',
        lineId: line.id,
        characterName: line.characterName,
        message: `${line.characterName} typically speaks formally, but this line contains informal language`,
        affectedText: line.text,
      });
    }

    if (profile.speechPattern.formalityScore < 4 && hasFormalWords) {
      issues.push({
        type: 'formality_shift',
        severity: 'warning',
        lineId: line.id,
        characterName: line.characterName,
        message: `${line.characterName} typically speaks informally, but this line contains formal language`,
        affectedText: line.text,
      });
    }
  });

  return issues;
}

/**
 * Check for unnatural speech patterns
 */
function checkNaturalness(lines: DialogueLine[]): DialogueIssue[] {
  const issues: DialogueIssue[] = [];

  lines.forEach(line => {
    const text = line.text;

    // Check for overly long sentences (>50 words in dialogue)
    const wordCount = text.split(/\s+/).length;
    if (wordCount > 50) {
      issues.push({
        type: 'unnatural_speech',
        severity: 'warning',
        lineId: line.id,
        characterName: line.characterName,
        message: `This dialogue is very long (${wordCount} words). People rarely speak in such long sentences.`,
        suggestion: 'Consider breaking this into multiple lines with pauses or interruptions',
        affectedText: text,
      });
    }

    // Check for exposition dumps (common words: "as you know", "remember when")
    const expositionMarkers = [
      'as you know',
      'as you remember',
      'remember when',
      'let me remind you',
      'as we discussed',
    ];

    expositionMarkers.forEach(marker => {
      if (text.toLowerCase().includes(marker)) {
        issues.push({
          type: 'unnatural_speech',
          severity: 'info',
          lineId: line.id,
          characterName: line.characterName,
          message: `This dialogue may contain "exposition dump" with phrase "${marker}"`,
          suggestion: 'Show information through action or context instead of explicit reminders',
          affectedText: text,
        });
      }
    });

    // Check for overly formal contractions avoidance in casual speech
    const hasNoContractions = !/(n't|'ll|'re|'ve|'m|'d)\b/.test(text);
    const isLongEnough = wordCount > 10;

    if (hasNoContractions && isLongEnough) {
      issues.push({
        type: 'unnatural_speech',
        severity: 'info',
        lineId: line.id,
        characterName: line.characterName,
        message: 'This dialogue has no contractions, which may sound formal or unnatural',
        suggestion: "Consider using contractions (can't, won't, it's) for more natural speech",
        affectedText: text,
      });
    }
  });

  return issues;
}

/**
 * Calculate overall quality score (0-100)
 */
function calculateQualityScore(lines: DialogueLine[], issues: DialogueIssue[]): number {
  if (lines.length === 0) {
    return 0;
  }

  let score = 100;

  // Deduct points based on issues
  issues.forEach(issue => {
    switch (issue.severity) {
      case 'error':
        score -= 10;
        break;
      case 'warning':
        score -= 5;
        break;
      case 'info':
        score -= 2;
        break;
    }
  });

  // Bonus for good tag variety
  const uniqueTags = new Set(lines.map(l => l.tag)).size;
  if (uniqueTags >= 5) {
    score += 5;
  }

  // Bonus for clear speakers
  const unclearCount = lines.filter(l => l.characterName === 'Unknown').length;
  const unclearPercentage = (unclearCount / lines.length) * 100;
  if (unclearPercentage < 10) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}
