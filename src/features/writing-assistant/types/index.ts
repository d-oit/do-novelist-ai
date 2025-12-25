/**
 * AI Writing Assistant Types
 * Intelligent content analysis and writing suggestions
 */

import { z } from 'zod';

// ============================================================================
// Core Analysis Types
// ============================================================================

export interface WritingSuggestion {
  id: string;
  type: 'style' | 'tone' | 'pacing' | 'grammar' | 'structure' | 'character' | 'plot';
  severity: 'info' | 'suggestion' | 'warning' | 'error';
  message: string;
  originalText: string;
  suggestedText?: string;
  position: {
    start: number;
    end: number;
    line?: number;
    column?: number;
  };
  confidence: number; // 0-1
  reasoning: string;
  category: WritingSuggestionCategory;
}

export type WritingSuggestionCategory =
  | 'readability'
  | 'engagement'
  | 'consistency'
  | 'flow'
  | 'dialogue'
  | 'description'
  | 'character_voice'
  | 'plot_structure'
  | 'show_vs_tell';

// ============================================================================
// Content Analysis Results
// ============================================================================

export interface ContentAnalysis {
  chapterId: string;
  content: string;
  timestamp: Date;

  // Core Metrics
  readabilityScore: number; // 0-100 (Flesch Reading Ease)
  sentimentScore: number; // -1 to 1
  paceScore: number; // 0-100 (slow to fast)
  engagementScore: number; // 0-100

  // Detailed Analysis
  suggestions: WritingSuggestion[];
  plotHoles: PlotHoleDetection[];
  characterIssues: CharacterConsistencyIssue[];
  dialogueAnalysis: DialogueAnalysis;

  // Style Analysis
  styleProfile: StyleProfile;
  toneAnalysis: ToneAnalysis;
  wordUsage: WordUsageAnalysis;

  // Structure Analysis
  paragraphAnalysis: ParagraphAnalysis;
  sentenceVariety: SentenceVarietyAnalysis;
  transitionQuality: TransitionAnalysis;
}

// ============================================================================
// Plot Hole Detection
// ============================================================================

export interface PlotHoleDetection {
  id: string;
  type: 'continuity' | 'logic' | 'character_motivation' | 'timeline' | 'world_building';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  evidence: string[];
  suggestedFix: string;
  affectedChapters: string[];
  confidence: number;
}

// ============================================================================
// Character Consistency
// ============================================================================

export interface CharacterConsistencyIssue {
  id: string;
  characterId: string;
  characterName: string;
  issueType:
    | 'personality'
    | 'speech_pattern'
    | 'knowledge'
    | 'ability'
    | 'appearance'
    | 'motivation';
  description: string;
  currentInstance: string;
  conflictingInstances: {
    text: string;
    chapterId: string;
    context: string;
  }[];
  severity: 'minor' | 'moderate' | 'major';
  suggestedResolution: string;
}

// ============================================================================
// Dialogue Analysis
// ============================================================================

export interface DialogueAnalysis {
  totalDialogue: number;
  dialoguePercentage: number; // % of chapter that's dialogue
  speakerVariety: number; // how many different speakers
  averageDialogueLength: number;

  issues: DialogueIssue[];
  voiceConsistency: VoiceConsistencyAnalysis[];
  tagAnalysis: DialogueTagAnalysis;
}

export interface DialogueIssue {
  type:
    | 'excessive_tags'
    | 'unclear_speaker'
    | 'unnatural_speech'
    | 'repetitive_tags'
    | 'missing_action';
  description: string;
  examples: string[];
  suggestions: string[];
}

export interface VoiceConsistencyAnalysis {
  characterName: string;
  consistency: number; // 0-100
  patterns: string[];
  deviations: {
    text: string;
    reason: string;
  }[];
}

export interface DialogueTagAnalysis {
  totalTags: number;
  varietyScore: number;
  overusedTags: {
    tag: string;
    count: number;
  }[];
  suggestions: string[];
}

// ============================================================================
// Style & Tone Analysis
// ============================================================================

