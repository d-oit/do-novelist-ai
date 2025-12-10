/**
 * Input Validation Utilities
 *
 * Provides basic validation functions for user inputs.
 * For LLM-specific validation, see promptSecurity.ts
 *
 * Based on 2025 security best practices
 */

import { z } from 'zod';

import { ChapterStatus, PublishStatus } from '@/types';

// Maximum input lengths (OWASP recommendations)
export const MAX_TITLE_LENGTH = 200;
export const MAX_STYLE_LENGTH = 100;
export const MAX_IDEA_LENGTH = 10000;
export const MAX_CONTENT_LENGTH = 100000;
export const MAX_CHAPTER_SUMMARY_LENGTH = 5000;

// Zod schemas for form validation
export const projectWizardSchema = z.object({
  title: z
    .string()
    .min(1, 'Project title is required')
    .max(MAX_TITLE_LENGTH, `Title must be ${MAX_TITLE_LENGTH} characters or less`)
    .refine(val => val.trim().length > 0, 'Project title cannot be empty or just whitespace'),

  style: z
    .string()
    .min(1, 'Writing style is required')
    .max(MAX_STYLE_LENGTH, `Style must be ${MAX_STYLE_LENGTH} characters or less`)
    .refine(val => val.trim().length > 0, 'Writing style cannot be empty or just whitespace'),

  idea: z
    .string()
    .min(10, 'Book idea must be at least 10 characters')
    .max(MAX_IDEA_LENGTH, `Idea must be ${MAX_IDEA_LENGTH} characters or less`)
    .refine(val => val.trim().length > 0, 'Book idea cannot be empty or just whitespace'),

  tone: z.string().max(100, 'Tone must be 100 characters or less').optional(),

  audience: z.string().max(100, 'Target audience must be 100 characters or less').optional(),

  customInstructions: z
    .string()
    .max(1000, 'Custom instructions must be 1000 characters or less')
    .optional(),

  targetWordCount: z
    .number()
    .min(1000, 'Word count must be at least 1,000')
    .max(500000, 'Word count cannot exceed 500,000')
    .default(50000)
    .transform(val => val ?? 50000),
});

export type ProjectWizardFormData = z.infer<typeof projectWizardSchema>;

