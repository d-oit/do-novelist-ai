/**
 * Real-Time Analysis Service
 * Manages background analysis with debouncing and request batching
 */

import type {
  RealTimeAnalysisState,
  RealTimeConfig,
  AnalysisBatch,
  AnalysisType,
  InlineSuggestion,
} from '@/features/writing-assistant/types';
import { logger } from '@/lib/logging/logger';

import { goalsService } from './goalsService';
import { grammarSuggestionService } from './grammarSuggestionService';
import { styleAnalysisService } from './styleAnalysisService';

const DEFAULT_CONFIG: RealTimeConfig = {
  enabled: true,
  debounceMs: 500,
  batchIntervalMs: 200,
  maxBatchSize: 5,
  maxConcurrentAnalyses: 2,
  showInlineSuggestions: true,
  highlightDuration: 3000,
  autoApplySafe: false,
};

// ============================================================================
// Private Implementation
// ============================================================================

class RealTimeAnalysisService {
  private static instance: RealTimeAnalysisService;

  private config: RealTimeConfig;
  private state: RealTimeAnalysisState;
  private pendingBatches: AnalysisBatch[] = [];
  private processingBatches: AnalysisBatch[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private activeAnalysisCount = 0;
  private contentChangeCallback: ((content: string) => void) | null = null;

  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.state = {
      isActive: false,
      isAnalyzing: false,
      currentGrammarSuggestions: [],
      currentInlineSuggestions: [],
      goalProgress: {},
      analysisDuration: 0,
      pendingChanges: 0,
    };
  }

