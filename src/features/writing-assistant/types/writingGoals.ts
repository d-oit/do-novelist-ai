/**
 * Writing Goals Types
 * User-defined targets for writing parameters
 */

import { z } from 'zod';

// ============================================================================
// Writing Goal
// ============================================================================

export const WritingGoalSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  isTemplate: z.boolean().default(false),

  // Tone Goals
  targetTone: z
    .object({
      primary: z.string(),
      secondary: z.string().optional(),
      intensity: z.number().min(0).max(100).optional(),
    })
    .optional(),

  // Readability Goals
  targetReadability: z
    .object({
      minScore: z.number().min(0).max(100).optional(),
      maxScore: z.number().min(0).max(100).optional(),
      gradeLevel: z.string().optional(),
      gradeLevelMin: z.number().optional(),
      gradeLevelMax: z.number().optional(),
    })
    .optional(),

  // Length Goals
  targetLength: z
    .object({
      minWords: z.number().optional(),
      maxWords: z.number().optional(),
      targetWords: z.number().optional(),
    })
    .optional(),

  // Style Goals
  targetStyle: z
    .object({
      voice: z.enum(['active', 'passive', 'mixed']).optional(),
      perspective: z.enum(['first', 'second', 'third_limited', 'third_omniscient']).optional(),
      tense: z.enum(['present', 'past', 'future']).optional(),
      formality: z.enum(['casual', 'neutral', 'formal']).optional(),
    })
    .optional(),

  // Vocabulary Goals
  targetVocabulary: z
    .object({
      maxAvgWordLength: z.number().optional(),
      minVocabularyDiversity: z.number().min(0).max(1).optional(),
      avoidRepeatedWords: z.array(z.string()).optional(),
    })
    .optional(),

  // Pacing Goals
  targetPacing: z
    .object({
      minSentenceVariety: z.number().min(0).max(100).optional(),
      maxSentenceLength: z.number().optional(),
      minParagraphLength: z.number().optional(),
      maxParagraphLength: z.number().optional(),
    })
    .optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WritingGoal = z.infer<typeof WritingGoalSchema>;

// ============================================================================
// Goal Progress
// ============================================================================

export interface GoalProgress {
  goalId: string;
  goalName: string;
  isAchieved: boolean;
  progress: number; // 0-100
  metrics: GoalMetricProgress[];
  feedback: string;
}

export interface GoalMetricProgress {
  metricKey: string;
  metricLabel: string;
  currentValue: number;
  targetValue: number;
  unit?: string;
  status: 'below' | 'achieving' | 'achieved' | 'exceeded';
  trend?: 'improving' | 'stable' | 'declining';
}

// ============================================================================
// Goal Presets
// ============================================================================

export interface GoalPreset {
  id: string;
  name: string;
  description: string;
  category: 'genre' | 'audience' | 'writing_type' | 'custom';
  icon?: string;
  goals: Partial<WritingGoal>[];
}

