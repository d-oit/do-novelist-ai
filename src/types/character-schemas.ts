/**
 * Character Management System Schemas
 * Comprehensive type definitions and validation for character entities
 */

import { z } from 'zod';
import { ProjectIdSchema, Base64ImageSchema } from './schemas';

// =============================================================================
// CHARACTER ENUMS & CONSTANTS
// =============================================================================

export const CharacterRoleSchema = z.enum([
  'protagonist',
  'antagonist', 
  'deuteragonist',
  'tritagonist',
  'love_interest',
  'mentor',
  'sidekick',
  'foil',
  'supporting',
  'minor',
  'background'
]);

export const CharacterArcTypeSchema = z.enum([
  'positive_change',
  'negative_change',
  'flat',
  'corruption',
  'redemption',
  'growth',
  'fall',
  'disillusion',
  'testing'
]);

export const PersonalityTraitSchema = z.enum([
  'brave', 'cowardly', 'intelligent', 'foolish', 'kind', 'cruel',
  'honest', 'deceptive', 'loyal', 'treacherous', 'optimistic', 'pessimistic',
  'confident', 'insecure', 'patient', 'impatient', 'humble', 'arrogant',
  'generous', 'selfish', 'creative', 'conventional', 'ambitious', 'content',
  'curious', 'indifferent', 'disciplined', 'impulsive', 'empathetic', 'callous'
]);

export const RelationshipTypeSchema = z.enum([
  'family', 'romantic', 'friendship', 'mentor_student', 'rivalry',
  'enemy', 'ally', 'professional', 'acquaintance', 'stranger'
]);

export const EmotionalStateSchema = z.enum([
  'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised',
  'contempt', 'pride', 'shame', 'guilt', 'envy', 'gratitude',
  'hope', 'despair', 'love', 'hate', 'confusion', 'clarity',
  'anxiety', 'calm', 'excitement', 'boredom'
]);

// =============================================================================
// CORE CHARACTER SCHEMAS
// =============================================================================

export const CharacterIdSchema = z.string().regex(
  /^char_\w+_\d+$/,
  'Invalid character ID format'
);

export const CharacterPhysicalTraitsSchema = z.object({
  age: z.number().int().min(0).max(200).optional(),
  height: z.string().max(50).optional(), // e.g., "5'8\"", "172cm"
  weight: z.string().max(50).optional(),
  build: z.enum(['slim', 'average', 'athletic', 'stocky', 'heavy']).optional(),
  hairColor: z.string().max(50).optional(),
  eyeColor: z.string().max(50).optional(),
  skinTone: z.string().max(50).optional(),
  distinctiveFeatures: z.array(z.string().max(100)).default([]),
  disabilities: z.array(z.string().max(100)).default([])
});

export const CharacterBackgroundSchema = z.object({
  birthplace: z.string().max(100).optional(),
  education: z.string().max(200).optional(),
  occupation: z.string().max(100).optional(),
  socialClass: z.enum(['lower', 'working', 'middle', 'upper_middle', 'upper']).optional(),
  family: z.string().max(500).optional(),
  significantEvents: z.array(z.object({
    event: z.string().max(200),
    age: z.number().int().min(0).max(200).optional(),
    impact: z.enum(['minor', 'moderate', 'major', 'life_changing'])
  })).default([]),
  secrets: z.array(z.string().max(200)).default([])
});

export const CharacterPsychologySchema = z.object({
  coreBeliefs: z.array(z.string().max(200)).default([]),
  values: z.array(z.string().max(100)).default([]),
  fears: z.array(z.string().max(100)).default([]),
  desires: z.array(z.string().max(100)).default([]),
  flaws: z.array(z.string().max(100)).default([]),
  strengths: z.array(z.string().max(100)).default([]),
  personalityTraits: z.array(PersonalityTraitSchema).default([]),
  mentalHealth: z.string().max(500).optional(),
  cognitiveStyle: z.enum(['analytical', 'intuitive', 'practical', 'creative']).optional(),
  communicationStyle: z.enum(['direct', 'diplomatic', 'passive', 'aggressive']).optional()
});

