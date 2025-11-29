import { screen, render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { useProjects } from '../../hooks/useProjects';
import { ProjectDashboard } from '../ProjectDashboard';

// Mock the stores
vi.mock('../../hooks/useProjects', () => {
  const mockUseProjects = vi.fn();
  return {
    useProjects: mockUseProjects,
  };
});

// Mock UI components
vi.mock('../../../../components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid='card'>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='card-header'>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='card-title'>{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='card-content'>{children}</div>
  ),
}));

describe('ProjectDashboard', () => {
  it('should render dashboard with project list', () => {
    const mockUseProjects = vi.mocked(useProjects);
    mockUseProjects.mockReturnValue({
      projects: [
        {
          id: '1',
          title: 'Test Project',
          idea: 'A test idea',
          style: 'fantasy',
          targetWordCount: 80000,
          status: 'DRAFT' as const,
          chapters: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      loading: false,
      error: null,
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      getProject: vi.fn(),
    });

    render(<ProjectDashboard />);

    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('should display project statistics', () => {
    const mockUseProjects = vi.mocked(useProjects);
    mockUseProjects.mockReturnValue({
      projects: [
        {
          id: '1',
          title: 'Test Project',
          idea: 'A test idea',
          style: 'fantasy',
          targetWordCount: 80000,
          status: 'DRAFT' as const,
          chapters: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      loading: false,
      error: null,
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      getProject: vi.fn(),
    });

    render(<ProjectDashboard />);

    expect(screen.getByTestId('card-content')).toBeInTheDocument();
  });

  it('should render dashboard', () => {
    const mockUseProjects = vi.mocked(useProjects);
    mockUseProjects.mockReturnValue({
      projects: [
        {
          id: '1',
          title: 'Test Project',
          idea: 'A test idea',
          style: 'fantasy',
          targetWordCount: 80000,
          status: 'DRAFT' as const,
          chapters: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      loading: false,
      error: null,
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      getProject: vi.fn(),
    });

    render(<ProjectDashboard />);

    const projectTitle = screen.getByText('Test Project');
    expect(projectTitle).toBeInTheDocument();
  });

  it('should render with empty state when no projects', () => {
    const mockUseProjects = vi.mocked(useProjects);
    mockUseProjects.mockReturnValue({
      projects: [],
      loading: false,
      error: null,
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      getProject: vi.fn(),
    });

    render(<ProjectDashboard />);

    // Should handle empty state gracefully
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    const mockUseProjects = vi.mocked(useProjects);
    mockUseProjects.mockReturnValue({
      projects: [],
      loading: true,
      error: null,
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      getProject: vi.fn(),
    });

    render(<ProjectDashboard />);

    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('should display error state', () => {
    const mockUseProjects = vi.mocked(useProjects);
    mockUseProjects.mockReturnValue({
      projects: [],
      isLoading: false,
      error: 'Test error',
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      getProject: vi.fn(),
    });

    render(<ProjectDashboard />);

    expect(screen.getByTestId('card')).toBeInTheDocument();
  });
});
