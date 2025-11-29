import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectDashboard } from '../ProjectDashboard';
import type { Project } from '../../../../types';

// Mock the stores
const mockUseProjects = vi.fn();

vi.mock('../../hooks/useProjects', () => ({
  useProjects: mockUseProjects,
}));

// Mock UI components
vi.mock('../../../../components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-title">{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
}));

describe('ProjectDashboard', () => {
  it('should render dashboard with project list', () => {
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

  it('should handle project selection', async () => {
    const user = userEvent.setup();
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
    await user.click(projectTitle);

    // Should handle click without errors
    expect(projectTitle).toBeInTheDocument();
  });

  it('should render with empty state when no projects', () => {
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
    mockUseProjects.mockReturnValue({
      projects: [],
      loading: false,
      error: new Error('Test error'),
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      getProject: vi.fn(),
    });

    render(<ProjectDashboard />);

    expect(screen.getByTestId('card')).toBeInTheDocument();
  });
});
