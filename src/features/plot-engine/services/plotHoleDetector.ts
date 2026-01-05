/**
 * Plot Hole Detector Service
 *
 * Detects continuity errors, logical inconsistencies, and unresolved plot threads
 */

import type { PlotHole, PlotHoleAnalysis } from '@/features/plot-engine';
import { logger } from '@/lib/logging/logger';
import type { Chapter, Character } from '@/shared/types';

export class PlotHoleDetector {
  /**
   * Analyze chapters for plot holes
   */
  public async detectPlotHoles(
    projectId: string,
    chapters: Chapter[],
    characters: Character[],
  ): Promise<PlotHoleAnalysis> {
    try {
      logger.info('Starting plot hole detection', { projectId, chapters: chapters.length });

      const plotHoles: PlotHole[] = [];

      // Run various detection algorithms
      plotHoles.push(...this.detectTimelineIssues(chapters));
      plotHoles.push(...this.detectCharacterInconsistencies(chapters, characters));
      plotHoles.push(...this.detectUnresolvedThreads(chapters));
      plotHoles.push(...this.detectLogicalInconsistencies(chapters));

      // Calculate overall score (100 = no issues)
      const overallScore = this.calculateScore(plotHoles);

      const summary = this.generateSummary(plotHoles, overallScore);

      logger.info('Plot hole detection complete', {
        projectId,
        plotHoles: plotHoles.length,
        score: overallScore,
      });

      return {
        projectId,
        analyzedAt: new Date(),
        plotHoles,
        overallScore,
        summary,
      };
    } catch (error) {
      logger.error('Plot hole detection failed', { projectId, error });
      throw error;
    }
  }

  /**
   * Detect timeline inconsistencies
   */
  private detectTimelineIssues(chapters: Chapter[]): PlotHole[] {
    const issues: PlotHole[] = [];

    // Check for time references
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      if (!chapter) continue;

      const content = chapter.content.toLowerCase();

      // Look for temporal markers
      const timeReferences = content.match(/\b(\d+)\s*(hour|minute|day|week|month|year)s?\b/g);

      // Check for impossible time progression
      if (i > 0) {
        const prevChapter = chapters[i - 1];
        if (!prevChapter) continue;

        const prevContent = prevChapter.content.toLowerCase();

        // Check if prev ends in morning and current is also morning without time passing...
        const prevEndsMorning = /\b(morning|dawn|sunrise)\b/.test(prevContent.slice(-500));
        const currStartsMorning = /\b(morning|dawn|sunrise)\b/.test(content.slice(0, 500));
        const noTimePassed = !timeReferences;

        if (prevEndsMorning && currStartsMorning && noTimePassed) {
          issues.push({
            id: `timeline-${chapter.id}`,
            type: 'timeline',
            severity: 'minor',
            title: 'Potential timeline issue',
            description: `Chapter ${i + 1} and previous chapter both reference morning without clear time progression`,
            affectedChapters: [prevChapter.id, chapter.id],
            affectedCharacters: [],
            confidence: 0.6,
            detected: new Date(),
          });
        }
      }
    }

