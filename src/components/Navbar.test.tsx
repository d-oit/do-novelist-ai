import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Navbar from '@/components/Navbar';

describe('Navbar', () => {
  const defaultProps = {
    projectTitle: 'Test Project',
    onNewProject: vi.fn(),
    currentView: 'dashboard' as const,
    onNavigate: vi.fn(),
  };

  it('renders the navbar with correct title', () => {
    render(<Navbar {...defaultProps} />);
    expect(screen.getByText('Novelist.ai')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('calls onNavigate when dashboard link is clicked', () => {
    render(<Navbar {...defaultProps} />);
    const dashboardLink = screen.getByTestId('nav-dashboard');
    fireEvent.click(dashboardLink);
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('dashboard');
  });

  it('calls onNewProject when new project button is clicked', () => {
    render(<Navbar {...defaultProps} />);
    const newProjectButton = screen.getByTestId('nav-new-project');
    fireEvent.click(newProjectButton);
    expect(defaultProps.onNewProject).toHaveBeenCalled();
  });

  it('highlights the current view', () => {
    render(<Navbar {...defaultProps} />);
    const dashboardLink = screen.getByTestId('nav-dashboard');
    expect(dashboardLink).toHaveClass('bg-primary text-primary-foreground');
  });
});
