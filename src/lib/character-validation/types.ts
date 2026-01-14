import type { z } from 'zod';

export type ValidationIssue = z.ZodIssue;

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; issues: ValidationIssue[] };

export interface ValidationSummary {
  isValid: boolean;
  score: number;
  issues: ValidationIssue[];
  strengths: string[];
}
