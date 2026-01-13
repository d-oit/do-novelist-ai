# React Query Integration Guide

## Overview

This project uses **TanStack Query (React Query)** for server state management,
providing:

- ✅ Automatic caching and background refetching
- ✅ Optimistic updates for instant UI feedback
- ✅ Request deduplication
- ✅ Automatic error retry with exponential backoff
- ✅ Cache invalidation strategies
- ✅ DevTools for debugging (development only)

## Architecture

### Configuration

The QueryClient is configured in `src/lib/react-query/query-client.ts` with
optimized defaults:

```typescript
const defaultQueryOptions = {
  queries: {
    staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
    gcTime: 1000 * 60 * 30, // 30 minutes - cache retention
    retry: 2, // Retry failed requests twice
    refetchOnWindowFocus: true, // Refresh on window focus
    refetchOnReconnect: true, // Refresh on reconnection
  },
  mutations: {
    retry: 1, // Retry mutations once
  },
};
```

### Query Key Factory

Centralized query keys ensure consistency and make cache invalidation easier:

```typescript
export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: filters => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: id => [...queryKeys.projects.details(), id] as const,
  },
};
```

## Usage Patterns

### 1. Queries (Data Fetching)

#### Basic Query

```typescript
import { useProjectsQuery } from '@/features/projects/hooks/useProjectsQuery';

function ProjectsList() {
  const { data, isLoading, error, refetch } = useProjectsQuery();

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return <div>{data.map(project => ...)}</div>;
}
```

#### Query with Parameters

```typescript
function ProjectDetail({ projectId }: { projectId: string }) {
  const { data: project } = useProjectQuery(projectId);
  // Query is automatically disabled if projectId is null
}
```

#### Dependent Queries

```typescript
function ProjectWithStats({ projectId }: { projectId: string }) {
  const { data: project } = useProjectQuery(projectId);

  // Only fetch stats after project is loaded
  const { data: stats } = useProjectStatsQuery({
    enabled: !!project,
  });
}
```

### 2. Mutations (Data Modifications)

#### Basic Mutation

```typescript
import { useCreateProjectMutation } from '@/features/projects/hooks/useProjectsQuery';

function CreateProjectForm() {
  const createProject = useCreateProjectMutation();

  const handleSubmit = async (formData) => {
    try {
      await createProject.mutateAsync(formData);
      // Success! Cache is automatically invalidated
    } catch (error) {
      // Handle error
    }
  };

  return (
    <button
      onClick={handleSubmit}
      disabled={createProject.isPending}
    >
      {createProject.isPending ? 'Creating...' : 'Create Project'}
    </button>
  );
}
```

#### Mutation with Optimistic Updates

```typescript
export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      await projectService.update(id, data);
    },

    // 1. Before mutation runs
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.projects.detail(id),
      });

      // Snapshot the previous value
      const previousProject = queryClient.getQueryData(
        queryKeys.projects.detail(id),
      );

      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.projects.detail(id), old => ({
        ...old,
        ...data,
      }));

      // Return context for rollback
      return { previousProject };
    },

    // 2. If mutation fails
    onError: (err, { id }, context) => {
      // Rollback to the previous value
      if (context?.previousProject) {
        queryClient.setQueryData(
          queryKeys.projects.detail(id),
          context.previousProject,
        );
      }
    },

    // 3. After mutation succeeds or fails
    onSettled: ({ id }) => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(id),
      });
    },
  });
}
```

### 3. Cache Management

#### Manual Cache Updates

```typescript
import { useQueryClient } from '@/lib/react-query';

function MyComponent() {
  const queryClient = useQueryClient();

  // Update cache directly
  const updateCache = () => {
    queryClient.setQueryData(queryKeys.projects.detail('123'), newData);
  };

  // Invalidate cache (triggers refetch)
  const invalidateCache = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
  };

  // Remove from cache
  const removeFromCache = () => {
    queryClient.removeQueries({ queryKey: queryKeys.projects.detail('123') });
  };
}
```

#### Prefetching Data

```typescript
const queryClient = useQueryClient();

// Prefetch before user navigates
const prefetchProject = async (projectId: string) => {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => projectService.getById(projectId),
  });
};
```

## Best Practices

### 1. Query Key Organization

✅ **Do:** Use hierarchical query keys

```typescript
queryKeys.projects.detail('123'); // ['projects', 'detail', '123']
```

❌ **Don't:** Use flat strings

```typescript
['project-123']; // Hard to invalidate related queries
```

### 2. Error Handling

✅ **Do:** Handle errors in the UI

