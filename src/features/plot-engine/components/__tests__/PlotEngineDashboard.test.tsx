import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { PlotEngineDashboard } from '@/features/plot-engine/components/PlotEngineDashboard';

// Mock lazy imports to use actual components for testing
vi.mock('@/features/plot-engine/components/lazy-plot-engine', async () => {
  const { PlotAnalyzer } = await import('@/features/plot-engine/components/PlotAnalyzer');
  const { PlotGenerator } = await import('@/features/plot-engine/components/PlotGenerator');
  const { StoryArcVisualizer } = await import('@/features/plot-engine/components/StoryArcVisualizer');
  const { CharacterGraphView } = await import('@/features/plot-engine/components/CharacterGraphView');
  const { PlotHoleDetectorView } = await import('@/features/plot-engine/components/PlotHoleDetectorView');

  return {
    LazyPlotAnalyzer: PlotAnalyzer,
    LazyPlotGenerator: PlotGenerator,
    LazyStoryArcVisualizer: StoryArcVisualizer,
    LazyCharacterGraphView: CharacterGraphView,
    LazyPlotHoleDetectorView: PlotHoleDetectorView,
  };
});

describe('PlotEngineDashboard', () => {
  const mockProjectId = 'test-project-1';

  it('should render dashboard with title', () => {
    render(<PlotEngineDashboard projectId={mockProjectId} />);

    expect(screen.getByText('Plot Engine')).toBeInTheDocument();
    expect(screen.getByText(/AI-powered plot analysis/i)).toBeInTheDocument();
  });

  it('should render all tabs', () => {
    render(<PlotEngineDashboard projectId={mockProjectId} />);

    expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
    expect(screen.getByTestId('tab-structure')).toBeInTheDocument();
    expect(screen.getByTestId('tab-characters')).toBeInTheDocument();
    expect(screen.getByTestId('tab-plot-holes')).toBeInTheDocument();
    expect(screen.getByTestId('tab-generator')).toBeInTheDocument();
  });

  it('should switch tabs when clicked', () => {
    render(<PlotEngineDashboard projectId={mockProjectId} />);

    const structureTab = screen.getByTestId('tab-structure');
    fireEvent.click(structureTab);

    // Check if tab is active (has primary background)
    expect(structureTab).toHaveClass('bg-primary');
  });

  it('should show PlotAnalyzer on overview tab', () => {
    render(<PlotEngineDashboard projectId={mockProjectId} />);

    // PlotAnalyzer should be visible by default
    expect(screen.getByTestId('analyze-button')).toBeInTheDocument();
  });

  it('should call onGeneratePlot when generate button is clicked', async () => {
    const mockOnGeneratePlot = vi.fn().mockResolvedValue({
      plotStructure: { acts: [] },
      suggestions: [],
      alternatives: [],
      confidence: 0.8,
      generatedAt: new Date(),
    });

    render(<PlotEngineDashboard projectId={mockProjectId} onGeneratePlot={mockOnGeneratePlot} />);

    const generateButton = screen.getByTestId('generate-plot-button');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockOnGeneratePlot).toHaveBeenCalled();
    });
  });

  it('should show empty state when switching to tabs without analysis', () => {
    render(<PlotEngineDashboard projectId={mockProjectId} />);

    // Switch to structure tab
    fireEvent.click(screen.getByTestId('tab-structure'));

    // Should show empty state
    expect(screen.getByText(/Run analysis first/i)).toBeInTheDocument();
  });

  it('should disable generate button while generating', async () => {
    const mockOnGeneratePlot = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<PlotEngineDashboard projectId={mockProjectId} onGeneratePlot={mockOnGeneratePlot} />);

    const generateButton = screen.getByTestId('generate-plot-button');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(generateButton).toBeDisabled();
      expect(generateButton).toHaveTextContent(/Generating/i);
    });
  });

  it('should show generator tab content', () => {
    render(<PlotEngineDashboard projectId={mockProjectId} />);

    fireEvent.click(screen.getByTestId('tab-generator'));

    expect(screen.getByText('Plot Generator')).toBeInTheDocument();
    expect(screen.getByTestId('generate-button')).toBeInTheDocument();
  });
});