export const CharacterArcSchema = z.object({
  type: CharacterArcTypeSchema,
  description: z.string().max(1000),
  startingState: z.string().max(500),
  endingState: z.string().max(500),
  catalystEvent: z.string().max(500).optional(),
  obstacles: z.array(z.string().max(200)).default([]),
  milestones: z.array(z.object({
    chapter: z.string().max(100),
    description: z.string().max(300),
    emotionalState: EmotionalStateSchema.optional()
  })).default([]),
  lessonLearned: z.string().max(300).optional()
});

export const CharacterVoiceSchema = z.object({
  vocabulary: z.enum(['simple', 'average', 'sophisticated', 'technical', 'archaic']).default('average'),
  tone: z.enum(['formal', 'casual', 'humorous', 'serious', 'sarcastic', 'warm', 'cold']).default('casual'),
  speechPatterns: z.array(z.string().max(100)).default([]),
  catchphrases: z.array(z.string().max(100)).default([]),
  accentDialect: z.string().max(100).optional(),
  languageProficiency: z.record(z.enum(['native', 'fluent', 'conversational', 'basic']), z.string()).optional().default({})
});

export const CharacterRelationshipSchema = z.object({
  id: z.string(),
  characterAId: CharacterIdSchema,
  characterBId: CharacterIdSchema,
  type: RelationshipTypeSchema,
  description: z.string().max(500),
  intensity: z.number().min(0).max(10).default(5), // 0 = barely know each other, 10 = most important person
  status: z.enum(['developing', 'stable', 'deteriorating', 'ended']).default('stable'),
  history: z.string().max(1000).optional(),
  conflicts: z.array(z.string().max(200)).default([]),
  sharedExperiences: z.array(z.string().max(200)).default([]),
  dynamicNotes: z.string().max(500).optional()
});

export const CharacterAppearanceEventSchema = z.object({
  chapterId: z.string(),
  chapterTitle: z.string(),
  role: z.enum(['main', 'supporting', 'mention', 'flashback']),
  description: z.string().max(500).optional(),
  emotionalState: EmotionalStateSchema.optional(),
  keyDialogue: z.array(z.string().max(200)).default([]),
  notes: z.string().max(300).optional()
});

// =============================================================================
// MAIN CHARACTER SCHEMA
// =============================================================================

export const CharacterSchema = z.object({
  id: CharacterIdSchema,
  projectId: ProjectIdSchema,
  name: z.string().min(1).max(100),
  aliases: z.array(z.string().max(100)).default([]),
  role: CharacterRoleSchema,
  importance: z.number().min(0).max(10).default(5), // 0 = background, 10 = main protagonist
  
  // Core character information
  summary: z.string().max(500).default(''),
  physicalTraits: CharacterPhysicalTraitsSchema.optional().default({ distinctiveFeatures: [], disabilities: [] }),
  background: CharacterBackgroundSchema.optional().default({ significantEvents: [], secrets: [] }),
  psychology: CharacterPsychologySchema.optional().default({ coreBeliefs: [], values: [], fears: [], desires: [], flaws: [], strengths: [], personalityTraits: [] }),
  voice: CharacterVoiceSchema.optional().default({ vocabulary: 'average', tone: 'casual', speechPatterns: [], catchphrases: [] }),
  arc: CharacterArcSchema.optional(),
  
  // Visual representation
  portrait: Base64ImageSchema,
  mood_board: z.array(Base64ImageSchema).default([]),
  
  // Story integration
  firstAppearance: z.string().max(100).optional(), // Chapter reference
  lastAppearance: z.string().max(100).optional(),
  appearances: z.array(CharacterAppearanceEventSchema).default([]),
  
  // Metadata
  tags: z.array(z.string().max(50)).default([]),
  notes: z.string().max(2000).default(''),
  inspirations: z.array(z.string().max(200)).default([]), // Real people, fictional characters, etc.
  
  // System fields
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  version: z.number().int().min(1).default(1),
  
  // AI generation metadata
  generatedBy: z.enum(['user', 'ai_suggestion', 'ai_full']).default('user'),
  generationPrompt: z.string().max(1000).optional(),
  aiModel: z.string().optional()
}).refine(
  (data) => data.importance >= 7 ? !!data.arc : true,
  {
    message: "Characters with importance 7+ must have a character arc defined",
    path: ["arc"]
  }
).refine(
  (data) => data.role === 'protagonist' ? data.importance >= 8 : true,
  {
    message: "Protagonist must have importance level 8 or higher",
    path: ["importance"]
  }
);

