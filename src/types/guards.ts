/**
 * Type guards for runtime type checking and validation
 * Ensures type safety at runtime using Zod schemas
 */

import {
  ProjectSchema,
  ChapterSchema,
  WorldStateSchema,
  ProjectSettingsSchema,
  AgentActionSchema,
  LogEntrySchema,
  RefineOptionsSchema,
  CreateProjectSchema,
  UpdateChapterSchema,
  UpdateProjectSchema,
  ProjectFilterSchema,
  type Project,
  type Chapter,
  type WorldState,
  type ProjectSettings,
  type AgentAction,
  type LogEntry,
  type RefineOptions,
  type CreateProject,
  type UpdateChapter,
  type UpdateProject,
  type ProjectFilter,
  type ProjectId,
  type ChapterId,
  type LogId,
  type Base64Image,
  type WordCount,
  type Temperature,
  WRITING_STYLES,
  LANGUAGES,
  type WritingStyle,
  type Language,
} from './schemas';

// =============================================================================
// SCHEMA-BASED TYPE GUARDS
// =============================================================================

/**
 * Type guard for Project
 */
export function isProject(value: unknown): value is Project {
  return ProjectSchema.safeParse(value).success;
}

/**
 * Type guard for Chapter
 */
export function isChapter(value: unknown): value is Chapter {
  return ChapterSchema.safeParse(value).success;
}

/**
 * Type guard for WorldState
 */
export function isWorldState(value: unknown): value is WorldState {
  return WorldStateSchema.safeParse(value).success;
}

/**
 * Type guard for ProjectSettings
 */
export function isProjectSettings(value: unknown): value is ProjectSettings {
  return ProjectSettingsSchema.safeParse(value).success;
}

/**
 * Type guard for AgentAction
 */
export function isAgentAction(value: unknown): value is AgentAction {
  return AgentActionSchema.safeParse(value).success;
}

/**
 * Type guard for LogEntry
 */
export function isLogEntry(value: unknown): value is LogEntry {
  return LogEntrySchema.safeParse(value).success;
}

/**
 * Type guard for RefineOptions
 */
export function isRefineOptions(value: unknown): value is RefineOptions {
  return RefineOptionsSchema.safeParse(value).success;
}

/**
 * Type guard for CreateProject
 */
export function isCreateProject(value: unknown): value is CreateProject {
  return CreateProjectSchema.safeParse(value).success;
}

/**
 * Type guard for UpdateChapter
 */
export function isUpdateChapter(value: unknown): value is UpdateChapter {
  return UpdateChapterSchema.safeParse(value).success;
}

/**
 * Type guard for UpdateProject
 */
export function isUpdateProject(value: unknown): value is UpdateProject {
  return UpdateProjectSchema.safeParse(value).success;
}

/**
 * Type guard for ProjectFilter
 */
export function isProjectFilter(value: unknown): value is ProjectFilter {
  return ProjectFilterSchema.safeParse(value).success;
}

// =============================================================================
// BRANDED TYPE GUARDS
// =============================================================================

/**
 * Type guard and creator for ProjectId
 */
export function isProjectId(value: unknown): value is ProjectId {
  return typeof value === 'string' && /^proj_\d+$/.test(value);
}

export function createProjectId(timestamp = Date.now()): ProjectId {
  return `proj_${timestamp}`;
}

/**
 * Type guard and creator for ChapterId
 */
export function isChapterId(value: unknown): value is ChapterId {
  return typeof value === 'string' && /^.+_ch_.+_\d+$/.test(value);
}

export function createChapterId(
  projectId: ProjectId,
  type = 'manual',
  timestamp = Date.now()
): ChapterId {
  return `${projectId}_ch_${type}_${timestamp}`;
}

/**
 * Type guard and creator for LogId
 */
