/**
 * Plot Analysis Service
 *
 * Core service for analyzing story structure, pacing, and narrative coherence
 */

import type {
  AnalysisRequest,
  AnalysisResult,
  ChapterPacing,
  PacingAnalysis,
  StoryArc,
  StoryStructure,
  TensionCurve,
} from '@/features/plot-engine';
import { logger } from '@/lib/logging/logger';
import type { Chapter } from '@/shared/types';

export class PlotAnalysisService {
  /**
   * Analyze project's story structure and pacing
   */
  public async analyzeProject(
    projectId: string,
    chapters: Chapter[],
    request: AnalysisRequest,
  ): Promise<AnalysisResult> {
    try {
      logger.info('Starting plot analysis', { projectId, chapters: chapters.length });

      const result: AnalysisResult = {
        projectId,
        analyzedAt: new Date(),
      };

      // Analyze story arc if requested
      if (request.includeStoryArc || request.includePacing) {
        result.storyArc = await this.analyzeStoryArc(chapters);
      }

      logger.info('Plot analysis complete', { projectId });
      return result;
    } catch (error) {
      logger.error('Plot analysis failed', { projectId, error });
      throw error;
    }
  }

  /**
   * Analyze story structure and identify acts
   */
  private async analyzeStoryArc(chapters: Chapter[]): Promise<StoryArc> {
    const structure = this.detectStoryStructure(chapters);
    const pacing = this.analyzePacing(chapters);
    const tension = this.analyzeTensionCurve(chapters);
    const coherence = this.calculateCoherence(chapters);

    const recommendations = this.generateRecommendations(pacing, tension, coherence);

    return {
      structure,
      pacing,
      tension,
      coherence,
      recommendations,
    };
  }

  /**
   * Detect story structure (3-act, 5-act, etc.)
   */
  private detectStoryStructure(chapters: Chapter[]): StoryStructure {
    const totalChapters = chapters.length;

    // Default to 3-act structure for most stories
    if (totalChapters <= 15) {
      return '3-act';
    }

    // Longer stories might benefit from 5-act
    if (totalChapters >= 30) {
      return '5-act';
    }

    return '3-act';
  }

  /**
   * Analyze pacing across chapters
   */
  private analyzePacing(chapters: Chapter[]): PacingAnalysis {
    const byChapter: ChapterPacing[] = chapters.map((chapter, index) => {
      const wordCount = this.countWords(chapter.content);
      const pace = this.calculateChapterPace(chapter, wordCount);
      const tensionLevel = this.estimateTensionLevel(chapter, index, chapters.length);

      return {
        chapterId: chapter.id,
        chapterNumber: index + 1,
        pace,
        wordCount,
        tensionLevel,
      };
    });

    // Calculate overall pace
    const averagePace = byChapter.reduce((sum, ch) => sum + ch.pace, 0) / byChapter.length;
    const overall = this.categorizePace(averagePace);
    const score = Math.round(averagePace);

    const recommendations = this.generatePacingRecommendations(byChapter, overall);

    return {
      overall,
      score,
      byChapter,
      recommendations,
    };
  }

