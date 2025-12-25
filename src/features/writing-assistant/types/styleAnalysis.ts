/**
 * Style Analysis Types
 * Deep analysis of prose style, tone, and complexity
 */

import { z } from 'zod';

// ============================================================================
// Style Analysis Result
// ============================================================================

export interface StyleAnalysisResult {
  id: string;
  timestamp: Date;
  content: string;

  // Readability Metrics
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  gunningFogIndex: number;
  smogIndex: number;
  automatedReadabilityIndex: number;

  // Complexity Metrics
  averageSentenceLength: number;
  averageWordLength: number;
  vocabularyComplexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  syntacticComplexity: number;

  // Tone Analysis
  primaryTone: string;
  secondaryTone?: string;
  toneIntensity: number; // 0-100
  emotionalRange: {
    dominant: string[];
    absent: string[];
  };

  // Voice Analysis
  voiceType: 'active' | 'passive' | 'mixed';
  perspective: 'first' | 'second' | 'third_limited' | 'third_omniscient' | 'mixed';
  tense: 'present' | 'past' | 'future' | 'mixed';

  // Style Consistency
  consistencyScore: number; // 0-100
  consistencyIssues: ConsistencyIssue[];

  // Recommendations
  styleRecommendations: StyleRecommendation[];
}

// ============================================================================
// Consistency Issues
// ============================================================================

export interface ConsistencyIssue {
  type: 'vocabulary' | 'tone' | 'pacing' | 'voice' | 'perspective';
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  position: {
    start: number;
    end: number;
  };
  suggestion: string;
}

// ============================================================================
// Style Recommendations
// ============================================================================

export interface StyleRecommendation {
  category: 'readability' | 'engagement' | 'consistency' | 'voice' | 'tone';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  examples?: string[];
}

// ============================================================================
// Style Analysis Configuration
// ============================================================================

export const StyleAnalysisConfigSchema = z.object({
  enableReadabilityMetrics: z.boolean().default(true),
  enableToneAnalysis: z.boolean().default(true),
  enableVoiceAnalysis: z.boolean().default(true),
  enableConsistencyCheck: z.boolean().default(true),
  enableRecommendations: z.boolean().default(true),
  targetReadabilityScore: z.number().min(0).max(100).optional(),
  targetTone: z.string().optional(),
  focusAreas: z.array(z.enum(['readability', 'tone', 'voice', 'consistency'])).default([]),
});

export type StyleAnalysisConfig = z.infer<typeof StyleAnalysisConfigSchema>;

export const DEFAULT_STYLE_ANALYSIS_CONFIG: StyleAnalysisConfig = {
  enableReadabilityMetrics: true,
  enableToneAnalysis: true,
  enableVoiceAnalysis: true,
  enableConsistencyCheck: true,
  enableRecommendations: true,
  focusAreas: [],
};

// ============================================================================
// Readability Metrics
// ============================================================================

export interface ReadabilityMetrics {
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  gunningFogIndex: number;
  smogIndex: number;
  automatedReadabilityIndex: number;
  colemanLiauIndex: number;
  readingTime: number; // minutes
  gradeLevel: string;
}

// ============================================================================
// Tone Analysis Detail
// ============================================================================

export interface ToneAnalysisDetail {
  primary: string;
  secondary?: string;
  intensity: number;
  consistency: number;
  emotionalRange: {
    dominant: string[];
    absent: string[];
    variety: number;
  };
  moodProgression: MoodPoint[];
}

export interface MoodPoint {
  position: number; // 0-1 (position in chapter)
  mood: string;
  intensity: number; // 0-100
}

// ============================================================================
// Voice Analysis Detail
// ============================================================================

export interface VoiceAnalysisDetail {
  voiceType: 'active' | 'passive' | 'mixed';
  passiveRatio: number;
  perspective: 'first' | 'second' | 'third_limited' | 'third_omniscient' | 'mixed';
  perspectiveConsistency: number;
  tense: 'present' | 'past' | 'future' | 'mixed';
  tenseConsistency: number;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isStyleAnalysisResult(value: unknown): value is StyleAnalysisResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'fleschReadingEase' in value &&
    'primaryTone' in value
  );
}

export function isConsistencyIssue(value: unknown): value is ConsistencyIssue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'severity' in value &&
    'description' in value
  );
}