export function isLogId(value: unknown): value is LogId {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

export function createLogId(): LogId {
  return crypto.randomUUID() as LogId;
}

/**
 * Type guard for Base64Image
 */
export function isBase64Image(value: unknown): value is Base64Image {
  return typeof value === 'string' && /^data:image\/(png|jpg|jpeg|gif|webp);base64,/.test(value);
}

/**
 * Type guard and validator for WordCount
 */
export function isWordCount(value: unknown): value is WordCount {
  return typeof value === 'number' && value >= 1000 && value <= 500000 && Number.isInteger(value);
}

export function createWordCount(value: number): WordCount | null {
  if (isWordCount(value)) {
    return value;
  }
  return null;
}

/**
 * Type guard and validator for Temperature
 */
export function isTemperature(value: unknown): value is Temperature {
  return typeof value === 'number' && value >= 0 && value <= 2;
}

export function createTemperature(value: number): Temperature | null {
  if (isTemperature(value)) {
    return value;
  }
  return null;
}

// =============================================================================
// COMPLEX TYPE GUARDS
// =============================================================================

/**
 * Type guard for array of Projects
 */
export function isProjectArray(value: unknown): value is Project[] {
  return Array.isArray(value) && value.every(isProject);
}

/**
 * Type guard for array of Chapters
 */
export function isChapterArray(value: unknown): value is Chapter[] {
  return Array.isArray(value) && value.every(isChapter);
}

/**
 * Type guard for array of LogEntries
 */
export function isLogEntryArray(value: unknown): value is LogEntry[] {
  return Array.isArray(value) && value.every(isLogEntry);
}

/**
 * Type guard for array of AgentActions
 */
export function isAgentActionArray(value: unknown): value is AgentAction[] {
  return Array.isArray(value) && value.every(isAgentAction);
}

// =============================================================================
// UTILITY TYPE GUARDS
// =============================================================================

/**
 * Type guard for non-null values
 */
export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

/**
 * Type guard for non-undefined values
 */
export function isNotUndefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

/**
 * Type guard for non-nullable values
 */
export function isNotNullish<T>(value: T | null | undefined): value is T {
  return value != null;
}

/**
 * Type guard for strings
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard for non-empty strings
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard for numbers
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard for positive numbers
 */
export function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

/**
 * Type guard for integers
 */
export function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

/**
 * Type guard for positive integers
 */
export function isPositiveInteger(value: unknown): value is number {
  return isInteger(value) && value > 0;
}

/**
 * Type guard for booleans
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard for Date objects
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Type guard for valid date strings
 */
export function isDateString(value: unknown): value is string {
  if (!isString(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Type guard for objects (excluding arrays and null)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for plain objects (no constructor other than Object)
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return isObject(value) && value.constructor === Object;
}

/**
 * Type guard for functions
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

// =============================================================================
// VALIDATION HELPER FUNCTIONS
// =============================================================================

/**
 * Validates and asserts a value is of the expected type
 */
export function assertType<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage?: string
): asserts value is T {
  if (!guard(value)) {
    throw new TypeError(errorMessage || `Value does not match expected type`);
  }
}

/**
 * Safely casts a value to the expected type, returns null if invalid
 */
export function safeCast<T>(value: unknown, guard: (value: unknown) => value is T): T | null {
  return guard(value) ? value : null;
}

/**
 * Validates an object has all required keys
 */
export function hasKeys<T extends Record<string, unknown>>(
  obj: unknown,
  keys: (keyof T)[]
): obj is T {
  if (!isObject(obj)) return false;
  return keys.every(key => key in obj);
}

/**
 * Validates an object has at least one of the specified keys
 */
export function hasAnyKey<T extends Record<string, unknown>>(
  obj: unknown,
  keys: (keyof T)[]
): obj is Partial<T> {
  if (!isObject(obj)) return false;
  return keys.some(key => key in obj);
}

/**
 * Validates all values in an array match a type guard
 */
export function allMatch<T>(array: unknown[], guard: (value: unknown) => value is T): array is T[] {
  return array.every(guard);
}

/**
 * Validates at least one value in an array matches a type guard
 */
export function someMatch<T>(array: unknown[], guard: (value: unknown) => value is T): boolean {
  return array.some(guard);
}

// =============================================================================
// ENUM VALIDATION
// =============================================================================

/**
 * Creates a type guard for enum values
 */
export function createEnumGuard<T extends Record<string, string | number>>(
  enumObject: T
): (value: unknown) => value is T[keyof T] {
  const values = Object.values(enumObject);
  return (value: unknown): value is T[keyof T] => {
    return values.includes(value as T[keyof T]);
  };
}

/**
 * Validates a value is a valid enum member
 */
export function isEnumValue<T extends Record<string, string | number>>(
  enumObject: T,
  value: unknown
): value is T[keyof T] {
  return createEnumGuard(enumObject)(value);
}

// Additional guard functions for compatibility
export function isWritingStyle(value: unknown): value is WritingStyle {
  return typeof value === 'string' && (WRITING_STYLES as readonly string[]).includes(value);
}

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}
