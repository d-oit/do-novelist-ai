/**
 * Projects Feature Type Definitions
 *
 * Feature-local types for project management functionality
 */

import { z } from 'zod';

import { WritingStyleSchema, type WritingStyle, type PublishStatus } from '@/types';

/**
 * Project update data
 */

/**
 * Project creation wizard step
 */
export type WizardStep = 'idea' | 'outline' | 'style' | 'chapters' | 'review';

/**
 * Project filter options
 */
export interface ProjectFilters {
  search: string;
  status: 'all' | 'active' | 'draft' | 'completed' | 'archived';
  sortBy: 'updatedAt' | 'createdAt' | 'title' | 'progress';
  sortOrder: 'asc' | 'desc';
}

/**
 * Project statistics
 */
export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalWords: number;
  totalChapters: number;
  averageProgress: number;
}

/**
 * Project creation data
 */
export const ProjectCreationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  idea: z.string().min(10, 'Idea must be at least 10 characters').max(5000),
  style: WritingStyleSchema,
  targetWordCount: z.number().min(1000).max(500000).optional(),
  genre: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  language: z.string().optional(),
  targetAudience: z.string().optional(),
});

export type ProjectCreationData = z.infer<typeof ProjectCreationSchema>;

export interface ProjectUpdateData {
  title?: string;
  idea?: string;
  style?: WritingStyle;
  status?: PublishStatus;
  lastOpenedAt?: number;
}

/**
 * Type guards
 */
export function isValidWizardStep(step: string): step is WizardStep {
  return ['idea', 'outline', 'style', 'chapters', 'review'].includes(step);
}

export function validateProjectCreation(data: unknown): ProjectCreationData {
  return ProjectCreationSchema.parse(data);
}
