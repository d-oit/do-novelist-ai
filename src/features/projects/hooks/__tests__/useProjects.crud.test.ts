import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { type Project, type Language } from '../../../../types';
import { PublishStatus } from '../../../../types';
import { projectService } from '../../services/projectService';
import { type ProjectCreationData, type ProjectUpdateData } from '../../types';
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
  timeline: {
    id: crypto.randomUUID(),
    projectId: '',
    events: [],
    eras: [],
    settings: {
      viewMode: 'chronological',
      zoomLevel: 1,
      showCharacters: true,
      showImplicitEvents: false,
    },
  },
  ...overrides,
});

describe('useProjects - CRUD Operations', () => {
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

  // Create Tests
  it('creates a new project', async () => {
    const creationData: ProjectCreationData = {
      title: 'New Project',
      idea: 'A new exciting story',
      style: {
        tone: 'dramatic',
        pacing: 'fast',
        perspective: 'first-person',
        tense: 'present',
        complexity: 'moderate',
      } as any,
      targetWordCount: 75000,
    } as any;

    const { result } = renderHook(() => useProjects());

    let createdProject: Project | undefined;
    await act(async () => {
      createdProject = await result.current.create(creationData);
    });

    expect(mockProjectService.create).toHaveBeenCalledWith(creationData);
    expect(result.current.projects).toHaveLength(1);
    expect(result.current.selectedProject).toEqual(createdProject);
  });

  it('updates stats after creating project', async () => {
    const creationData: ProjectCreationData = {
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

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.create(creationData);
    });

    expect(result.current.stats?.totalProjects).toBe(1);
  });

  it('throws error on create failure', async () => {
    mockProjectService.create.mockRejectedValue(new Error('Create failed'));

    const { result } = renderHook(() => useProjects());

    const creationData: ProjectCreationData = {
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

  // Update Tests
  it('updates an existing project', async () => {
    const existingProject = createMockProject({ title: 'Original Title' });
    mockProjectService.getAll.mockResolvedValue([existingProject]);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
    });

    const updateData: ProjectUpdateData = { title: 'Updated Title' } as any;

    await act(async () => {
      await result.current.update(existingProject.id, updateData);
    });

    expect(mockProjectService.update).toHaveBeenCalledWith(existingProject.id, updateData);
    expect(result.current.projects[0]?.title).toBe('Updated Title');
  });

  it('updates selected project when updating current selection', async () => {
    const existingProject = createMockProject({ title: 'Original' });
    mockProjectService.getAll.mockResolvedValue([existingProject]);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
      result.current.select(existingProject.id);
      result.current.loadStats();
    });

    await act(async () => {
      await result.current.update(existingProject.id, { title: 'Updated' });
    });

    expect(result.current.selectedProject?.title).toBe('Updated');
  });

  it('updates stats after updating project', async () => {
    const existingProject = createMockProject();
    mockProjectService.getAll.mockResolvedValue([existingProject]);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
    });

    await act(async () => {
      await result.current.update(existingProject.id, { status: PublishStatus.PUBLISHED as any });
    });

    expect(result.current.stats?.completedProjects).toBe(1);
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

  // Delete Tests
  it('deletes a project', async () => {
    const project1 = createMockProject({ title: 'Project 1' });
    const project2 = createMockProject({ title: 'Project 2' });
    mockProjectService.getAll.mockResolvedValue([project1, project2]);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
    });

    expect(result.current.projects).toHaveLength(2);

    await act(async () => {
      await result.current.delete(project1.id);
    });

    expect(mockProjectService.delete).toHaveBeenCalledWith(project1.id);
    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0]?.id).toBe(project2.id);
  });

  it('clears selection when deleting selected project', async () => {
    const project = createMockProject();
    mockProjectService.getAll.mockResolvedValue([project]);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
      result.current.select(project.id);
    });

    expect(result.current.selectedProject).not.toBeNull();

    await act(async () => {
      await result.current.delete(project.id);
    });

    expect(result.current.selectedProject).toBeNull();
  });

  it('updates stats after deleting project', async () => {
    const project = createMockProject();
    mockProjectService.getAll.mockResolvedValue([project]);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
      result.current.loadStats();
    });

    expect(result.current.stats?.totalProjects).toBe(1);

    await act(async () => {
      await result.current.delete(project.id);
    });

    expect(result.current.stats?.totalProjects).toBe(0);
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

  // Selection Tests
  it('selects a project by ID', async () => {
    const projects = [createMockProject({ title: 'Project 1' }), createMockProject({ title: 'Project 2' })];
    mockProjectService.getAll.mockResolvedValue(projects);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
    });

    expect(projects[0]).toBeDefined();

    act(() => {
      result.current.select(projects[0]!.id);
    });

    expect(result.current.selectedProject?.id).toBe(projects[0]!.id);
  });

  it('sets null when selecting non-existent project', async () => {
    const { result } = renderHook(() => useProjects());

    act(() => {
      result.current.select('non-existent-id');
    });

    expect(result.current.selectedProject).toBeNull();
  });
});