  /**
   * Calculate pace for a single chapter
   */
  private calculateChapterPace(chapter: Chapter, wordCount: number): number {
    // Base pace on word count
    let pace = 50; // neutral baseline

    // Adjust for word count (shorter = faster pace)
    if (wordCount < 1000) {
      pace += 20;
    } else if (wordCount > 3000) {
      pace -= 20;
    }

    // Adjust for dialogue density (more dialogue = faster pace)
    const dialogueRatio = this.estimateDialogueRatio(chapter.content);
    pace += dialogueRatio * 20;

    // Adjust for action words
    const actionDensity = this.estimateActionDensity(chapter.content);
    pace += actionDensity * 15;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, pace));
  }

  /**
   * Estimate dialogue ratio in content
   */
  private estimateDialogueRatio(content: string): number {
    const dialogueMatches = content.match(/"[^"]*"/g);
    if (!dialogueMatches) return 0;

    const dialogueLength = dialogueMatches.join('').length;
    const totalLength = content.length;

    return Math.min(1, dialogueLength / totalLength);
  }

  /**
   * Estimate action density
   */
  private estimateActionDensity(content: string): number {
    const actionWords = [
      'ran',
      'jumped',
      'fought',
      'attacked',
      'rushed',
      'grabbed',
      'threw',
      'kicked',
      'punched',
      'dodged',
      'chased',
      'fled',
      'sprinted',
    ];

    const words = content.toLowerCase().split(/\s+/);
    const actionCount = words.filter(word =>
      actionWords.some(action => word.includes(action)),
    ).length;

    return Math.min(1, actionCount / 100);
  }

  /**
   * Categorize pace
   */
  private categorizePace(pace: number): 'slow' | 'moderate' | 'fast' {
    if (pace < 40) return 'slow';
    if (pace > 70) return 'fast';
    return 'moderate';
  }

  /**
   * Analyze tension curve across story
   */
  private analyzeTensionCurve(chapters: Chapter[]): TensionCurve[] {
    return chapters.map((chapter, index) => {
      const tensionLevel = this.estimateTensionLevel(chapter, index, chapters.length);
      const emotional = this.categorizeEmotionalState(tensionLevel);
      const events = this.extractKeyEvents(chapter.content);

      return {
        chapterId: chapter.id,
        chapterNumber: index + 1,
        tensionLevel,
        emotional,
        events,
      };
    });
  }

  /**
   * Estimate tension level for a chapter
   */
  private estimateTensionLevel(chapter: Chapter, index: number, totalChapters: number): number {
    // Base tension on story position (following typical dramatic arc)
    const position = index / totalChapters;
    let tension = 30; // baseline

    // Rising action (first 60%)
    if (position < 0.6) {
      tension = 30 + (position / 0.6) * 40;
    }
    // Climax (60-80%)
    else if (position < 0.8) {
      tension = 70 + ((position - 0.6) / 0.2) * 25;
    }
    // Falling action (80-100%)
    else {
      tension = 95 - ((position - 0.8) / 0.2) * 45;
    }

    // Adjust for content indicators
    const content = chapter.content.toLowerCase();

    // Increase tension for conflict words
    const conflictWords = ['fight', 'attack', 'danger', 'threat', 'fear', 'terror', 'death'];
    const hasConflict = conflictWords.some(word => content.includes(word));
    if (hasConflict) tension += 10;

    // Decrease tension for calm words
    const calmWords = ['peace', 'rest', 'calm', 'safe', 'comfort', 'relief'];
    const hasCalm = calmWords.some(word => content.includes(word));
    if (hasCalm) tension -= 10;

    return Math.max(0, Math.min(100, tension));
  }

  /**
   * Categorize emotional state
   */
  private categorizeEmotionalState(
    tensionLevel: number,
  ): 'calm' | 'tense' | 'climactic' | 'resolution' {
    if (tensionLevel < 30) return 'calm';
    if (tensionLevel < 60) return 'tense';
    if (tensionLevel < 85) return 'climactic';
    return 'resolution';
  }

  /**
   * Extract key events from chapter
   */
  private extractKeyEvents(content: string): string[] {
    // Simple extraction: look for sentences with key action verbs
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const keyVerbs = ['fought', 'discovered', 'revealed', 'died', 'escaped', 'confronted'];

    return sentences
      .filter(sentence => keyVerbs.some(verb => sentence.toLowerCase().includes(verb)))
      .map(s => s.trim().substring(0, 100))
      .slice(0, 3);
  }

  /**
   * Calculate narrative coherence score
   */
  private calculateCoherence(chapters: Chapter[]): number {
    if (chapters.length === 0) return 0;

    let coherenceScore = 1.0;

    // Penalize missing chapters
    const hasGaps = chapters.some((ch, i) => i > 0 && !ch.content);
    if (hasGaps) coherenceScore -= 0.2;

    // Check for consistent chapter lengths
    const wordCounts = chapters.map(ch => this.countWords(ch.content));
    const avgLength = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
    const variance =
      wordCounts.reduce((sum, count) => sum + Math.abs(count - avgLength), 0) / wordCounts.length;

    // High variance in chapter length can indicate inconsistent pacing
    if (variance > avgLength * 0.5) {
      coherenceScore -= 0.1;
    }

    // Check for empty or very short chapters
    const tooShort = wordCounts.filter(count => count < 500).length;
    if (tooShort > chapters.length * 0.2) {
      coherenceScore -= 0.15;
    }

    return Math.max(0, Math.min(1, coherenceScore));
  }

  /**
   * Generate pacing recommendations
   */
  private generatePacingRecommendations(
    chapterPacing: ChapterPacing[],
    overall: 'slow' | 'moderate' | 'fast',
  ): string[] {
    const recommendations: string[] = [];

    // Overall pacing feedback
    if (overall === 'slow') {
      recommendations.push('Consider increasing the pace with more action or dialogue');
      recommendations.push('Look for opportunities to trim descriptive passages');
    } else if (overall === 'fast') {
      recommendations.push('Consider adding moments of reflection or character development');
      recommendations.push('Balance action with quieter, emotional scenes');
    }

    // Identify pacing issues in specific chapters
    const slowChapters = chapterPacing.filter(ch => ch.pace < 30);
    if (slowChapters.length > 0) {
      recommendations.push(
        `Chapters ${slowChapters.map(ch => ch.chapterNumber).join(', ')} have slow pacing - consider adding tension or conflict`,
      );
    }

    const fastChapters = chapterPacing.filter(ch => ch.pace > 80);
    if (fastChapters.length > 0) {
      recommendations.push(
        `Chapters ${fastChapters.map(ch => ch.chapterNumber).join(', ')} move very quickly - consider adding breathing room`,
      );
    }

    // Check for monotonous pacing
    const paceVariance =
      chapterPacing.reduce((sum, ch) => sum + Math.abs(ch.pace - 50), 0) / chapterPacing.length;
    if (paceVariance < 15) {
      recommendations.push(
        'Pacing is somewhat monotonous - vary chapter intensity for better rhythm',
      );
    }

    return recommendations;
  }

  /**
   * Generate overall recommendations
   */
  private generateRecommendations(
    pacing: PacingAnalysis,
    tension: TensionCurve[],
    coherence: number,
  ): string[] {
    const recommendations: string[] = [];

    // Add pacing recommendations
    recommendations.push(...pacing.recommendations);

    // Tension curve recommendations
    const maxTension = Math.max(...tension.map(t => t.tensionLevel));
    if (maxTension < 70) {
      recommendations.push(
        'Story lacks a strong climactic moment - consider adding a high-stakes confrontation',
      );
    }

    const minTension = Math.min(...tension.map(t => t.tensionLevel));
    if (minTension > 40) {
      recommendations.push(
        'Story maintains high tension throughout - consider adding quieter moments for contrast',
      );
    }

    // Coherence recommendations
    if (coherence < 0.7) {
      recommendations.push(
        'Narrative coherence could be improved - review chapter flow and consistency',
      );
    }

    return recommendations.slice(0, 10); // Limit to top 10 recommendations
  }

  /**
   * Count words in content
   */
  private countWords(content: string): number {
    return content
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }
}

export const plotAnalysisService = new PlotAnalysisService();
