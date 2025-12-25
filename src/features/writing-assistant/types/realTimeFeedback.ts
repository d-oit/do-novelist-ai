/**
 * Real-Time Feedback Types
 * Inline suggestions and live analysis state
 */

import { z } from 'zod';

import type { GrammarSuggestion } from './grammarSuggestions';
import type { StyleAnalysisResult } from './styleAnalysis';
import type { GoalProgress } from './writingGoals';

import type { WritingSuggestion } from './index';

// ============================================================================
// Inline Suggestion
// ============================================================================

export interface InlineSuggestion {
  id: string;
  type: 'grammar' | 'style' | 'clarity' | 'goal';
  severity: 'error' | 'warning' | 'suggestion' | 'info';

  // Display
  displayText: string;
  icon?: string;

  // Location
  position: {
    start: number;
    end: number;
    line: number;
    column: number;
  };

  // Content
  suggestion: GrammarSuggestion | WritingSuggestion;
  preview?: string;

  // State
  isExpanded: boolean;
  isApplying: boolean;

  // Metadata
  timestamp: Date;
  confidence: number;
  source: 'grammar' | 'style' | 'goals' | 'readability';
}

// ============================================================================
// Real-Time Analysis State
// ============================================================================

export const RealTimeAnalysisStateSchema = z.object({
  isActive: z.boolean().default(false),
  isAnalyzing: z.boolean().default(false),
  lastAnalyzedContent: z.string().optional(),
  lastAnalysisTime: z.date().optional(),

  // Current analysis results
  currentStyleAnalysis: z.custom<StyleAnalysisResult>().optional(),
  currentGrammarSuggestions: z.array(z.custom<GrammarSuggestion>()).default([]),
  currentInlineSuggestions: z.array(z.custom<InlineSuggestion>()).default([]),

  // Goal progress
  goalProgress: z.record(z.string(), z.custom<GoalProgress>()).default({}),

  // Error state
  error: z.string().optional(),

  // Performance
  analysisDuration: z.number().default(0),
  pendingChanges: z.number().default(0),
});

export type RealTimeAnalysisState = z.infer<typeof RealTimeAnalysisStateSchema>;

// ============================================================================
// Editor State
// ============================================================================

export interface ContentEditorState {
  content: string;
  selection?: {
    start: number;
    end: number;
  };
  cursorPosition: number;
  currentLine: number;
  currentParagraph: number;
}

// ============================================================================
// Suggestion Action
// ============================================================================

export interface SuggestionAction {
  type: 'accept' | 'dismiss' | 'modify' | 'ignore' | 'show_more';
  suggestionId: string;
  timestamp: Date;
  modifiedText?: string;
  reason?: string;
}

// ============================================================================
// Analysis Batch
// ============================================================================

export interface AnalysisBatch {
  id: string;
  content: string;
  timestamp: Date;
  requestedBy: 'user' | 'auto' | 'system';
  priority: 'low' | 'normal' | 'high';
  analyses: AnalysisType[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: {
    style?: StyleAnalysisResult;
    grammar?: GrammarSuggestion[];
    goals?: GoalProgress[];
  };
  error?: string;
}

export type AnalysisType = 'style' | 'grammar' | 'goals' | 'readability' | 'all';

// ============================================================================
// Real-Time Configuration
// ============================================================================

export const RealTimeConfigSchema = z.object({
  enabled: z.boolean().default(true),
  debounceMs: z.number().min(100).max(3000).default(500),
  batchIntervalMs: z.number().min(50).max(1000).default(200),
  maxBatchSize: z.number().min(1).max(20).default(5),
  maxConcurrentAnalyses: z.number().min(1).max(5).default(2),
  showInlineSuggestions: z.boolean().default(true),
  highlightDuration: z.number().min(500).max(10000).default(3000),
  autoApplySafe: z.boolean().default(false),
});

export type RealTimeConfig = z.infer<typeof RealTimeConfigSchema>;

export const DEFAULT_REAL_TIME_CONFIG: RealTimeConfig = {
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
// Suggestion Highlight
// ============================================================================

export interface SuggestionHighlight {
  id: string;
  suggestionId: string;
  type: InlineSuggestion['type'];
  severity: InlineSuggestion['severity'];
  startOffset: number;
  endOffset: number;
  line: number;
  column: number;
  text: string;
  className: string;
}

// ============================================================================
// Feedback Panel State
// ============================================================================

export interface FeedbackPanelState {
  isOpen: boolean;
  activeTab: 'suggestions' | 'style' | 'goals';
  expandedSuggestion?: string;
  filterBy: InlineSuggestion['type'] | 'all';
  sortBy: 'severity' | 'position' | 'confidence';
  showDismissed: boolean;
}

// ============================================================================
// Analysis Metrics
// ============================================================================

export interface AnalysisMetrics {
  totalAnalyses: number;
  successfulAnalyses: number;
  failedAnalyses: number;
  averageDuration: number;
  lastAnalysisDuration: number;
  suggestionsGenerated: number;
  suggestionsAccepted: number;
  suggestionsDismissed: number;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isInlineSuggestion(value: unknown): value is InlineSuggestion {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'type' in value &&
    'severity' in value &&
    'position' in value
  );
}

export function isRealTimeAnalysisState(value: unknown): value is RealTimeAnalysisState {
  return (
    typeof value === 'object' && value !== null && 'isActive' in value && 'isAnalyzing' in value
  );
}

export function isAnalysisBatch(value: unknown): value is AnalysisBatch {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'content' in value &&
    'status' in value
  );
}

// ============================================================================
// Event Types
// ============================================================================

export type RealTimeEventType =
  | 'analysis_start'
  | 'analysis_complete'
  | 'analysis_error'
  | 'suggestion_added'
  | 'suggestion_removed'
  | 'suggestion_accepted'
  | 'suggestion_dismissed'
  | 'goal_progress'
  | 'goal_achieved'
  | 'config_changed';

export interface RealTimeEvent {
  type: RealTimeEventType;
  timestamp: Date;
  data: Record<string, unknown>;
}