export const GOAL_PRESETS: GoalPreset[] = [
  {
    id: 'preset-young-adult',
    name: 'Young Adult Fiction',
    description: 'Optimized for YA readers (grades 7-10)',
    category: 'genre',
    icon: 'book',
    goals: [
      {
        targetReadability: {
          minScore: 60,
          maxScore: 80,
          gradeLevel: '7-10',
        },
      },
      {
        targetStyle: {
          voice: 'active',
          perspective: 'third_limited',
        },
      },
      {
        targetLength: {
          targetWords: 2500,
        },
      },
      {
        targetTone: {
          primary: 'engaging',
          intensity: 70,
        },
      },
    ],
  },
  {
    id: 'preset-literary',
    name: 'Literary Fiction',
    description: 'Complex prose for literary readers',
    category: 'genre',
    icon: 'feather',
    goals: [
      {
        targetReadability: {
          minScore: 40,
          maxScore: 70,
        },
      },
      {
        targetTone: {
          primary: 'literary',
          intensity: 70,
        },
      },
      {
        targetStyle: {
          formality: 'formal',
        },
      },
      {
        targetVocabulary: {
          minVocabularyDiversity: 0.7,
        },
      },
    ],
  },
  {
    id: 'preset-children',
    name: "Children's Book",
    description: 'Simple language for young readers',
    category: 'audience',
    icon: 'star',
    goals: [
      {
        targetReadability: {
          minScore: 80,
          gradeLevel: '1-5',
        },
      },
      {
        targetStyle: {
          voice: 'active',
          perspective: 'third_limited',
        },
      },
      {
        targetLength: {
          maxWords: 1000,
        },
      },
      {
        targetVocabulary: {
          maxAvgWordLength: 5,
        },
      },
    ],
  },
  {
    id: 'preset-thriller',
    name: 'Thriller / Suspense',
    description: 'Fast-paced, tension-filled writing',
    category: 'genre',
    icon: 'zap',
    goals: [
      {
        targetTone: {
          primary: 'tense',
          intensity: 85,
        },
      },
      {
        targetStyle: {
          voice: 'active',
        },
      },
      {
        targetPacing: {
          maxSentenceLength: 20,
          minSentenceVariety: 60,
        },
      },
      {
        targetLength: {
          targetWords: 3500,
        },
      },
    ],
  },
  {
    id: 'preset-romance',
    name: 'Romance',
    description: 'Emotionally resonant, character-driven',
    category: 'genre',
    icon: 'heart',
    goals: [
      {
        targetTone: {
          primary: 'romantic',
          intensity: 75,
        },
      },
      {
        targetTone: {
          primary: 'emotional',
          intensity: 70,
        },
      },
      {
        targetStyle: {
          formality: 'neutral',
        },
      },
      {
        targetReadability: {
          minScore: 55,
          maxScore: 75,
        },
      },
    ],
  },
  {
    id: 'preset-academic',
    name: 'Academic Writing',
    description: 'Formal, evidence-based writing',
    category: 'writing_type',
    icon: 'graduation-cap',
    goals: [
      {
        targetStyle: {
          formality: 'formal',
          voice: 'active',
        },
      },
      {
        targetReadability: {
          gradeLevelMin: 12,
          gradeLevelMax: 16,
        },
      },
      {
        targetVocabulary: {
          minVocabularyDiversity: 0.8,
        },
      },
      {
        targetPacing: {
          minSentenceVariety: 50,
        },
      },
    ],
  },
];

// ============================================================================
// Goal Configuration
// ============================================================================

export const WritingGoalsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  showProgressInEditor: z.boolean().default(true),
  showNotifications: z.boolean().default(true),
  notifyOnGoalAchieved: z.boolean().default(true),
  notifyOnGoalMissed: z.boolean().default(false),
  autoAnalyze: z.boolean().default(true),
  analysisDelay: z.number().min(500).max(5000).default(1500),
});

export type WritingGoalsConfig = z.infer<typeof WritingGoalsConfigSchema>;

export const DEFAULT_WRITING_GOALS_CONFIG: WritingGoalsConfig = {
  enabled: true,
  showProgressInEditor: true,
  showNotifications: true,
  notifyOnGoalAchieved: true,
  notifyOnGoalMissed: false,
  autoAnalyze: true,
  analysisDelay: 1500,
};

// ============================================================================
// Goal Achievement Status
// ============================================================================

export type GoalAchievementStatus =
  | 'not_started'
  | 'in_progress'
  | 'achieved'
  | 'exceeded'
  | 'missed'
  | 'abandoned';

export interface GoalWithStatus {
  goal: WritingGoal;
  status: GoalAchievementStatus;
  progress: number;
  lastAnalyzed?: Date;
  nextMilestone?: string;
}

// ============================================================================
// Goal Templates
// ============================================================================

export const GOAL_TEMPLATES: Partial<WritingGoal>[] = [
  {
    targetReadability: {
      minScore: 60,
      maxScore: 80,
    },
  },
  {
    targetTone: {
      primary: 'engaging',
      intensity: 70,
    },
  },
  {
    targetStyle: {
      voice: 'active',
    },
  },
  {
    targetLength: {
      targetWords: 2500,
    },
  },
  {
    targetVocabulary: {
      minVocabularyDiversity: 0.6,
    },
  },
];

// ============================================================================
// Type Guards
// ============================================================================

export function isWritingGoal(value: unknown): value is WritingGoal {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'isActive' in value
  );
}

export function isGoalPreset(value: unknown): value is GoalPreset {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'goals' in value
  );
}

export function isGoalProgress(value: unknown): value is GoalProgress {
  return (
    typeof value === 'object' &&
    value !== null &&
    'goalId' in value &&
    'isAchieved' in value &&
    'progress' in value
  );
}
