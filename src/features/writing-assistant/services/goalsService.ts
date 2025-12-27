/**
 * Writing Goals Service
 * Manages writing goals with progress tracking
 */

import type {
  WritingGoal,
  GoalProgress,
  GoalMetricProgress,
  GoalPreset,
  WritingGoalsConfig,
  GoalAchievementStatus,
  GoalWithStatus,
} from '@/features/writing-assistant/types';
import { logger } from '@/lib/logging/logger';

import { styleAnalysisService } from './styleAnalysisService';

const STORAGE_KEY = 'novelist-writing-goals';

// ============================================================================
// Private Implementation
// ============================================================================

class GoalsService {
  private static instance: GoalsService;
  private goals: WritingGoal[] = [];
  private config: WritingGoalsConfig;

  private constructor() {
    this.config = {
      enabled: true,
      showProgressInEditor: true,
      showNotifications: true,
      notifyOnGoalAchieved: true,
      notifyOnGoalMissed: false,
      autoAnalyze: true,
      analysisDelay: 1500,
    };
    this.loadGoals();
  }

  public static getInstance(): GoalsService {
    GoalsService.instance ??= new GoalsService();
    return GoalsService.instance;
  }

  // ============================================================================
  // Goal CRUD Operations
  // ============================================================================

  /**
   * Create a new writing goal
   */
  public createGoal(goal: Omit<WritingGoal, 'id' | 'createdAt' | 'updatedAt'>): WritingGoal {
    const now = new Date();
    const newGoal: WritingGoal = {
      ...goal,
      id: `goal-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: now,
      updatedAt: now,
    };

    this.goals.push(newGoal);
    this.saveGoals();

    logger.info('Goal created', {
      component: 'GoalsService',
      goalId: newGoal.id,
      goalName: newGoal.name,
    });

    return newGoal;
  }

  /**
   * Update an existing goal
   */
  public updateGoal(goalId: string, updates: Partial<WritingGoal>): WritingGoal | null {
    const index = this.goals.findIndex(g => g.id === goalId);

    if (index === -1) {
      logger.warn('Goal not found for update', { component: 'GoalsService', goalId });
      return null;
    }

    const updatedGoal: WritingGoal = {
      ...this.goals[index]!,
      ...updates,
      updatedAt: new Date(),
    };
    this.goals[index] = updatedGoal;

    this.saveGoals();

    logger.info('Goal updated', {
      component: 'GoalsService',
      goalId,
    });

    return this.goals[index]!;
  }

  /**
   * Delete a goal
   */
  public deleteGoal(goalId: string): boolean {
    const index = this.goals.findIndex(g => g.id === goalId);

    if (index === -1) {
      logger.warn('Goal not found for deletion', { component: 'GoalsService', goalId });
      return false;
    }

    this.goals.splice(index, 1);
    this.saveGoals();

    logger.info('Goal deleted', { component: 'GoalsService', goalId });

    return true;
  }

  /**
   * Get a goal by ID
   */
  public getGoal(goalId: string): WritingGoal | undefined {
    return this.goals.find(g => g.id === goalId);
  }

  /**
   * Get all goals
   */
  public getAllGoals(): WritingGoal[] {
    return [...this.goals];
  }

  /**
   * Get active goals only
   */
  public getActiveGoals(): WritingGoal[] {
    return this.goals.filter(g => g.isActive);
  }

  /**
   * Toggle goal active state
   */
  public toggleGoalActive(goalId: string): WritingGoal | null {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) return null;

    goal.isActive = !goal.isActive;
    goal.updatedAt = new Date();
    this.saveGoals();

    return goal;
  }

  // ============================================================================
  // Progress Tracking
  // ============================================================================

  /**
   * Calculate progress for all active goals
   */
  public calculateAllProgress(content: string): Map<string, GoalProgress> {
    const progressMap = new Map<string, GoalProgress>();
    const activeGoals = this.getActiveGoals();

    for (const goal of activeGoals) {
      const progress = this.calculateGoalProgress(content, goal);
      progressMap.set(goal.id, progress);
    }

    return progressMap;
  }

  /**
   * Calculate progress for a single goal
   */
  public calculateGoalProgress(content: string, goal: WritingGoal): GoalProgress {
    const metrics: GoalMetricProgress[] = [];
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // Target readability
    if (goal.targetReadability) {
      const readability = styleAnalysisService.analyzeStyle(content);
      const fleschScore = readability.fleschReadingEase;
      const gradeLevel = readability.fleschKincaidGrade;

      const minScore = goal.targetReadability.minScore ?? 0;
      const maxScore = goal.targetReadability.maxScore ?? 100;
      const scoreStatus = this.evaluateMetric(fleschScore, minScore, maxScore);

      metrics.push({
        metricKey: 'readabilityScore',
        metricLabel: 'Readability Score',
        currentValue: fleschScore,
        targetValue: minScore,
        unit: 'Flesch',
        status: scoreStatus,
      });

      if (goal.targetReadability.gradeLevel) {
        const gradeMatch = goal.targetReadability.gradeLevel.includes(
          String(Math.round(gradeLevel)),
        );
        const gradeParts = goal.targetReadability.gradeLevel.split('-');
        metrics.push({
          metricKey: 'gradeLevel',
          metricLabel: 'Grade Level',
          currentValue: gradeLevel,
          targetValue: parseFloat(gradeParts[0] ?? '8') || 8,
          status: gradeMatch ? 'achieved' : 'below',
        });
      }
    }

    // Target length
    if (goal.targetLength) {
      const targetWords = goal.targetLength.targetWords ?? 0;
      const minWords = goal.targetLength.minWords ?? 0;
      const maxWords = goal.targetLength.maxWords ?? Infinity;

      let status: GoalMetricProgress['status'];
      if (targetWords > 0) {
        const progress = Math.min(100, (wordCount / targetWords) * 100);
        status = progress >= 100 ? 'achieved' : progress >= 80 ? 'achieving' : 'below';
      } else if (wordCount >= minWords && wordCount <= maxWords) {
        status = 'achieved';
      } else if (wordCount < minWords) {
        status = 'below';
      } else {
        status = 'exceeded';
      }

      metrics.push({
        metricKey: 'wordCount',
        metricLabel: 'Word Count',
        currentValue: wordCount,
        targetValue: targetWords || minWords,
        unit: 'words',
        status,
      });
    }

    // Target tone
    if (goal.targetTone) {
      const styleAnalysis = styleAnalysisService.analyzeStyle(content);
      const toneMatch =
        styleAnalysis.primaryTone.toLowerCase() === goal.targetTone.primary.toLowerCase();
      const intensityDiff = Math.abs(
        styleAnalysis.toneIntensity - (goal.targetTone.intensity ?? 50),
      );

      metrics.push({
        metricKey: 'tone',
        metricLabel: 'Tone',
        currentValue: toneMatch ? 100 : Math.max(0, 100 - intensityDiff * 2),
        targetValue: 100,
        unit: '% match',
        status: toneMatch && intensityDiff < 20 ? 'achieved' : 'achieving',
      });
    }

    // Target vocabulary
    if (goal.targetVocabulary?.minVocabularyDiversity !== undefined) {
      const normalizedWords = words
        .map(w => w.toLowerCase().replace(/[^a-z0-9']/g, ''))
        .filter(w => w.length > 0);
      const uniqueWordCount = new Set(normalizedWords).size;
      const totalWordCount = normalizedWords.length;
      const diversityRatio = totalWordCount > 0 ? uniqueWordCount / totalWordCount : 0;

      const targetRatio = goal.targetVocabulary.minVocabularyDiversity;
      const currentPct = Math.round(diversityRatio * 100);
      const targetPct = Math.round(targetRatio * 100);

      const status: GoalMetricProgress['status'] =
        diversityRatio >= targetRatio
          ? 'achieved'
          : diversityRatio >= targetRatio * 0.8
            ? 'achieving'
            : 'below';

      metrics.push({
        metricKey: 'vocabularyDiversity',
        metricLabel: 'Vocabulary Diversity',
        currentValue: currentPct,
        targetValue: targetPct,
        unit: '%',
        status,
      });
    }

    // Target style
    if (goal.targetStyle) {
      const styleAnalysis = styleAnalysisService.analyzeStyle(content);

      if (goal.targetStyle.voice) {
        const voiceMatch = styleAnalysis.voiceType === goal.targetStyle.voice;
        metrics.push({
          metricKey: 'voice',
          metricLabel: 'Voice',
          currentValue: voiceMatch ? 100 : 50,
          targetValue: 100,
          unit: '%',
          status: voiceMatch ? 'achieved' : 'below',
        });
      }

      if (goal.targetStyle.perspective) {
        const perspectiveMatch = styleAnalysis.perspective === goal.targetStyle.perspective;
        metrics.push({
          metricKey: 'perspective',
          metricLabel: 'Perspective',
          currentValue: perspectiveMatch ? 100 : 50,
          targetValue: 100,
          unit: '%',
          status: perspectiveMatch ? 'achieved' : 'below',
        });
      }
    }

    // Calculate overall progress
    const achievedMetrics = metrics.filter(m => m.status === 'achieved' || m.status === 'exceeded');
    const progress =
      metrics.length > 0 ? Math.round((achievedMetrics.length / metrics.length) * 100) : 100;

    const isAchieved = progress >= 80;
    const feedback = this.generateProgressFeedback(goal, progress, metrics);

    return {
      goalId: goal.id,
      goalName: goal.name,
      isAchieved,
      progress,
      metrics,
      feedback,
    };
  }

  /**
   * Evaluate a metric against min/max bounds
   */
  private evaluateMetric(value: number, min: number, max: number): GoalMetricProgress['status'] {
    if (value >= min && value <= max) return 'achieved';
    if (value > max) return 'exceeded';
    return 'below';
  }

  /**
   * Generate feedback for goal progress
   */
  private generateProgressFeedback(
    goal: WritingGoal,
    progress: number,
    metrics: GoalMetricProgress[],
  ): string {
    if (progress >= 100) {
      return `Congratulations! You've achieved your "${goal.name}" goal!`;
    }

    if (progress >= 80) {
      return `You're almost there for "${goal.name}". Keep going!`;
    }

    const belowMetrics = metrics.filter(m => m.status === 'below');
    if (belowMetrics.length > 0) {
      const labels = belowMetrics.slice(0, 2).map(m => m.metricLabel);
      return `For "${goal.name}", focus on: ${labels.join(', ')}`;
    }

    return `Continue working on "${goal.name}"`;
  }