  public static getInstance(): RealTimeAnalysisService {
    RealTimeAnalysisService.instance ??= new RealTimeAnalysisService();
    return RealTimeAnalysisService.instance;
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  /**
   * Update service configuration
   */
  public updateConfig(updates: Partial<RealTimeConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current configuration
   */
  public getConfig(): RealTimeConfig {
    return { ...this.config };
  }

  /**
   * Reset configuration to defaults
   */
  public resetConfig(): void {
    this.config = { ...DEFAULT_CONFIG };
  }

  // ============================================================================
  // Service Control
  // ============================================================================

  /**
   * Start real-time analysis
   */
  public start(): void {
    if (this.state.isActive) return;

    this.state.isActive = true;

    logger.info('Real-time analysis started', {
      component: 'RealTimeAnalysisService',
      debounceMs: this.config.debounceMs,
    });

    // Start batch processing loop
    this.startBatchProcessing();
  }

  /**
   * Stop real-time analysis
   */
  public stop(): void {
    if (!this.state.isActive) return;

    this.state.isActive = false;

    // Clear timers
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }

    // Clear pending batches
    this.pendingBatches = [];

    logger.info('Real-time analysis stopped', {
      component: 'RealTimeAnalysisService',
    });
  }

  /**
   * Check if service is active
   */
  public isActive(): boolean {
    return this.state.isActive;
  }

  /**
   * Check if currently analyzing
   */
  public isAnalyzing(): boolean {
    return this.state.isAnalyzing;
  }

  // ============================================================================
  // Content Analysis
  // ============================================================================

  /**
   * Queue content for analysis
   */
  public queueAnalysis(
    content: string,
    analyses: AnalysisType[] = ['all'],
    priority: 'low' | 'normal' | 'high' = 'normal',
  ): void {
    if (!this.config.enabled) return;

    const batch: AnalysisBatch = {
      id: `batch-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      content,
      timestamp: new Date(),
      requestedBy: 'auto',
      priority,
      analyses: analyses.includes('all') ? ['style', 'grammar', 'goals', 'readability'] : analyses,
      status: 'pending',
    };

    this.pendingBatches.push(batch);
    this.state.pendingChanges++;

    // Trigger debounced analysis
    this.scheduleDebouncedAnalysis();

    logger.debug('Analysis queued', {
      component: 'RealTimeAnalysisService',
      batchId: batch.id,
      analyses: batch.analyses,
    });
  }

  /**
   * Perform immediate analysis (bypass debouncing)
   */
  public async analyzeNow(
    content: string,
    analyses: AnalysisType[] = ['all'],
  ): Promise<RealTimeAnalysisState> {
    const startTime = Date.now();

    try {
      this.state.isAnalyzing = true;
      this.state.lastAnalyzedContent = content;

      const results = await this.performAnalysis(content, analyses);

      this.state.currentStyleAnalysis = results.style;
      this.state.currentGrammarSuggestions = results.grammar;
      this.state.goalProgress = results.goals;
      this.state.currentInlineSuggestions = this.buildInlineSuggestions(
        results.grammar,
        results.style,
        results.goals,
      );
      this.state.lastAnalysisTime = new Date();
      this.state.error = undefined;

      this.state.analysisDuration = Date.now() - startTime;

      logger.info('Immediate analysis completed', {
        component: 'RealTimeAnalysisService',
        duration: this.state.analysisDuration,
        suggestionCount: this.state.currentGrammarSuggestions.length,
      });

      return this.state;
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Analysis failed';

      logger.error('Immediate analysis failed', {
        component: 'RealTimeAnalysisService',
        error: this.state.error,
      });

      return this.state;
    } finally {
      this.state.isAnalyzing = false;
    }
  }

  /**
   * Get current analysis state
   */
  public getState(): RealTimeAnalysisState {
    return { ...this.state };
  }

  /**
   * Get current suggestions
   */
  public getSuggestions(): InlineSuggestion[] {
    return [...this.state.currentInlineSuggestions];
  }

  /**
   * Get style analysis result
   */
  public getStyleAnalysis() {
    return this.state.currentStyleAnalysis;
  }

  /**
   * Get grammar suggestions
   */
  public getGrammarSuggestions() {
    return this.state.currentGrammarSuggestions;
  }

  /**
   * Get goal progress
   */
  public getGoalProgress() {
    return new Map(Object.entries(this.state.goalProgress));
  }

  // ============================================================================
  // Suggestion Actions
  // ============================================================================

  /**
   * Accept a suggestion
   */
  public acceptSuggestion(suggestionId: string): boolean {
    const index = this.state.currentInlineSuggestions.findIndex(s => s.id === suggestionId);

    if (index === -1) {
      logger.warn('Suggestion not found for acceptance', { suggestionId });
      return false;
    }

    this.state.currentInlineSuggestions.splice(index, 1);

    logger.info('Suggestion accepted', {
      component: 'RealTimeAnalysisService',
      suggestionId,
    });

    return true;
  }

  /**
   * Dismiss a suggestion
   */
  public dismissSuggestion(suggestionId: string): boolean {
    const index = this.state.currentInlineSuggestions.findIndex(s => s.id === suggestionId);

    if (index === -1) {
      logger.warn('Suggestion not found for dismissal', { suggestionId });
      return false;
    }

    this.state.currentInlineSuggestions.splice(index, 1);

    logger.info('Suggestion dismissed', {
      component: 'RealTimeAnalysisService',
      suggestionId,
    });

    return true;
  }

  /**
   * Dismiss all suggestions of a type
   */
  public dismissAllByType(type: InlineSuggestion['type']): number {
    const initialLength = this.state.currentInlineSuggestions.length;
    this.state.currentInlineSuggestions = this.state.currentInlineSuggestions.filter(
      s => s.type !== type,
    );
    const removed = initialLength - this.state.currentInlineSuggestions.length;

    logger.info('Suggestions dismissed by type', {
      component: 'RealTimeAnalysisService',
      type,
      count: removed,
    });

    return removed;
  }

  /**
   * Clear all suggestions
   */
  public clearAllSuggestions(): void {
    this.state.currentInlineSuggestions = [];
    this.state.currentGrammarSuggestions = [];

    logger.info('All suggestions cleared', {
      component: 'RealTimeAnalysisService',
    });
  }

  // ============================================================================
  // Analysis Methods
  // ============================================================================

  private async performAnalysis(
    content: string,
    analyses: AnalysisType[],
  ): Promise<{
    style: ReturnType<typeof styleAnalysisService.analyzeStyle>;
    grammar: ReturnType<typeof grammarSuggestionService.analyzeGrammar>['suggestions'];
    goals: Record<string, ReturnType<typeof goalsService.calculateGoalProgress>>;
  }> {
    const results: {
      style: ReturnType<typeof styleAnalysisService.analyzeStyle>;
      grammar: ReturnType<typeof grammarSuggestionService.analyzeGrammar>['suggestions'];
      goals: Record<string, ReturnType<typeof goalsService.calculateGoalProgress>>;
    } = {
      style: {} as ReturnType<typeof styleAnalysisService.analyzeStyle>,
      grammar: [],
      goals: {},
    };

    const promises: Promise<void>[] = [];

    if (analyses.includes('style') || analyses.includes('readability')) {
      promises.push(
        (async () => {
          results.style = styleAnalysisService.analyzeStyle(content);
        })(),
      );
    }

    if (analyses.includes('grammar')) {
      promises.push(
        (async () => {
          const grammarResult = grammarSuggestionService.analyzeGrammar(content);
          results.grammar = grammarResult.suggestions;
        })(),
      );
    }

    if (analyses.includes('goals')) {
      promises.push(
        (async () => {
          const goalProgressMap = goalsService.calculateAllProgress(content);
          results.goals = Object.fromEntries(goalProgressMap);
        })(),
      );
    }

    await Promise.all(promises);

    return results;
  }

  private buildInlineSuggestions(
    grammarSuggestions: ReturnType<typeof grammarSuggestionService.analyzeGrammar>['suggestions'],
    styleAnalysis: ReturnType<typeof styleAnalysisService.analyzeStyle>,
    goalProgress: Record<string, ReturnType<typeof goalsService.calculateGoalProgress>>,
  ): InlineSuggestion[] {
    const suggestions: InlineSuggestion[] = [];

    // Add grammar suggestions
    for (const grammar of grammarSuggestions.slice(0, 10)) {
      suggestions.push({
        id: `inline-grammar-${grammar.id}`,
        type: 'grammar',
        severity: grammar.severity,
        displayText: grammar.originalText || grammar.message.substring(0, 30),
        icon: this.getSeverityIcon(grammar.severity),
        position: {
          start: grammar.position.start,
          end: grammar.position.end,
          line: grammar.position.line ?? 1,
          column: grammar.position.column ?? 0,
        },
        suggestion: grammar,
        preview: grammar.message,
        isExpanded: false,
        isApplying: false,
        timestamp: new Date(),
        confidence: grammar.confidence,
        source: 'grammar',
      });
    }

    // Add readability suggestions from style analysis
    if (styleAnalysis.styleRecommendations && styleAnalysis.styleRecommendations.length > 0) {
      for (const rec of styleAnalysis.styleRecommendations.slice(0, 3)) {
        suggestions.push({
          id: `inline-style-${rec.category}-${Date.now()}`,
          type: 'style',
          severity: rec.priority === 'high' ? 'warning' : 'suggestion',
          displayText: rec.title,
          icon: 'style',
          position: {
            start: 0,
            end: 100,
            line: 1,
            column: 0,
          },
          suggestion: rec as never,
          preview: rec.description,
          isExpanded: false,
          isApplying: false,
          timestamp: new Date(),
          confidence: 0.7,
          source: 'style',
        });
      }
    }

    // Add goal-related suggestions
    for (const [goalId, progress] of Object.entries(goalProgress)) {
      if (!progress.isAchieved && progress.progress >= 50) {
        suggestions.push({
          id: `inline-goal-${goalId}`,
          type: 'goal',
          severity: 'suggestion',
          displayText: progress.feedback,
          icon: 'target',
          position: {
            start: 0,
            end: 50,
            line: 1,
            column: 0,
          },
          suggestion: progress as never,
          preview: `Progress: ${progress.progress}%`,
          isExpanded: false,
          isApplying: false,
          timestamp: new Date(),
          confidence: 0.8,
          source: 'goals',
        });
      }
    }

    return suggestions.sort((a, b) => {
      const severityOrder = { error: 0, warning: 1, suggestion: 2, info: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  private getSeverityIcon(severity: InlineSuggestion['severity']): string {
    switch (severity) {
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'alert-triangle';
      case 'suggestion':
        return 'lightbulb';
      default:
        return 'info';
    }
  }

  // ============================================================================
  // Debouncing & Batching
  // ============================================================================

  private scheduleDebouncedAnalysis(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      void this.processBatches();
    }, this.config.debounceMs);
  }

  private startBatchProcessing(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    this.batchTimer = setInterval(() => {
      void this.processBatches();
    }, this.config.batchIntervalMs);
  }

  private async processBatches(): Promise<void> {
    if (this.pendingBatches.length === 0) return;
    if (this.activeAnalysisCount >= this.config.maxConcurrentAnalyses) return;

    // Get batches to process (respecting max concurrent)
    const batchesToProcess = this.pendingBatches.splice(
      0,
      Math.min(
        this.config.maxBatchSize,
        this.config.maxConcurrentAnalyses - this.activeAnalysisCount,
      ),
    );

    for (const batch of batchesToProcess) {
      this.activeAnalysisCount++;
      this.processingBatches.push(batch);

      try {
        await this.analyzeNow(batch.content, batch.analyses);
        batch.status = 'completed';
        this.state.pendingChanges = Math.max(0, this.state.pendingChanges - 1);
      } catch (error) {
        batch.status = 'failed';
        batch.error = error instanceof Error ? error.message : 'Unknown error';
      } finally {
        this.activeAnalysisCount--;
        const index = this.processingBatches.findIndex(b => b.id === batch.id);
        if (index !== -1) {
          this.processingBatches.splice(index, 1);
        }
      }
    }
  }

  /**
   * Cancel all pending analysis
   */
  public cancelPending(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.pendingBatches = [];
    this.state.pendingChanges = 0;

    logger.info('Pending analysis cancelled', {
      component: 'RealTimeAnalysisService',
    });
  }

  /**
   * Get pending changes count
   */
  public getPendingChanges(): number {
    return this.state.pendingChanges;
  }

  /**
   * Get analysis duration
   */
  public getAnalysisDuration(): number {
    return this.state.analysisDuration;
  }

  // ============================================================================
  // Event Handling
  // ============================================================================

  /**
   * Set callback for content changes
   */
  public onContentChange(callback: (content: string) => void): void {
    this.contentChangeCallback = callback;
  }

  /**
   * Notify content change
   */
  public notifyContentChange(content: string): void {
    if (this.contentChangeCallback) {
      this.contentChangeCallback(content);
    }
  }
}

export const realTimeAnalysisService = RealTimeAnalysisService.getInstance();