// =============================================================================
// CHARACTER COLLECTION SCHEMAS
// =============================================================================

export const CharacterGroupSchema = z.object({
  id: z.string(),
  projectId: ProjectIdSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  characterIds: z.array(CharacterIdSchema),
  groupDynamic: z.string().max(1000).optional(),
  purpose: z.string().max(300).optional(),
  tags: z.array(z.string().max(50)).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export const CharacterConflictSchema = z.object({
  id: z.string(),
  projectId: ProjectIdSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(1000),
  participants: z.array(CharacterIdSchema).min(2),
  type: z.enum(['internal', 'interpersonal', 'social', 'environmental']),
  intensity: z.number().min(1).max(10),
  status: z.enum(['brewing', 'active', 'climaxing', 'resolving', 'resolved']),
  catalyst: z.string().max(300).optional(),
  stakes: z.string().max(500),
  resolution: z.string().max(500).optional(),
  chaptersInvolved: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

// =============================================================================
// FORM SCHEMAS
// =============================================================================

export const CreateCharacterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: CharacterRoleSchema,
  importance: z.number().min(0).max(10).default(5),
  summary: z.string().max(500).default(''),
  physicalTraits: CharacterPhysicalTraitsSchema.partial().default({}),
  psychology: CharacterPsychologySchema.partial().default({}),
  tags: z.array(z.string().max(50)).default([])
});

export const UpdateCharacterSchema = CharacterSchema.partial().extend({
  id: CharacterIdSchema
});

export const CharacterSearchSchema = z.object({
  query: z.string().optional(),
  role: CharacterRoleSchema.optional(),
  importance: z.object({
    min: z.number().min(0).max(10).optional(),
    max: z.number().min(0).max(10).optional()
  }).optional(),
  tags: z.array(z.string()).optional(),
  hasArc: z.boolean().optional(),
  sortBy: z.enum(['name', 'importance', 'role', 'created', 'updated']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CharacterRole = z.infer<typeof CharacterRoleSchema>;
export type CharacterArcType = z.infer<typeof CharacterArcTypeSchema>;
export type PersonalityTrait = z.infer<typeof PersonalityTraitSchema>;
export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;
export type EmotionalState = z.infer<typeof EmotionalStateSchema>;

export type Character = z.infer<typeof CharacterSchema>;
export type CharacterPhysicalTraits = z.infer<typeof CharacterPhysicalTraitsSchema>;
export type CharacterBackground = z.infer<typeof CharacterBackgroundSchema>;
export type CharacterPsychology = z.infer<typeof CharacterPsychologySchema>;
export type CharacterArc = z.infer<typeof CharacterArcSchema>;
export type CharacterVoice = z.infer<typeof CharacterVoiceSchema>;
export type CharacterRelationship = z.infer<typeof CharacterRelationshipSchema>;
export type CharacterAppearanceEvent = z.infer<typeof CharacterAppearanceEventSchema>;
export type CharacterGroup = z.infer<typeof CharacterGroupSchema>;
export type CharacterConflict = z.infer<typeof CharacterConflictSchema>;

export type CreateCharacter = z.infer<typeof CreateCharacterSchema>;
export type UpdateCharacter = z.infer<typeof UpdateCharacterSchema>;
export type CharacterSearch = z.infer<typeof CharacterSearchSchema>;