  // ============================================================================
  // Presets
  // ============================================================================

  /**
   * Apply a preset to create goals
   */
  public applyPreset(presetId: string): WritingGoal[] {
    const preset = this.getPresetById(presetId);
    if (!preset) {
      logger.warn('Preset not found', { component: 'GoalsService', presetId });
      return [];
    }

    const createdGoals: WritingGoal[] = [];
    for (const goalTemplate of preset.goals) {
      const goal = this.createGoal({
        ...goalTemplate,
        isTemplate: goalTemplate.isTemplate ?? false,
        name: `${preset.name} - ${Object.keys(goalTemplate)[0]}`,
        description: `Goal from ${preset.name} preset`,
        isActive: true,
      });
      createdGoals.push(goal);
    }

    logger.info('Preset applied', {
      component: 'GoalsService',
      presetId,
      goalsCreated: createdGoals.length,
    });

    return createdGoals;
  }

  /**
   * Get all available presets
   */
  public getAllPresets(): GoalPreset[] {
    // In a real app, this might come from a server or be more dynamic
    return [
      {
        id: 'preset-young-adult',
        name: 'Young Adult Fiction',
        description: 'Optimized for YA readers (grades 7-10)',
        category: 'genre',
        goals: [
          {
            targetReadability: { minScore: 60, maxScore: 80, gradeLevel: '7-10' },
          },
          {
            targetStyle: { voice: 'active', perspective: 'third_limited' },
          },
          {
            targetLength: { targetWords: 2500 },
          },
        ],
      },
      {
        id: 'preset-literary',
        name: 'Literary Fiction',
        description: 'Complex prose for literary readers',
        category: 'genre',
        goals: [
          {
            targetReadability: { minScore: 40, maxScore: 70 },
          },
          {
            targetTone: { primary: 'literary', intensity: 70 },
          },
          {
            targetStyle: { formality: 'formal' },
          },
        ],
      },
      {
        id: 'preset-children',
        name: "Children's Book",
        description: 'Simple language for young readers',
        category: 'audience',
        goals: [
          {
            targetReadability: { minScore: 80, gradeLevel: '1-5' },
          },
          {
            targetStyle: { voice: 'active', perspective: 'third_limited' },
          },
          {
            targetLength: { maxWords: 1000 },
          },
        ],
      },
      {
        id: 'preset-thriller',
        name: 'Thriller / Suspense',
        description: 'Fast-paced, tension-filled writing',
        category: 'genre',
        goals: [
          {
            targetTone: { primary: 'tense', intensity: 85 },
          },
          {
            targetStyle: { voice: 'active' },
          },
          {
            targetLength: { targetWords: 3500 },
          },
        ],
      },
    ];
  }

