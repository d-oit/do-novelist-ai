import { z } from 'zod';

// ============================================================================
// Character Core Types
// ============================================================================

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
  'background',
]);

export type CharacterRole = z.infer<typeof CharacterRoleSchema>;

export const CharacterArcSchema = z.enum([
  'positive_change',
  'negative_change',
  'flat',
  'corruption',
  'redemption',
  'growth',
  'fall',
  'disillusion',
  'testing',
]);

export type CharacterArc = z.infer<typeof CharacterArcSchema>;

// ============================================================================
// Character Trait System
// ============================================================================

export const CharacterTraitSchema = z.object({
  category: z.enum(['personality', 'physical', 'skill', 'flaw', 'strength']),
  name: z.string().min(1).max(50),
  description: z.string().max(500),
  intensity: z.number().min(1).max(10),
});

export type CharacterTrait = z.infer<typeof CharacterTraitSchema>;

// ============================================================================
// Character Relationships
// ============================================================================

export const CharacterRelationshipSchema = z.object({
  id: z.string(),
  characterAId: z.string(),
  characterBId: z.string(),
  type: z.enum(['family', 'romantic', 'friendship', 'rivalry', 'mentor-student', 'enemy', 'ally']),
  description: z.string().max(500),
  strength: z.number().min(1).max(10),
});

export type CharacterRelationship = z.infer<typeof CharacterRelationshipSchema>;

// ============================================================================
// Main Character Schema
// ============================================================================

export const CharacterSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().min(1).max(100),
  aliases: z.array(z.string()).default([]),
  role: CharacterRoleSchema,
  arc: CharacterArcSchema,

  // Core Attributes
  age: z.number().min(0).max(200).optional(),
  gender: z.string().max(50).optional(),
  occupation: z.string().max(100).optional(),

  // Character Development
  motivation: z.string().min(10).max(1000),
  goal: z.string().min(10).max(1000),
  conflict: z.string().min(10).max(1000),
  backstory: z.string().max(5000).optional(),

  // Traits
  traits: z.array(CharacterTraitSchema).max(20),

  // Relationships
  relationships: z.array(CharacterRelationshipSchema).default([]),

  // Metadata
  version: z.number().default(1),
  summary: z.string().max(500).optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(2000).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  imageUrl: z.string().url().optional().nullable(),
  aiModel: z.string().optional(),
});

export type Character = z.infer<typeof CharacterSchema>;

// ============================================================================
// Validation Results
// ============================================================================

export interface CharacterValidationIssue {
  field: string;
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  suggestion?: string;
}

export interface CharacterValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: CharacterValidationIssue[];
  strengths: string[];
}

// ============================================================================
// Filter Types
// ============================================================================

export interface CharacterFilters {
  search: string;
  roles: CharacterRole[];
  arcs: CharacterArc[];
  validationStatus: 'all' | 'valid' | 'warnings' | 'errors';
}

// ============================================================================
// Type Guards
// ============================================================================

export function isCharacter(value: unknown): value is Character {
  return CharacterSchema.safeParse(value).success;
}

export function isCharacterRole(value: unknown): value is CharacterRole {
  return CharacterRoleSchema.safeParse(value).success;
}

export function isCharacterArc(value: unknown): value is CharacterArc {
  return CharacterArcSchema.safeParse(value).success;
}