// Validation error types
export class ValidationError extends Error {
  public constructor(
    message: string,
    public field?: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates a chapter title
 */
export function validateChapterTitle(title: string): string {
  if (!title || title.trim().length === 0) {
    throw new ValidationError('Title cannot be empty', 'title', 'EMPTY_TITLE');
  }

  if (title.length > MAX_TITLE_LENGTH) {
    throw new ValidationError(
      `Title too long (max ${MAX_TITLE_LENGTH} characters)`,
      'title',
      'TITLE_TOO_LONG',
    );
  }

  // Remove control characters using the comprehensive pattern
  // This removes all control chars (0-31) and DEL (127)
  const sanitized = title.replace(/[\x00-\x1F\x7F]/g, '');

  return sanitized.trim();
}

/**
 * Validates a project title
 */
export function validateProjectTitle(title: string): string {
  if (!title || title.trim().length === 0) {
    throw new ValidationError('Project title cannot be empty', 'title', 'EMPTY_TITLE');
  }

  if (title.length > MAX_TITLE_LENGTH) {
    throw new ValidationError(
      `Title too long (max ${MAX_TITLE_LENGTH} characters)`,
      'title',
      'TITLE_TOO_LONG',
    );
  }

  const sanitized = title.replace(/[\x00-\x1F\x7F]/g, '');

  return sanitized.trim();
}

/**
 * Validates a writing style
 */
export function validateStyle(style: string): string {
  if (!style || style.trim().length === 0) {
    throw new ValidationError('Writing style cannot be empty', 'style', 'EMPTY_STYLE');
  }

  if (style.length > MAX_STYLE_LENGTH) {
    throw new ValidationError(
      `Style too long (max ${MAX_STYLE_LENGTH} characters)`,
      'style',
      'STYLE_TOO_LONG',
    );
  }

  const sanitized = style.replace(/[\x00-\x1F\x7F]/g, '');

  return sanitized.trim();
}

/**
 * Validates a book idea
 */
export function validateIdea(idea: string): string {
  // Sanitize control characters FIRST (before validation checks)
  const sanitized = idea.replace(/[\x00-\x1F\x7F]/g, '');
  const trimmed = sanitized.trim();

  if (!trimmed || trimmed.length === 0) {
    throw new ValidationError('Book idea cannot be empty', 'idea', 'EMPTY_IDEA');
  }

  if (trimmed.length < 10) {
    throw new ValidationError('Book idea must be at least 10 characters', 'idea', 'IDEA_TOO_SHORT');
  }

  if (sanitized.length > MAX_IDEA_LENGTH) {
    throw new ValidationError(
      `Idea too long (max ${MAX_IDEA_LENGTH} characters)`,
      'idea',
      'IDEA_TOO_LONG',
    );
  }

  return trimmed;
}

/**
 * Validates a chapter summary
 */
export function validateChapterSummary(summary: string): string {
  if (!summary || summary.trim().length === 0) {
    throw new ValidationError('Chapter summary cannot be empty', 'summary', 'EMPTY_SUMMARY');
  }

  if (summary.length > MAX_CHAPTER_SUMMARY_LENGTH) {
    throw new ValidationError(
      `Summary too long (max ${MAX_CHAPTER_SUMMARY_LENGTH} characters)`,
      'summary',
      'SUMMARY_TOO_LONG',
    );
  }

  const sanitized = summary.replace(/[\x00-\x1F\x7F]/g, '');

  return sanitized.trim();
}

/**
 * Validates chapter content
 */
export function validateChapterContent(content: string): string {
  if (content.length > MAX_CONTENT_LENGTH) {
    throw new ValidationError(
      `Content too long (max ${MAX_CONTENT_LENGTH} characters)`,
      'content',
      'CONTENT_TOO_LONG',
    );
  }

  // For content, we're more permissive with whitespace
  const sanitized = content.replace(/[\x00-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Validates a word count target
 */
export function validateWordCount(count: number): number {
  if (!Number.isInteger(count)) {
    throw new ValidationError('Word count must be a whole number', 'wordCount', 'INVALID_NUMBER');
  }

  if (count < 1000) {
    throw new ValidationError(
      'Word count must be at least 1,000',
      'wordCount',
      'WORD_COUNT_TOO_LOW',
    );
  }

  if (count > 500000) {
    throw new ValidationError(
      'Word count cannot exceed 500,000',
      'wordCount',
      'WORD_COUNT_TOO_HIGH',
    );
  }

  return count;
}

/**
 * Validates a URL
 * Prevents javascript:, data:, and other dangerous protocols
 */
export function validateURL(url: string): string {
  if (!url || url.trim().length === 0) {
    throw new ValidationError('URL cannot be empty', 'url', 'EMPTY_URL');
  }

  try {
    const parsed = new URL(url);

    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new ValidationError('URL must use http or https protocol', 'url', 'INVALID_PROTOCOL');
    }

    return url.trim();
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Invalid URL format', 'url', 'INVALID_URL');
  }
}

/**
 * Generic input validator with configurable options
 */
export interface ValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: string) => boolean;
  errorMessage?: string;
}

function checkRequired(value: string, required: boolean): void {
  if (required && (!value || value.trim().length === 0)) {
    throw new ValidationError('This field is required', undefined, 'REQUIRED');
  }
}

function checkMinLength(value: string, minLength: number): void {
  if (value.length < minLength) {
    throw new ValidationError(`Must be at least ${minLength} characters`, undefined, 'TOO_SHORT');
  }
}

function checkMaxLength(value: string, maxLength: number): void {
  if (value.length > maxLength) {
    throw new ValidationError(`Must be at most ${maxLength} characters`, undefined, 'TOO_LONG');
  }
}

function checkPattern(value: string, pattern: RegExp | undefined, errorMessage: string): void {
  if (pattern && !pattern.test(value)) {
    throw new ValidationError(errorMessage, undefined, 'PATTERN_MISMATCH');
  }
}

function checkCustomValidator(
  value: string,
  customValidator: ((value: string) => boolean) | undefined,
  errorMessage: string,
): void {
  if (customValidator && !customValidator(value)) {
    throw new ValidationError(errorMessage, undefined, 'CUSTOM_VALIDATION_FAILED');
  }
}

function sanitizeValue(value: string): string {
  // Sanitize control characters using the comprehensive pattern
  // This removes all control chars (0-31) and DEL (127)
  const sanitized = value.replace(/[\x00-\x1F\x7F]/g, '');
  return sanitized.trim();
}

export function validateInput(value: string, options: ValidationOptions = {}): string {
  const {
    required = true,
    minLength = 0,
    maxLength = Infinity,
    pattern,
    customValidator,
    errorMessage = 'Validation failed',
  } = options;

  // Check required
  checkRequired(value, required);

  // Allow empty if not required
  if (!required && (!value || value.trim().length === 0)) {
    return '';
  }

  // Check length
  checkMinLength(value, minLength);
  checkMaxLength(value, maxLength);

  // Check pattern
  checkPattern(value, pattern, errorMessage);

  // Sanitize first (trim and remove control characters)
  const sanitizedValue = sanitizeValue(value);

  // Custom validation on sanitized value
  checkCustomValidator(sanitizedValue, customValidator, errorMessage);

  return sanitizedValue;
}

/**
 * Batch validation - validates multiple fields and returns all errors
 */
export function validateBatch(validators: { field: string; validate: () => string }[]): {
  isValid: boolean;
  errors: Record<string, string>;
  values: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  const values: Record<string, string> = {};

  for (const { field, validate } of validators) {
    try {
      values[field] = validate();
    } catch (error) {
      if (error instanceof ValidationError) {
        errors[field] = error.message;
      } else {
        errors[field] = 'Validation failed';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    values,
  };
}

/**
 * Enum Validation Utilities
 *
 * Provides type-safe enum validation and conversion functions
 */

/**
 * Safely converts a string to ChapterStatus enum value
 * Returns a default value if the string is not a valid enum value
 */
export function parseChapterStatus(
  value: string,
  defaultValue: ChapterStatus = ChapterStatus.PENDING,
): ChapterStatus {
  const validValues = Object.values(ChapterStatus) as string[];
  if (validValues.includes(value)) {
    return value as ChapterStatus;
  }
  return defaultValue;
}

/**
 * Safely converts a string to PublishStatus enum value
 * Returns a default value if the string is not a valid enum value
 */
export function parsePublishStatus(
  value: string,
  defaultValue: PublishStatus = PublishStatus.DRAFT,
): PublishStatus {
  const validValues = Object.values(PublishStatus) as string[];
  if (validValues.includes(value)) {
    return value as PublishStatus;
  }
  return defaultValue;
}

/**
 * Type guard to check if a value is a valid ChapterStatus
 */
export function isChapterStatus(value: unknown): value is ChapterStatus {
  return typeof value === 'string' && Object.values(ChapterStatus).includes(value as ChapterStatus);
}

/**
 * Type guard to check if a value is a valid PublishStatus
 */
export function isPublishStatus(value: unknown): value is PublishStatus {
  return typeof value === 'string' && Object.values(PublishStatus).includes(value as PublishStatus);
}