  /**
   * Get a preset by ID
   */
  public getPresetById(presetId: string): GoalPreset | undefined {
    return this.getAllPresets().find(p => p.id === presetId);
  }

  // ============================================================================
  // Goals with Status
  // ============================================================================

  /**
   * Get all goals with their current status
   */
  public getGoalsWithStatus(content: string): GoalWithStatus[] {
    return this.goals.map(goal => {
      const progress = this.calculateGoalProgress(content, goal);
      let status: GoalAchievementStatus;

      if (!goal.isActive) {
        status = 'abandoned';
      } else if (progress.isAchieved) {
        status = 'achieved';
      } else if (progress.progress > 0) {
        status = 'in_progress';
      } else if (progress.progress >= 100) {
        status = 'exceeded';
      } else {
        status = 'not_started';
      }

      return {
        goal,
        status,
        progress: progress.progress,
        lastAnalyzed: new Date(),
      };
    });
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  /**
   * Update service configuration
   */
  public updateConfig(updates: Partial<WritingGoalsConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current configuration
   */
  public getConfig(): WritingGoalsConfig {
    return { ...this.config };
  }

  // ============================================================================
  // Import/Export
  // ============================================================================

  /**
   * Export goals as JSON string
   */
  public exportGoals(): string {
    return JSON.stringify(this.goals, null, 2);
  }

  /**
   * Import goals from JSON string
   */
  public importGoals(data: string): WritingGoal[] {
    try {
      const imported = JSON.parse(data) as WritingGoal[];
      const validGoals = imported.filter(g => g.id && g.name && typeof g.isActive === 'boolean');

      for (const goal of validGoals) {
        if (!this.goals.find(g => g.id === goal.id)) {
          this.goals.push({ ...goal, createdAt: new Date(goal.createdAt), updatedAt: new Date() });
        }
      }

      this.saveGoals();

      logger.info('Goals imported', {
        component: 'GoalsService',
        count: validGoals.length,
      });

      return validGoals;
    } catch (error) {
      logger.error('Failed to import goals', {
        component: 'GoalsService',
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  // ============================================================================
  // Persistence
  // ============================================================================

  private loadGoals(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.goals = Array.isArray(parsed)
          ? parsed.map((g: WritingGoal) => ({
              ...g,
              createdAt: new Date(g.createdAt),
              updatedAt: new Date(g.updatedAt),
            }))
          : [];
      }
    } catch (error) {
      logger.error('Failed to load goals from storage', {
        component: 'GoalsService',
        error: error instanceof Error ? error.message : String(error),
      });
      this.goals = [];
    }
  }

  private saveGoals(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.goals));
    } catch (error) {
      logger.error('Failed to save goals to storage', {
        component: 'GoalsService',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Clear all goals
   */
  public clearAllGoals(): void {
    this.goals = [];
    this.saveGoals();
  }
}

export const goalsService = GoalsService.getInstance();
