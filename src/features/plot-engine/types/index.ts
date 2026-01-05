/**
 * Plot Engine Types
 *
 * Type definitions for AI-powered plot generation and analysis
 */

// ============================================================================
// Plot Structure
// ============================================================================

export interface PlotStructure {
  id: string;
  projectId: string;
  acts: PlotAct[];
  climax?: PlotPoint;
  resolution?: PlotPoint;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlotAct {
  id: string;
  actNumber: 1 | 2 | 3 | 4 | 5;
  name: string;
  description?: string;
  plotPoints: PlotPoint[];
  chapters: string[]; // chapter IDs
  duration?: number; // expected chapters
}

export type PlotPointType =
  | 'inciting_incident'
  | 'rising_action'
  | 'climax'
  | 'falling_action'
  | 'resolution'
  | 'plot_twist'
  | 'midpoint'
  | 'turning_point'
  | 'dark_night';

export interface PlotPoint {
  id: string;
  type: PlotPointType;
  title: string;
  description: string;
  chapterId?: string;
  characterIds: string[];
  importance: 'major' | 'minor';
  position?: number; // 0-100 percentage through story
  timestamp?: Date;
}

// ============================================================================
// Story Arc Analysis
// ============================================================================

export type StoryStructure = '3-act' | '5-act' | 'hero-journey' | 'kishotenketsu' | 'custom';

export interface StoryArc {
  structure: StoryStructure;
  pacing: PacingAnalysis;
  tension: TensionCurve[];
  coherence: number; // 0-1 score
  recommendations: string[];
}

export interface PacingAnalysis {
  overall: 'slow' | 'moderate' | 'fast';
  score: number; // 0-100
  byChapter: ChapterPacing[];
  recommendations: string[];
}

export interface ChapterPacing {
  chapterId: string;
  chapterNumber: number;
  pace: number; // 0-100
  wordCount: number;
  tensionLevel: number;
  issues?: string[];
}

export interface TensionCurve {
  chapterId: string;
  chapterNumber: number;
  tensionLevel: number; // 0-100
  emotional: 'calm' | 'tense' | 'climactic' | 'resolution';
  events: string[];
}

// ============================================================================
// Plot Hole Detection
// ============================================================================

export type PlotHoleType =
  | 'continuity'
  | 'logic'
  | 'character_inconsistency'
  | 'timeline'
  | 'unresolved_thread'
  | 'contradictory_facts'
  | 'missing_motivation';

export type PlotHoleSeverity = 'minor' | 'moderate' | 'major' | 'critical';

export interface PlotHole {
  id: string;
  type: PlotHoleType;
  severity: PlotHoleSeverity;
  title: string;
  description: string;
  affectedChapters: string[];
  affectedCharacters: string[];
  suggestedFix?: string;
  confidence: number; // 0-1
  detected: Date;
}

export interface PlotHoleAnalysis {
  projectId: string;
  analyzedAt: Date;
  plotHoles: PlotHole[];
  overallScore: number; // 0-100, higher is better
  summary: string;
}

// ============================================================================
// Character Relationships
// ============================================================================

export type RelationshipType =
  | 'ally'
  | 'enemy'
  | 'romantic'
  | 'family'
  | 'mentor'
  | 'mentee'
  | 'rival'
  | 'neutral'
  | 'antagonist'
  | 'friend';

export interface CharacterRelationship {
  id: string;
  projectId: string;
  character1Id: string;
  character2Id: string;
  type: RelationshipType;
  strength: number; // 0-10
  evolution: RelationshipEvolution[];
  description?: string;
  isReciprocal: boolean;
}

export interface RelationshipEvolution {
  chapterId: string;
  chapterNumber: number;
  type: RelationshipType;
  strength: number;
  notes?: string;
  event?: string;
}

export interface CharacterGraph {
  projectId: string;
  relationships: CharacterRelationship[];
  nodes: CharacterNode[];
  analyzedAt: Date;
}

export interface CharacterNode {
  id: string;
  name: string;
  role: string;
  importance: number; // 0-10
  connectionCount: number;
}

// ============================================================================
// Plot Generation
// ============================================================================

export interface PlotGenerationRequest {
  projectId: string;
  premise: string;
  genre: string;
  targetLength?: number; // number of chapters
  plotPoints?: string[]; // existing plot points to incorporate
  characters?: string[]; // character IDs to include
  structure?: StoryStructure;
  themes?: string[];
  tone?: 'light' | 'dark' | 'balanced';
}

export interface PlotGenerationResult {
  plotStructure: PlotStructure;
  suggestions: PlotSuggestion[];
  alternatives: PlotStructure[];
  confidence: number; // 0-1
  generatedAt: Date;
}

export type PlotSuggestionType =
  | 'plot_twist'
  | 'character_arc'
  | 'subplot'
  | 'conflict_escalation'
  | 'resolution_path'
  | 'theme_development';

export interface PlotSuggestion {
  id: string;
  type: PlotSuggestionType;
  title: string;
  description: string;
  placement: 'early' | 'middle' | 'late' | 'anywhere';
  impact: 'low' | 'medium' | 'high';
  relatedCharacters?: string[];
  prerequisites?: string[];
}

// ============================================================================
// Analysis Requests
// ============================================================================

export interface AnalysisRequest {
  projectId: string;
  includeStoryArc?: boolean;
  includePlotHoles?: boolean;
  includeCharacterGraph?: boolean;
  includePacing?: boolean;
}

export interface AnalysisResult {
  projectId: string;
  storyArc?: StoryArc;
  plotHoleAnalysis?: PlotHoleAnalysis;
  characterGraph?: CharacterGraph;
  analyzedAt: Date;
}

// ============================================================================
// Service Configuration
// ============================================================================

export interface PlotEngineConfig {
  enableAIGeneration: boolean;
  enablePlotHoleDetection: boolean;
  plotHoleSensitivity: 'low' | 'medium' | 'high';
  analysisModel: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-sonnet';
  cacheDuration: number; // milliseconds
}