export interface StyleProfile {
  complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  formality: 'casual' | 'neutral' | 'formal' | 'academic';
  voice: 'active' | 'passive' | 'mixed';
  perspective: 'first_person' | 'second_person' | 'third_limited' | 'third_omniscient' | 'mixed';
  tense: 'present' | 'past' | 'future' | 'mixed';

  strengths: string[];
  improvements: string[];
  consistency: number; // 0-100
}

export interface ToneAnalysis {
  primary: string; // e.g., 'mysterious', 'lighthearted', 'dramatic'
  secondary?: string;
  intensity: number; // 0-100
  consistency: number; // 0-100
  emotionalRange: EmotionalRange;
  moodProgression: MoodPoint[];
}

export interface EmotionalRange {
  dominant: string[];
  absent: string[];
  variety: number; // 0-100
}

export interface MoodPoint {
  position: number; // 0-1 (position in chapter)
  mood: string;
  intensity: number; // 0-100
}

// ============================================================================
// Word Usage Analysis
// ============================================================================

export interface WordUsageAnalysis {
  vocabularyLevel: 'elementary' | 'middle_school' | 'high_school' | 'college' | 'graduate';
  averageWordLength: number;
  averageSentenceLength: number;

  overusedWords: {
    word: string;
    count: number;
    suggestions: string[];
  }[];

  weakWords: {
    word: string;
    context: string;
    suggestion: string;
  }[];

  cliches: {
    phrase: string;
    alternatives: string[];
  }[];

  redundancies: {
    phrase: string;
    simplified: string;
  }[];
}

// ============================================================================
// Structure Analysis
// ============================================================================

export interface ParagraphAnalysis {
  averageLength: number;
  varietyScore: number; // 0-100
  lengthDistribution: {
    short: number; // 1-2 sentences
    medium: number; // 3-5 sentences
    long: number; // 6+ sentences
  };
  recommendations: string[];
}

export interface SentenceVarietyAnalysis {
  averageLength: number;
  varietyScore: number; // 0-100
  typeDistribution: {
    simple: number;
    compound: number;
    complex: number;
    compound_complex: number;
  };
  recommendations: string[];
}

export interface TransitionAnalysis {
  quality: number; // 0-100
  missingTransitions: {
    position: number;
    suggestion: string;
  }[];
  weakTransitions: {
    text: string;
    improvement: string;
  }[];
}

// ============================================================================
// Assistant Configuration
// ============================================================================

export const WritingAssistantConfigSchema = z.object({
  // Analysis Settings
  enableRealTimeAnalysis: z.boolean().default(true),
  analysisDelay: z.number().min(500).max(5000).default(1500), // ms

  // Suggestion Filters
  enabledCategories: z
    .array(z.string())
    .default(['readability', 'engagement', 'consistency', 'flow', 'dialogue', 'character_voice']),

  minimumConfidence: z.number().min(0).max(1).default(0.6),
  maxSuggestionsPerType: z.number().min(1).max(20).default(5),

  // Content Analysis
  enablePlotHoleDetection: z.boolean().default(true),
  enableCharacterTracking: z.boolean().default(true),
  enableDialogueAnalysis: z.boolean().default(true),
  enableStyleAnalysis: z.boolean().default(true),

  // AI Settings
  aiModel: z.enum(['gemini-pro', 'gemini-flash']).default('gemini-pro'),
  analysisDepth: z.enum(['basic', 'standard', 'comprehensive']).default('standard'),

  // User Preferences
  preferredStyle: z.enum(['concise', 'descriptive', 'balanced']).default('balanced'),
  targetAudience: z.enum(['children', 'young_adult', 'adult', 'literary']).default('adult'),
  genre: z.string().optional(),
});

export type WritingAssistantConfig = z.infer<typeof WritingAssistantConfigSchema>;

// ============================================================================
// Assistant State & Actions
// ============================================================================

export interface WritingAssistantState {
  isActive: boolean;
  isAnalyzing: boolean;
  currentAnalysis?: ContentAnalysis;
  suggestions: WritingSuggestion[];
  config: WritingAssistantConfig;

  // UI State
  selectedSuggestion?: string;
  showSuggestions: boolean;
  filterBy: WritingSuggestionCategory | 'all';
  sortBy: 'severity' | 'type' | 'position' | 'confidence';
}

