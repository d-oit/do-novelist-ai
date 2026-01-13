/**
 * React Query Configuration
 *
 * Centralized configuration for TanStack Query with optimized defaults
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Default query options for all queries
 */
const defaultQueryOptions = {
  queries: {
    // Stale time: how long data is considered fresh
    staleTime: 1000 * 60 * 5, // 5 minutes

    // Cache time: how long unused data stays in cache
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)

    // Retry failed requests
    retry: (failureCount: number, error: unknown) => {
      // Don't retry on 4xx errors (client errors)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },

    // Retry delay with exponential backoff
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch on window focus for real-time data
    refetchOnWindowFocus: true,

    // Refetch on reconnect
    refetchOnReconnect: true,

    // Don't refetch on mount if data is fresh
    refetchOnMount: false,
  },
  mutations: {
    // Retry mutations once
    retry: 1,

    // Retry delay for mutations
    retryDelay: 1000,
  },
};

/**
 * Create and configure QueryClient instance
 */
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
});

/**
 * Query key factory for consistent cache keys
 */
export const queryKeys = {
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    stats: () => [...queryKeys.projects.all, 'stats'] as const,
  },

  // Characters
  characters: {
    all: ['characters'] as const,
    lists: () => [...queryKeys.characters.all, 'list'] as const,
    list: (projectId: string, filters?: Record<string, unknown>) =>
      [...queryKeys.characters.lists(), projectId, filters] as const,
    details: () => [...queryKeys.characters.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.characters.details(), id] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    stats: (projectId?: string) => [...queryKeys.analytics.all, 'stats', projectId] as const,
    sessions: (projectId?: string) => [...queryKeys.analytics.all, 'sessions', projectId] as const,
    goals: (userId: string) => [...queryKeys.analytics.all, 'goals', userId] as const,
  },

  // World Building
  worldBuilding: {
    all: ['world-building'] as const,
    locations: (projectId: string) =>
      [...queryKeys.worldBuilding.all, 'locations', projectId] as const,
    cultures: (projectId: string) =>
      [...queryKeys.worldBuilding.all, 'cultures', projectId] as const,
  },

  // Publishing
  publishing: {
    all: ['publishing'] as const,
    metadata: (projectId: string) => [...queryKeys.publishing.all, 'metadata', projectId] as const,
    analytics: (projectId: string) =>
      [...queryKeys.publishing.all, 'analytics', projectId] as const,
  },
} as const;