    return issues;
  }

  /**
   * Detect character behavior inconsistencies
   */
  private detectCharacterInconsistencies(chapters: Chapter[], characters: Character[]): PlotHole[] {
    const issues: PlotHole[] = [];

    for (const character of characters) {
      const mentions = this.findCharacterMentions(chapters, character.name);

      // Check if character appears then disappears without explanation
      if (mentions.length > 0) {
        // If character appears early, disappears for many chapters, then reappears
        if (mentions.length >= 3) {
          for (let i = 1; i < mentions.length; i++) {
            const prev = mentions[i - 1];
            const curr = mentions[i];
            if (!prev || !curr) continue;

            const gap = curr.chapterIndex - prev.chapterIndex;

            if (gap > 5) {
              issues.push({
                id: `character-absence-${character.id}-${curr.chapterId}`,
                type: 'character_inconsistency',
                severity: 'moderate',
                title: `${character.name} unexplained absence`,
                description: `${character.name} disappears for ${gap} chapters without explanation`,
                affectedChapters: [prev.chapterId, curr.chapterId],
                affectedCharacters: [character.id],
                suggestedFix: `Add a mention of ${character.name}'s whereabouts or reason for absence`,
                confidence: 0.7,
                detected: new Date(),
              });
            }
          }
        }
      }

      // Check for character trait contradictions
      if (character.psychology?.personalityTraits || character.psychology?.flaws) {
        const traitIssues = this.detectTraitContradictions(chapters, character);
        issues.push(...traitIssues);
      }
    }

    return issues;
  }

  /**
   * Find all mentions of a character in chapters
   */
  private findCharacterMentions(
    chapters: Chapter[],
    characterName: string,
  ): Array<{ chapterId: string; chapterIndex: number }> {
    const mentions: Array<{ chapterId: string; chapterIndex: number }> = [];

    chapters.forEach((chapter, index) => {
      if (chapter.content.toLowerCase().includes(characterName.toLowerCase())) {
        mentions.push({ chapterId: chapter.id, chapterIndex: index });
      }
    });

    return mentions;
  }

  /**
   * Detect unresolved plot threads
   */
  private detectUnresolvedThreads(chapters: Chapter[]): PlotHole[] {
    const issues: PlotHole[] = [];

    // Look for setup without payoff
    const setupPhrases = [
      'would return',
      'would come back',
      'promised to',
      'vowed to',
      'planned to',
      'intended to',
      'must',
      'had to',
    ];

    chapters.forEach((chapter, index) => {
      for (const phrase of setupPhrases) {
        // eslint-disable-next-line security/detect-non-literal-regexp
        const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
        const matches = chapter.content.match(regex);

        if (matches && matches.length > 0) {
          // Check if there's payoff in later chapters
          const hasPayoff = chapters.slice(index + 1).some(laterChapter => {
            // Simple check: look for resolution words in same context
            return (
              laterChapter.content.toLowerCase().includes('returned') ||
              laterChapter.content.toLowerCase().includes('fulfilled') ||
              laterChapter.content.toLowerCase().includes('completed')
            );
          });

          if (!hasPayoff && index < chapters.length - 3) {
            issues.push({
              id: `unresolved-${chapter.id}-${phrase}`,
              type: 'unresolved_thread',
              severity: 'moderate',
              title: 'Potentially unresolved plot thread',
              description: `Chapter ${index + 1} sets up expectations ("${phrase}") that may not be resolved`,
              affectedChapters: [chapter.id],
              affectedCharacters: [],
              suggestedFix: 'Ensure this setup is resolved in later chapters or remove the promise',
              confidence: 0.5,
              detected: new Date(),
            });
          }
        }
      }
    });

    return issues;
  }

  /**
   * Detect logical inconsistencies
   */
  private detectLogicalInconsistencies(chapters: Chapter[]): PlotHole[] {
    const issues: PlotHole[] = [];

    chapters.forEach(chapter => {
      const content = chapter.content;

      // Look for contradictory statements (simplified)
      // Example: "The door was locked" vs "He opened the door"
      const lockedMatch = content.match(/(?:door|gate|entrance) (?:was|is) locked/i);
      const openedMatch = content.match(/opened (?:the )?(?:door|gate|entrance)/i);

      if (lockedMatch && openedMatch) {
        const lockedIndex = content.indexOf(lockedMatch[0]);
        const openedIndex = content.indexOf(openedMatch[0]);

        // Check if opening comes after locking without unlocking mention
        if (openedIndex > lockedIndex && !content.includes('unlock')) {
          issues.push({
            id: `logic-${chapter.id}-locked-door`,
            type: 'logic',
            severity: 'minor',
            title: 'Logical inconsistency: locked door',
            description:
              'Door is described as locked but later opened without mention of unlocking',
            affectedChapters: [chapter.id],
            affectedCharacters: [],
            suggestedFix: 'Add mention of unlocking the door or explain how it was opened',
            confidence: 0.7,
            detected: new Date(),
          });
        }
      }
    });

    return issues;
  }

  /**
   * Calculate overall plot quality score
   */
  private calculateScore(plotHoles: PlotHole[]): number {
    let score = 100;

    for (const hole of plotHoles) {
      let penalty = 0;

      // Adjust penalty based on severity
      switch (hole.severity) {
        case 'critical':
          penalty = 15;
          break;
        case 'major':
          penalty = 10;
          break;
        case 'moderate':
          penalty = 5;
          break;
        case 'minor':
          penalty = 2;
          break;
      }

      // Adjust by confidence
      penalty *= hole.confidence;

      score -= penalty;
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Detect trait contradictions
   */
  private detectTraitContradictions(chapters: Chapter[], character: Character): PlotHole[] {
    const issues: PlotHole[] = [];

    // Look for contradictory behavior patterns
    // This is a simplified check - in reality would use NLP
    const personalityTraits = character.psychology?.personalityTraits || [];
    const flaws = character.psychology?.flaws || [];
    const traits = [...personalityTraits, ...flaws];

    for (const trait of traits) {
      if (trait === 'brave' || trait === 'confident') {
        // Look for cowardly actions
        const cowardlyActions = chapters.filter(
          ch =>
            ch.content.toLowerCase().includes(`${character.name.toLowerCase()} fled`) ||
            ch.content.toLowerCase().includes(`${character.name.toLowerCase()} ran away`),
        );

        if (cowardlyActions.length > 2) {
          issues.push({
            id: `trait-contradiction-${character.id}-${trait}`,
            type: 'character_inconsistency',
            severity: 'moderate',
            title: `${character.name} acts inconsistently`,
            description: `${character.name} is described as ${trait} but frequently flees from danger`,
            affectedChapters: cowardlyActions.map(ch => ch.id),
            affectedCharacters: [character.id],
            suggestedFix: `Either adjust ${character.name}'s personality description or show character growth`,
            confidence: 0.65,
            detected: new Date(),
          });
        }
      }
    }

    return issues;
  }

  /**
   * Generate summary of findings
   */
  private generateSummary(plotHoles: PlotHole[], score: number): string {
    if (plotHoles.length === 0) {
      return 'No significant plot holes detected. The narrative appears coherent and consistent.';
    }

    const critical = plotHoles.filter(h => h.severity === 'critical').length;
    const major = plotHoles.filter(h => h.severity === 'major').length;
    const moderate = plotHoles.filter(h => h.severity === 'moderate').length;
    const minor = plotHoles.filter(h => h.severity === 'minor').length;

    let summary = `Found ${plotHoles.length} potential issue${plotHoles.length > 1 ? 's' : ''}. `;

    if (critical > 0) {
      summary += `${critical} critical, `;
    }
    if (major > 0) {
      summary += `${major} major, `;
    }
    if (moderate > 0) {
      summary += `${moderate} moderate, `;
    }
    if (minor > 0) {
      summary += `${minor} minor. `;
    }

    if (score >= 90) {
      summary += 'Overall narrative quality is excellent.';
    } else if (score >= 75) {
      summary += 'Overall narrative quality is good with minor issues.';
    } else if (score >= 60) {
      summary += 'Overall narrative quality is fair but needs attention.';
    } else {
      summary += 'Overall narrative quality needs significant improvement.';
    }

    return summary;
  }
}

export const plotHoleDetector = new PlotHoleDetector();
