/**
 * TypeScript utility types and helpers for enhanced type safety
 * Following strict typing patterns for production-grade applications
 */

import type React from 'react';

import type { ChapterId, ProjectId, Temperature } from '@/types/schemas';

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Makes specified keys required while keeping others optional
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Makes specified keys optional while keeping others required
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Deep partial type that makes all nested properties optional
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Deep required type that makes all nested properties required
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Extracts the type of array elements
 */
export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

/**
 * Creates a union of all values in an object
 */
export type ValueOf<T> = T[keyof T];

/**
 * Creates a type that excludes null and undefined
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Creates a branded type for enhanced type safety
 */
export type Brand<T, K> = T & { __brand: K };

/**
 * Extracts promise return type
 */
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

// =============================================================================
// DOMAIN-SPECIFIC UTILITY TYPES
// =============================================================================

// Removed conflicting types that are imported from schemas.ts

// =============================================================================
// FUNCTION TYPES
// =============================================================================

/**
 * Generic event handler type
 */
export type EventHandler<T = void> = (event: T) => void;

/**
 * Async event handler type
 */
export type AsyncEventHandler<T = void> = (event: T) => Promise<void>;

/**
 * Generic callback type
 */
export type Callback<T = void, R = void> = (value: T) => R;

/**
 * Async callback type
 */
export type AsyncCallback<T = void, R = void> = (value: T) => Promise<R>;

/**
 * Predicate function type
 */
export type Predicate<T> = (value: T) => boolean;

/**
 * Comparator function type
 */
export type Comparator<T> = (a: T, b: T) => number;

/**
 * Transformer function type
 */
export type Transformer<TInput, TOutput> = (input: TInput) => TOutput;

/**
 * Async transformer function type
 */
export type AsyncTransformer<TInput, TOutput> = (input: TInput) => Promise<TOutput>;

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Standard API response wrapper
 */
export type ApiResponse<TData = unknown> =
  | {
      success: true;
      data: TData;
      message?: string;
    }
  | {
      success: false;
      error: string;
      code?: string;
      details?: unknown;
    };

/**
 * Paginated API response
 */