```typescript
const { data, error } = useProjectsQuery();

if (error) {
  return <ErrorBoundary error={error} />;
}
```

✅ **Do:** Provide retry mechanisms

```typescript
const { refetch } = useProjectsQuery();

return <button onClick={() => refetch()}>Try Again</button>;
```

### 3. Loading States

✅ **Do:** Show loading states appropriately

```typescript
const { data, isLoading, isFetching } = useProjectsQuery();

// isLoading: First load
// isFetching: Background refresh
```

✅ **Do:** Use skeleton loaders

```typescript
if (isLoading) return <SkeletonLoader />;
```

### 4. Mutation Feedback

✅ **Do:** Provide immediate feedback

```typescript
const mutation = useCreateProjectMutation();

<button disabled={mutation.isPending}>
  {mutation.isPending ? <Spinner /> : 'Create'}
</button>
```

✅ **Do:** Show success/error messages

```typescript
mutation.mutate(data, {
  onSuccess: () => toast.success('Project created!'),
  onError: error => toast.error(error.message),
});
```

### 5. Cache Invalidation

✅ **Do:** Invalidate related queries

```typescript
onSuccess: () => {
  // Invalidate all project lists
  queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });

  // Invalidate stats
  queryClient.invalidateQueries({ queryKey: queryKeys.projects.stats() });
};
```

❌ **Don't:** Invalidate too broadly

```typescript
// This invalidates EVERYTHING - too expensive!
queryClient.invalidateQueries();
```

## Migration Guide

### From Zustand to React Query

**Before (Zustand):**

```typescript
const useProjects = create(set => ({
  projects: [],
  isLoading: false,

  loadAll: async () => {
    set({ isLoading: true });
    const projects = await projectService.getAll();
    set({ projects, isLoading: false });
  },
}));
```

**After (React Query):**

```typescript
export function useProjectsQuery() {
  return useQuery({
    queryKey: queryKeys.projects.lists(),
    queryFn: () => projectService.getAll(),
  });
}
```

**Benefits:**

- ✅ Automatic caching
- ✅ Background refetching
- ✅ Request deduplication
- ✅ No manual loading state management
- ✅ Automatic error handling

### Migration Checklist

- [x] Install `@tanstack/react-query`
- [x] Set up QueryClient and Provider
- [x] Create query key factory
- [x] Implement query hooks for data fetching
- [x] Implement mutation hooks for data modifications
- [x] Add optimistic updates
- [x] Write tests for hooks
- [ ] Migrate remaining Zustand stores
- [ ] Remove old data fetching logic
- [ ] Update components to use new hooks

## Testing

### Testing Queries

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

it('should fetch projects', async () => {
  const { result } = renderHook(() => useProjectsQuery(), { wrapper });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(result.current.data).toHaveLength(2);
});
```

### Testing Mutations

```typescript
it('should create project', async () => {
  const { result } = renderHook(() => useCreateProjectMutation(), { wrapper });

  await result.current.mutateAsync({
    title: 'New Project',
    idea: 'Great idea',
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
});
```

## DevTools

React Query DevTools are available in development mode:

1. Open your app in development
2. Look for the React Query icon in the bottom-right corner
3. Click to explore:
   - Active queries and their states
   - Cached data
   - Query timelines
   - Mutation history

## Performance Tips

### 1. Reduce Unnecessary Refetches

```typescript
const { data } = useProjectsQuery({
  staleTime: 1000 * 60 * 10, // 10 minutes
  refetchOnWindowFocus: false, // Don't refetch on focus
});
```

### 2. Paginate Large Lists

```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: queryKeys.projects.lists(),
  queryFn: ({ pageParam = 0 }) => fetchProjects(pageParam),
  getNextPageParam: lastPage => lastPage.nextCursor,
});
```

### 3. Use Selective Invalidation

```typescript
// Only invalidate specific project
queryClient.invalidateQueries({
  queryKey: queryKeys.projects.detail(projectId),
  exact: true,
});
```

## Common Issues

### Issue: Stale data showing after mutation

**Solution:** Ensure proper cache invalidation

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
};
```

### Issue: Query not refetching

**Solution:** Check if data is still fresh (within `staleTime`)

```typescript
const { refetch } = useQuery({
  staleTime: 0, // Always treat as stale
});
```

### Issue: Memory leaks in tests

**Solution:** Clear query client after each test

```typescript
afterEach(() => {
  queryClient.clear();
});
```

## Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Query Key Factory Pattern](https://tkdodo.eu/blog/effective-react-query-keys)
- [Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [Testing React Query](https://tkdodo.eu/blog/testing-react-query)
