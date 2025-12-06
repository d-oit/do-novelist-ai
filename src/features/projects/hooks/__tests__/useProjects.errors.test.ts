import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { type Project, type Language } from '../../../../types';
import { PublishStatus } from '../../../../types';
import { projectService } from '../../services/projectService';
import { useProjects } from '../useProjects';

// Mock the project service
vi.mock('../../services/projectService');
const mockProjectService = vi.mocked(projectService);

const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: crypto.randomUUID(),
  title: 'Test Project',
  idea: 'A thrilling adventure story',
  style: {
    tone: 'dramatic',
    pacing: 'fast',
    perspective: 'third-person',
    tense: 'past',
    complexity: 'moderate',
  } as any,
  status: PublishStatus.DRAFT as any,
  chapters: [],
  coverImage: '',
  createdAt: new Date(Date.now() - 86400000),
  updatedAt: new Date(),
  worldState: {
    hasTitle: true,
    hasOutline: false,
    chaptersCount: 0,
    chaptersCompleted: 0,
    styleDefined: true,
    isPublished: false,
    hasCharacters: false,
    hasWorldBuilding: false,
    hasThemes: false,
    plotStructureDefined: false,
    targetAudienceDefined: false,
  },
  isGenerating: false,
  language: 'en' as Language,
  targetWordCount: 50000,
  settings: {
    enableDropCaps: true,
  },
  genre: ['fantasy'],
  targetAudience: 'adult',
  contentWarnings: [],
  keywords: [],
  synopsis: '',
  authors: [],
  analytics: {
    totalWordCount: 0,
    averageChapterLength: 0,
    estimatedReadingTime: 0,
    generationCost: 0,
    editingRounds: 0,
  },
  version: '1.0.0',
  changeLog: [],
  ...overrides,
});

describe('useProjects - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset Zustand store state
    useProjects.setState({
      projects: [],
      selectedProject: null,
      stats: null,
      filters: {
        search: '',
        status: 'all',
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      },
      isLoading: false,
      error: null,
    });

    mockProjectService.init.mockResolvedValue();
    mockProjectService.getAll.mockResolvedValue([]);
    mockProjectService.create.mockImplementation(async data =>
      createMockProject({ title: data.title, idea: data.idea }),
    );
    mockProjectService.update.mockResolvedValue();
    mockProjectService.delete.mockResolvedValue();
  });

  // Error Management Tests
  it('clears error state', async () => {
    mockProjectService.getAll.mockRejectedValue(new Error('Load error'));

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
    });

    expect(result.current.error).toBe('Load error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('handles initialization errors', async () => {
    mockProjectService.init.mockRejectedValue(new Error('Init failed'));

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.init();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Init failed');
    });
  });

  it('handles load errors', async () => {
    mockProjectService.getAll.mockRejectedValue(new Error('Load failed'));

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Load failed');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('throws error on create failure', async () => {
    mockProjectService.create.mockRejectedValue(new Error('Create failed'));

    const { result } = renderHook(() => useProjects());

    const creationData = {
      title: 'New Project',
      idea: 'Test idea',
      style: {
        tone: 'dramatic',
        pacing: 'fast',
        perspective: 'third-person',
        tense: 'past',
        complexity: 'moderate',
      } as any,
    } as any;

    await expect(async () => {
      await act(async () => {
        await result.current.create(creationData);
      });
    }).rejects.toThrow('Create failed');
  });

  it('throws error on update failure', async () => {
    const existingProject = createMockProject();
    mockProjectService.getAll.mockResolvedValue([existingProject]);
    mockProjectService.update.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
    });

    await expect(async () => {
      await act(async () => {
        await result.current.update(existingProject.id, { title: 'Updated' });
      });
    }).rejects.toThrow('Update failed');
  });

  it('throws error on delete failure', async () => {
    const project = createMockProject();
    mockProjectService.getAll.mockResolvedValue([project]);
    mockProjectService.delete.mockRejectedValue(new Error('Delete failed'));

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
    });

    await expect(async () => {
      await act(async () => {
        await result.current.delete(project.id);
      });
    }).rejects.toThrow('Delete failed');
  });

  // Edge Cases and Error Scenarios
  it('handles empty project list gracefully', async () => {
    mockProjectService.getAll.mockResolvedValue([]);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
    });

    expect(result.current.projects).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('handles null selected project gracefully', () => {
    const { result } = renderHook(() => useProjects());

    expect(result.current.selectedProject).toBeNull();

    // Should not throw when selecting non-existent project
    act(() => {
      result.current.select('non-existent-id');
    });

    expect(result.current.selectedProject).toBeNull();
  });

  it('handles concurrent operations without race conditions', async () => {
    const { result } = renderHook(() => useProjects());

    // Simulate concurrent operations - wrap each loadAll call in act
    await act(async () => {
      const operations = [result.current.loadAll(), result.current.loadAll(), result.current.loadAll()];
      await Promise.all(operations);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('maintains state consistency during errors', async () => {
    const project = createMockProject();
    mockProjectService.getAll.mockResolvedValue([project]);
    mockProjectService.update.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
    });

    const originalProjects = [...result.current.projects];
    const originalSelected = result.current.selectedProject;

    // Attempt update that fails
    await act(async () => {
      try {
        await result.current.update(project.id, { title: 'Updated' });
      } catch {
        // Expected error
      }
    });

    // State should remain consistent
    expect(result.current.projects).toEqual(originalProjects);
    expect(result.current.selectedProject).toEqual(originalSelected);
    expect(result.current.error).toBe('Update failed');
  });

  it('handles malformed project data gracefully', async () => {
    const malformedProject = {
      id: 'test-id',
      // Missing required fields
    } as any;

    mockProjectService.getAll.mockResolvedValue([malformedProject]);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
    });

    // Should handle gracefully without crashing
    expect(result.current.projects).toBeDefined();
  });

  it('clears error before new operations', async () => {
    mockProjectService.getAll.mockRejectedValue(new Error('First error'));

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
    });

    expect(result.current.error).toBe('First error');

    // Reset mock to succeed
    mockProjectService.getAll.mockResolvedValue([]);

    await act(async () => {
      await result.current.loadAll();
    });

    expect(result.current.error).toBeNull();
  });

  it('handles service unavailability gracefully', async () => {
    // Mock service to throw network-like errors
    mockProjectService.getAll.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.isLoading).toBe(false);
  });
});