export interface PaginatedResponse<TData> {
  items: TData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Search response with metadata
 */
export interface SearchResponse<TData> {
  results: TData[];
  query: string;
  totalResults: number;
  searchTime: number; // milliseconds
  filters?: Record<string, unknown>;
}

// =============================================================================
// STATE MANAGEMENT TYPES
// =============================================================================

/**
 * Loading state type
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Async operation state
 */
export interface AsyncState<TData, TError = Error> {
  data: TData | null;
  loading: boolean;
  error: TError | null;
}

/**
 * Form state type
 */
export interface FormState<TData> {
  values: TData;
  errors: Partial<Record<keyof TData, string>>;
  touched: Partial<Record<keyof TData, boolean>>;
  dirty: boolean;
  valid: boolean;
  submitting: boolean;
}

/**
 * Modal state type
 */
export interface ModalState {
  isOpen: boolean;
  data?: unknown;
  context?: string;
}

// =============================================================================
// COMPONENT PROP TYPES
// =============================================================================

/**
 * Common component props
 */
export interface ComponentBaseProps {
  className?: string;
  id?: string;
  'data-testid'?: string;
}

/**
 * Props with children
 */
export type WithChildren<T = object> = T & {
  children: React.ReactNode;
};

/**
 * Optional children props
 */
export type WithOptionalChildren<T = object> = T & {
  children?: React.ReactNode;
};

/**
 * Props with ref forwarding
 */
export type WithRef<T, TElement = HTMLElement> = T & {
  ref?: React.Ref<TElement>;
};

/**
 * Polymorphic component props
 */
export type PolymorphicProps<TElement extends keyof React.JSX.IntrinsicElements = 'div'> = {
  as?: TElement;
} & Omit<React.JSX.IntrinsicElements[TElement], 'as'>;

// =============================================================================
// VALIDATION TYPES
// =============================================================================

// ValidationResult removed as it is imported from schemas.ts

/**
 * Field validation function
 */
export type FieldValidator<T> = (value: T) => string | null;

/**
 * Form validation function
 */
export type FormValidator<T> = (values: T) => Partial<Record<keyof T, string>>;

// =============================================================================
// DATABASE TYPES
// =============================================================================

/**
 * Database entity with timestamps
 */
export interface TimestampedEntity {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Soft deletable entity
 */
export interface SoftDeletableEntity extends TimestampedEntity {
  deletedAt: Date | null;
}

/**
 * Database query options
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  filters?: Record<string, unknown>;
}

/**
 * Database connection config
 */
export interface DatabaseConfig {
  url: string;
  authToken?: string;
  timeout?: number;
  retries?: number;
}

// =============================================================================
// EVENT TYPES
// =============================================================================

/**
 * Custom event types for the application
 */
export type AppEvent =
  | { type: 'PROJECT_CREATED'; payload: { projectId: ProjectId } }
  | { type: 'PROJECT_UPDATED'; payload: { projectId: ProjectId; changes: string[] } }
  | { type: 'PROJECT_DELETED'; payload: { projectId: ProjectId } }
  | { type: 'CHAPTER_ADDED'; payload: { projectId: ProjectId; chapterId: ChapterId } }
  | { type: 'CHAPTER_UPDATED'; payload: { projectId: ProjectId; chapterId: ChapterId } }
  | { type: 'CHAPTER_DELETED'; payload: { projectId: ProjectId; chapterId: ChapterId } }
  | { type: 'GENERATION_STARTED'; payload: { projectId: ProjectId; actionName: string } }
  | {
      type: 'GENERATION_COMPLETED';
      payload: { projectId: ProjectId; actionName: string; duration: number };
    }
  | {
      type: 'GENERATION_FAILED';
      payload: { projectId: ProjectId; actionName: string; error: string };
    }
  | { type: 'SETTINGS_UPDATED'; payload: { projectId: ProjectId; settings: Partial<unknown> } }
  | { type: 'EXPORT_STARTED'; payload: { projectId: ProjectId; format: string } }
  | {
      type: 'EXPORT_COMPLETED';
      payload: { projectId: ProjectId; format: string; filePath: string };
    };

/**
 * Event listener type
 */
export type EventListener<T extends AppEvent = AppEvent> = (event: T) => void;

// =============================================================================
// HOOK TYPES
// =============================================================================

/**
 * Hook return type for async operations
 */
export type AsyncHookReturn<TData, TError = Error> = [
  AsyncState<TData, TError>,
  {
    execute: () => Promise<void>;
    reset: () => void;
  },
];

/**
 * Hook return type for form management
 */
export type FormHookReturn<TData> = [
  FormState<TData>,
  {
    setValue: <K extends keyof TData>(key: K, value: TData[K]) => void;
    setError: <K extends keyof TData>(key: K, error: string) => void;
    clearError: <K extends keyof TData>(key: K) => void;
    setTouched: <K extends keyof TData>(key: K, touched: boolean) => void;
    reset: (initialValues?: TData) => void;
    submit: () => Promise<void>;
  },
];

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

/**
 * Application configuration
 */
export interface AppConfig {
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  database: DatabaseConfig;
  ai: {
    provider: 'gemini' | 'openai' | 'anthropic';
    apiKey: string;
    defaultModel: string;
    maxTokens: number;
    temperature: Temperature;
  };
  features: {
    collaboration: boolean;
    analytics: boolean;
    publishing: boolean;
    multiLanguage: boolean;
  };
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
    destructive: string;
  };
  fonts: {
    sans: string[];
    serif: string[];
    mono: string[];
  };
  spacing: Record<string, string>;
  breakpoints: Record<string, string>;
}