export interface WritingAssistantActions {
  toggleAssistant: () => void;
  analyzeContent: (content: string, chapterId: string) => Promise<void>;
  applySuggestion: (suggestionId: string) => void;
  dismissSuggestion: (suggestionId: string) => void;
  updateConfig: (config: Partial<WritingAssistantConfig>) => void;

  // UI Actions
  selectSuggestion: (suggestionId: string) => void;
  toggleSuggestions: () => void;
  filterSuggestions: (category: WritingSuggestionCategory | 'all') => void;
  sortSuggestions: (sortBy: WritingAssistantState['sortBy']) => void;
}

// ============================================================================
// Progress Tracking Types
// ============================================================================

export interface WritingProgressMetrics {
  id: string;
  userId: string;
  projectId: string;
  date: string; // YYYY-MM-DD
  wordsWritten: number;
  timeSpent: number; // minutes
  suggestionsReceived: number;
  suggestionsAccepted: number;
  averageReadability: number;
  averageEngagement: number;
  chaptersWorkedOn: number;
  createdAt: Date;
}

// ============================================================================
// Type Guards & Validators
// ============================================================================

export function isWritingSuggestion(value: unknown): value is WritingSuggestion {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'type' in value &&
    'message' in value
  );
}

export function isContentAnalysis(value: unknown): value is ContentAnalysis {
  return (
    typeof value === 'object' &&
    value !== null &&
    'chapterId' in value &&
    'suggestions' in value &&
    'readabilityScore' in value
  );
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_WRITING_ASSISTANT_CONFIG: WritingAssistantConfig = {
  enableRealTimeAnalysis: true,
  analysisDelay: 1500,
  enabledCategories: [
    'readability',
    'engagement',
    'consistency',
    'flow',
    'dialogue',
    'character_voice',
  ],
  minimumConfidence: 0.6,
  maxSuggestionsPerType: 5,
  enablePlotHoleDetection: true,
  enableCharacterTracking: true,
  enableDialogueAnalysis: true,
  enableStyleAnalysis: true,
  aiModel: 'gemini-pro',
  analysisDepth: 'standard',
  preferredStyle: 'balanced',
  targetAudience: 'adult',
};

// ============================================================================
// Style Analysis Types
// ============================================================================

export type {
  StyleAnalysisResult,
  ConsistencyIssue,
  StyleRecommendation,
  StyleAnalysisConfig,
  ReadabilityMetrics,
  ToneAnalysisDetail,
  VoiceAnalysisDetail,
} from './styleAnalysis';

export { DEFAULT_STYLE_ANALYSIS_CONFIG, StyleAnalysisConfigSchema } from './styleAnalysis';

// ============================================================================
// Grammar Suggestion Types
// ============================================================================

export type {
  GrammarSuggestion,
  GrammarSuggestionType,
  GrammarCategory,
  GrammarAnalysisResult,
  GrammarConfig,
  GrammarRuleReference,
  ClarityMetrics,
  ClaritySuggestion,
} from './grammarSuggestions';

export { DEFAULT_GRAMMAR_CONFIG, GrammarConfigSchema } from './grammarSuggestions';

// ============================================================================
// Writing Goals Types
// ============================================================================

export type {
  WritingGoal,
  GoalProgress,
  GoalMetricProgress,
  GoalPreset,
  WritingGoalsConfig,
  GoalAchievementStatus,
  GoalWithStatus,
} from './writingGoals';

export {
  DEFAULT_WRITING_GOALS_CONFIG,
  WritingGoalsConfigSchema,
  GOAL_PRESETS,
  GOAL_TEMPLATES,
} from './writingGoals';

// ============================================================================
// Real-Time Feedback Types
// ============================================================================

export type {
  InlineSuggestion,
  RealTimeAnalysisState,
  ContentEditorState,
  SuggestionAction,
  AnalysisBatch,
  AnalysisType,
  RealTimeConfig,
  SuggestionHighlight,
  FeedbackPanelState,
  AnalysisMetrics,
  RealTimeEvent,
  RealTimeEventType,
} from './realTimeFeedback';

export { DEFAULT_REAL_TIME_CONFIG, RealTimeConfigSchema } from './realTimeFeedback';
